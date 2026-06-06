import { useMemo } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const toCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`

const formatAxisMoney = (value) => {
  const num = Number(value || 0)
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`
  if (num >= 1_000_000) return `${Math.round(num / 1_000_000)} tr`
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`
  return String(num)
}

const getStockBadgeClass = (stock) => {
  const qty = Number(stock || 0)
  if (qty <= 0) return "danger"
  if (qty <= 10) return "warn"
  return "ok"
}

const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload || {}
  return (
    <div className="adm-chart-tooltip">
      <strong>{item.period_label || "--"}</strong>
      <p>Doanh thu: {toCurrency(item.revenue)}</p>
      <p>Số đơn: {Number(item.order_count || 0).toLocaleString("vi-VN")}</p>
      <p>AOV: {toCurrency(item.avg_order_value)}</p>
    </div>
  )
}

const statusLabelMap = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  WAITING_FOR_STOCK: "Chờ có hàng",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

const getProductStatusMeta = (status, stock) => {
  if (status === "DISCONTINUED") return { tone: "danger", label: "Ngừng bán" }
  if (status === "COMING_SOON") return { tone: "muted", label: "Sắp mở bán" }
  if (status === "OUT_OF_STOCK" || Number(stock || 0) <= 0) return { tone: "danger", label: "Hết hàng" }
  if (Number(stock || 0) <= 10) return { tone: "warn", label: "Sắp hết" }
  return { tone: "ok", label: "Ổn định" }
}

const getHealthTone = (value, warnThreshold, dangerThreshold) => {
  if (value >= dangerThreshold) return "danger"
  if (value >= warnThreshold) return "warn"
  return "ok"
}

export default function AdminDashboard({
  revenueSummary,
  revenueHistory = [],
  topProducts = [],
  cancelReasons = [],
  revenuePeriod = "monthly",
  onRevenuePeriodChange,
  topProductsDays = 30,
  onTopProductsDaysChange,
  analyticsLoading = false,
  analyticsError = "",
  orders = [],
  products = [],
  customers = [],
  lowStockItems = [],
  comments = [],
  onNavigate,
}) {
  const orderStatusCounts = orders.reduce((accumulator, order) => {
    const status = order.status || "UNKNOWN"
    accumulator[status] = (accumulator[status] || 0) + 1
    return accumulator
  }, {})

  const urgentOrders = orders
    .filter((order) => ["PENDING_CONFIRMATION", "WAITING_FOR_STOCK", "SHIPPING"].includes(order.status))
    .sort((left, right) => Number(right.total || 0) - Number(left.total || 0))
    .slice(0, 6)

  const productHealth = products.reduce((accumulator, product) => {
    const stock = Number(product.stock || 0)
    accumulator.total += 1

    if (product.status === "DISCONTINUED") {
      accumulator.discontinued += 1
      return accumulator
    }

    if (product.status === "COMING_SOON") {
      accumulator.comingSoon += 1
      return accumulator
    }

    if (stock <= 0 || product.status === "OUT_OF_STOCK") {
      accumulator.outOfStock += 1
      return accumulator
    }

    if (stock <= 10) {
      accumulator.lowStock += 1
      return accumulator
    }

    accumulator.healthy += 1
    return accumulator
  }, {
    total: 0,
    healthy: 0,
    lowStock: 0,
    outOfStock: 0,
    discontinued: 0,
    comingSoon: 0,
  })

  const customerSegments = customers.reduce((accumulator, customer) => {
    const segment = customer.segment || "Mới"
    accumulator.total += 1
    accumulator[segment] = (accumulator[segment] || 0) + 1
    if (customer.status === "locked") {
      accumulator.locked += 1
    }
    return accumulator
  }, { total: 0, locked: 0, "Mới": 0, "Thân thiết": 0, VIP: 0 })

  const customerWatchlist = [...customers]
    .sort((left, right) => Number(right.totalSpent || 0) - Number(left.totalSpent || 0))
    .slice(0, 5)

  const reviewInsights = comments.reduce((accumulator, comment) => {
    const rating = Number(comment.rating || 0)
    accumulator.total += 1
    accumulator.ratingSum += rating
    if (rating <= 3) accumulator.lowRated += 1
    return accumulator
  }, { total: 0, ratingSum: 0, lowRated: 0 })

  const averageRatingFromComments = reviewInsights.total
    ? (reviewInsights.ratingSum / reviewInsights.total).toFixed(1)
    : null

  const displayRating = analyticsLoading
    ? "--"
    : Number(revenueSummary?.avgRating || averageRatingFromComments || 0).toFixed(1)

  const chartData = useMemo(
    () => (Array.isArray(revenueHistory) ? revenueHistory : []),
    [revenueHistory]
  )

  const revenuePeriodTabs = [
    { id: "monthly", label: "Theo tháng" },
    { id: "weekly", label: "Theo tuần" },
  ]

  const topProductDayOptions = [
    { value: 7, label: "7 ngày" },
    { value: 30, label: "30 ngày" },
    { value: 90, label: "90 ngày" },
  ]

  const formatMetric = (value, formatter = (item) => item) => {
    if (analyticsLoading) return "--"
    if (value === undefined || value === null) return "--"
    return formatter(value)
  }

  const actionCenter = [
    {
      id: "pending-orders",
      title: "Đơn cần xác nhận",
      description: `${orderStatusCounts.PENDING_CONFIRMATION || 0} đơn đang chờ chốt`,
      tone: getHealthTone(orderStatusCounts.PENDING_CONFIRMATION || 0, 3, 8),
      module: "orders",
      cta: "Mở đơn hàng",
    },
    {
      id: "waiting-stock",
      title: "Đơn chờ tồn kho",
      description: `${orderStatusCounts.WAITING_FOR_STOCK || 0} đơn có nguy cơ trễ cam kết`,
      tone: getHealthTone(orderStatusCounts.WAITING_FOR_STOCK || 0, 2, 5),
      module: "inventory",
      cta: "Kiểm tra kho",
    },
    {
      id: "low-stock",
      title: "Sản phẩm sắp hết",
      description: `${lowStockItems.length} biến thể dưới ngưỡng an toàn`,
      tone: getHealthTone(lowStockItems.length, 4, 8),
      module: "inventory",
      cta: "Nhập kho ngay",
    },
    {
      id: "customer-risk",
      title: "Tài khoản bị khóa",
      description: `${customerSegments.locked} khách đang bị khóa`,
      tone: getHealthTone(customerSegments.locked, 1, 3),
      module: "customers",
      cta: "Xem khách hàng",
    },
    {
      id: "review-risk",
      title: "Đánh giá cần xử lý",
      description: `${reviewInsights.lowRated} đánh giá từ 3 sao trở xuống`,
      tone: getHealthTone(reviewInsights.lowRated, 2, 5),
      module: "content",
      cta: "Duyệt nội dung",
    },
  ]

  const focusModules = [
    {
      id: "orders",
      label: "Điều phối đơn hàng",
      value: `${(orderStatusCounts.PENDING_CONFIRMATION || 0) + (orderStatusCounts.WAITING_FOR_STOCK || 0)} việc`,
      note: "Ưu tiên xác nhận, xử lý đơn chờ hàng và giảm hủy đơn.",
    },
    {
      id: "inventory",
      label: "Kiểm soát tồn kho",
      value: `${productHealth.lowStock + productHealth.outOfStock} sản phẩm`,
      note: "Theo dõi mã sắp hết, hết hàng và lập kế hoạch nhập.",
    },
    {
      id: "customers",
      label: "Chăm sóc khách hàng",
      value: `${customerSegments.VIP || 0} VIP`,
      note: "Tập trung nhóm chi tiêu cao, khách thân thiết và tài khoản bị khóa.",
    },
    {
      id: "content",
      label: "Chất lượng nội dung",
      value: `${reviewInsights.lowRated} cảnh báo`,
      note: "Xử lý review xấu và giữ hình ảnh thương hiệu ổn định.",
    },
  ]

  return (
    <div className="adm-dashboard-stack">
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <div>
            <h3>Trung tâm điều hành</h3>
            <p className="adm-muted">Theo dõi vận hành, phát hiện điểm nghẽn và mở nhanh đúng khu vực cần xử lý.</p>
          </div>
          <span className="adm-pill">Deep Admin</span>
        </div>

        <div className="adm-executive-grid">
          <article className="adm-executive-card adm-executive-card-primary">
            <span>Doanh thu tháng</span>
            <strong>{formatMetric(revenueSummary?.month, toCurrency)}</strong>
            <small>
              {formatMetric(revenueSummary?.completedOrders, (v) => `${v} đơn hoàn thành`)}
              {analyticsLoading ? "" : `, AOV ${toCurrency(Math.round(revenueSummary?.avgOrder || 0))}`}
            </small>
          </article>
          <article className="adm-executive-card">
            <span>Sức khỏe đơn hàng</span>
            <strong>{formatMetric(revenueSummary?.ordersPending ?? ((orderStatusCounts.PENDING_CONFIRMATION || 0) + (orderStatusCounts.WAITING_FOR_STOCK || 0)))}</strong>
            <small>
              {orderStatusCounts.SHIPPING || 0} đơn đang giao, tỷ lệ hủy {formatMetric(revenueSummary?.cancelRate, (v) => `${v}%`)}
            </small>
          </article>
          <article className="adm-executive-card">
            <span>Sức khỏe tồn kho</span>
            <strong>{formatMetric(revenueSummary?.lowStockCount ?? (productHealth.lowStock + productHealth.outOfStock))}</strong>
            <small>
              {productHealth.healthy} sản phẩm ổn định, {formatMetric(revenueSummary?.outOfStockCount, (v) => `${v} hết hàng`)}
            </small>
          </article>
          <article className="adm-executive-card">
            <span>Chất lượng dịch vụ</span>
            <strong>{analyticsLoading ? "--" : `${displayRating}/5`}</strong>
            <small>
              {reviewInsights.lowRated} đánh giá tiêu cực, {formatMetric(revenueSummary?.totalCustomers ?? (customerSegments.VIP || 0), (v) => `${v} khách hàng`)}
            </small>
          </article>
        </div>
        {analyticsError ? <p className="adm-form-error">{analyticsError}</p> : null}
      </section>

      <section className="adm-grid">
        <section className="adm-card adm-card-pad adm-chart-card">
          <div className="adm-card-title">
            <div>
              <h3>Biểu đồ doanh thu</h3>
              <p className="adm-muted">6 chu kỳ gần nhất từ đơn hàng hoàn thành.</p>
            </div>
            <div className="adm-chart-tabs">
              {revenuePeriodTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`adm-chart-tab ${revenuePeriod === tab.id ? "is-active" : ""}`}
                  onClick={() => onRevenuePeriodChange?.(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="adm-chart-wrap">
            {analyticsLoading ? (
              <p className="adm-muted">Đang tải biểu đồ...</p>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7dac0" />
                  <XAxis dataKey="period_label" tick={{ fill: "#5e5649", fontSize: 12 }} />
                  <YAxis tickFormatter={formatAxisMoney} tick={{ fill: "#5e5649", fontSize: 12 }} width={72} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#304a79"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#304a79" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="adm-muted">Chưa có dữ liệu doanh thu để hiển thị.</p>
            )}
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <div>
              <h3>Top sản phẩm bán chạy</h3>
              <p className="adm-muted">Theo số lượng đã bán trong khoảng thời gian đã chọn.</p>
            </div>
            <select
              className="adm-select adm-chart-filter"
              value={topProductsDays}
              onChange={(event) => onTopProductsDaysChange?.(Number(event.target.value))}
            >
              {topProductDayOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table adm-top-products-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên sản phẩm</th>
                  <th>Đã bán</th>
                  <th>Doanh thu</th>
                  <th>Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {analyticsLoading ? (
                  <tr>
                    <td colSpan={5} className="adm-muted">Đang tải dữ liệu...</td>
                  </tr>
                ) : topProducts.length ? (
                  topProducts.map((item, index) => (
                    <tr key={item.product_id || index}>
                      <td>{index + 1}</td>
                      <td>{item.product_name || "--"}</td>
                      <td>{Number(item.sold_qty || 0).toLocaleString("vi-VN")}</td>
                      <td>{toCurrency(item.revenue)}</td>
                      <td>
                        <span className={`adm-status2 ${getStockBadgeClass(item.current_stock)}`}>
                          {Number(item.current_stock || 0).toLocaleString("vi-VN")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="adm-muted">Chưa có sản phẩm bán chạy trong khoảng thời gian này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {cancelReasons.length ? (
        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Tỷ lệ hủy theo lý do</h3>
            <span className="adm-pill adm-pill-muted">{cancelReasons.length} nhóm</span>
          </div>
          <div className="adm-status-matrix">
            {cancelReasons.map((item) => (
              <div key={item.reason} className="adm-status-cell">
                <span>{item.reason}</span>
                <strong>{item.count} ({item.percentage}%)</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="adm-grid">
        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Hàng chờ ưu tiên</h3>
            <span className="adm-pill adm-pill-muted">{actionCenter.length} nhóm việc</span>
          </div>
          <div className="adm-priority-list">
            {actionCenter.map((item) => (
              <article key={item.id} className={`adm-priority-card adm-priority-${item.tone}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <button type="button" className="adm-btn adm-btn-light" onClick={() => onNavigate?.(item.module)}>
                  {item.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Điều hướng theo nghiệp vụ</h3>
            <span className="adm-pill adm-pill-muted">Quick access</span>
          </div>
          <div className="adm-focus-grid">
            {focusModules.map((module) => (
              <button
                key={module.id}
                type="button"
                className="adm-focus-card"
                onClick={() => onNavigate?.(module.id)}
              >
                <span className="adm-focus-label">{module.label}</span>
                <strong>{module.value}</strong>
                <small>{module.note}</small>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="adm-grid">
        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Phân tầng đơn hàng</h3>
            <span className="adm-pill adm-pill-muted">{orders.length} đơn</span>
          </div>
          <div className="adm-status-matrix">
            {Object.entries(statusLabelMap).map(([status, label]) => (
              <div key={status} className="adm-status-cell">
                <span>{label}</span>
                <strong>{orderStatusCounts[status] || 0}</strong>
              </div>
            ))}
          </div>
          <div className="adm-list-block">
            <h4>Đơn có độ ưu tiên cao</h4>
            {urgentOrders.length ? (
              <ul className="adm-dashboard-list">
                {urgentOrders.map((order) => (
                  <li key={order.id}>
                    <div>
                      <strong>#{order.id} · {order.customer}</strong>
                      <p>{statusLabelMap[order.status] || order.status} · {order.type}</p>
                    </div>
                    <span>{toCurrency(order.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-muted">Không có đơn hàng nào đang ở nhóm cần ưu tiên.</p>
            )}
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Bản đồ tồn kho</h3>
            <span className="adm-pill adm-pill-muted">{products.length} sản phẩm</span>
          </div>
          <div className="adm-status-matrix">
            <div className="adm-status-cell">
              <span>Ổn định</span>
              <strong>{productHealth.healthy}</strong>
            </div>
            <div className="adm-status-cell">
              <span>Sắp hết</span>
              <strong>{productHealth.lowStock}</strong>
            </div>
            <div className="adm-status-cell">
              <span>Hết hàng</span>
              <strong>{productHealth.outOfStock}</strong>
            </div>
            <div className="adm-status-cell">
              <span>Sắp mở bán</span>
              <strong>{productHealth.comingSoon}</strong>
            </div>
          </div>
          <div className="adm-list-block">
            <h4>Mã cần nhập kho sớm</h4>
            {lowStockItems.length ? (
              <ul className="adm-dashboard-list">
                {lowStockItems.slice(0, 6).map((item) => {
                  const statusMeta = getProductStatusMeta(item.status, item.stock_quantity)
                  return (
                    <li key={item.variant_id}>
                      <div>
                        <strong>#{item.variant_id} · {item.product_name}</strong>
                        <p>{item.color_name || "Phiên bản mặc định"}</p>
                      </div>
                      <span className={`adm-status2 ${statusMeta.tone}`}>{Number(item.stock_quantity || 0)} sp</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="adm-muted">Hiện chưa có biến thể nào xuống dưới ngưỡng cảnh báo.</p>
            )}
          </div>
        </section>
      </section>

      <section className="adm-grid">
        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Theo dõi khách hàng</h3>
            <span className="adm-pill adm-pill-muted">{customers.length} hồ sơ</span>
          </div>
          <div className="adm-status-matrix">
            <div className="adm-status-cell">
              <span>Khách mới</span>
              <strong>{customerSegments["Mới"] || 0}</strong>
            </div>
            <div className="adm-status-cell">
              <span>Thân thiết</span>
              <strong>{customerSegments["Thân thiết"] || 0}</strong>
            </div>
            <div className="adm-status-cell">
              <span>VIP</span>
              <strong>{customerSegments.VIP || 0}</strong>
            </div>
            <div className="adm-status-cell">
              <span>Bị khóa</span>
              <strong>{customerSegments.locked || 0}</strong>
            </div>
          </div>
          <div className="adm-list-block">
            <h4>Khách cần chăm sóc sâu</h4>
            {customerWatchlist.length ? (
              <ul className="adm-dashboard-list">
                {customerWatchlist.map((customer) => (
                  <li key={customer.id}>
                    <div>
                      <strong>{customer.name}</strong>
                      <p>{customer.segment} · {customer.orders} đơn</p>
                    </div>
                    <span>{toCurrency(customer.totalSpent)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-muted">Chưa có dữ liệu khách hàng để phân tích.</p>
            )}
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Chất lượng phản hồi</h3>
            <span className="adm-pill adm-pill-muted">{comments.length} đánh giá</span>
          </div>
          <div className="adm-experience-metrics">
            <div className="adm-metric-box">
              <span>Điểm trung bình</span>
              <strong>{displayRating}/5</strong>
            </div>
            <div className="adm-metric-box">
              <span>Đánh giá xấu</span>
              <strong>{reviewInsights.lowRated}</strong>
            </div>
          </div>
          <div className="adm-list-block">
            <h4>Phản hồi nên xử lý sớm</h4>
            {comments.filter((comment) => Number(comment.rating || 0) <= 3).slice(0, 5).length ? (
              <ul className="adm-dashboard-list">
                {comments
                  .filter((comment) => Number(comment.rating || 0) <= 3)
                  .slice(0, 5)
                  .map((comment) => (
                    <li key={comment.id}>
                      <div>
                        <strong>{comment.user}</strong>
                        <p>{comment.product}</p>
                      </div>
                      <span className="adm-status2 warn">{comment.rating} sao</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="adm-muted">Chưa có đánh giá tiêu cực nào cần đẩy ưu tiên.</p>
            )}
          </div>
        </section>
      </section>
    </div>
  )
}
