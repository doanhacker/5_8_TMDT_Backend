import { useMemo, useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getProductRevenueByDay } from "../../services/adminApiEnhanced"

const toCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`

const formatAxisMoney = (value) => {
  const num = Number(value || 0)
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(".", ",")}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(".", ",")}tr`
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`
  return String(num)
}

const formatDayLabel = (day) => String(day || "").slice(5).replace("-", "/")

const formatInputDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const shiftDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() - days)
  return next
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload || {}
  return (
    <div className="adm-chart-tooltip">
      <strong>{point.day || "--"}</strong>
      <p>Doanh thu: {toCurrency(point.total_revenue)}</p>
      <p>Số lượng: {Number(point.total_qty || 0).toLocaleString("vi-VN")}</p>
      <p>Số đơn: {Number(point.order_count || 0).toLocaleString("vi-VN")}</p>
    </div>
  )
}

export default function ProductRevenueSection({ products = [] }) {
  const today = useMemo(() => formatInputDate(new Date()), [])
  const defaultFrom = useMemo(() => formatInputDate(shiftDays(new Date(), 30)), [])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)
  const [sortKey, setSortKey] = useState("total_revenue")
  const [sortDir, setSortDir] = useState("desc")

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return products.slice(0, 50)
    return products.filter((product) =>
      String(product.name || "").toLowerCase().includes(keyword) ||
      String(product.id || "").toLowerCase().includes(keyword) ||
      String(product.brand || "").toLowerCase().includes(keyword)
    ).slice(0, 50)
  }, [products, searchTerm])

  const chartData = useMemo(() => {
    const rows = Array.isArray(result?.chart_data) ? result.chart_data : []
    return rows.map((item) => ({
      ...item,
      day_label: formatDayLabel(item.day),
    }))
  }, [result])

  const tableRows = useMemo(() => {
    const rows = chartData.filter((item) => Number(item.total_revenue || 0) > 0)
    const peakRevenue = rows.reduce((max, item) => Math.max(max, Number(item.total_revenue || 0)), 0)

    const enriched = rows.map((item) => ({
      ...item,
      peak_percent: peakRevenue > 0
        ? Number(((Number(item.total_revenue || 0) / peakRevenue) * 100).toFixed(1))
        : 0,
    }))

    const direction = sortDir === "asc" ? 1 : -1
    return [...enriched].sort((left, right) => {
      if (sortKey === "day") {
        return left.day.localeCompare(right.day) * direction
      }
      return (Number(left[sortKey] || 0) - Number(right[sortKey] || 0)) * direction
    })
  }, [chartData, sortDir, sortKey])

  const applyPreset = (days) => {
    if (days === "year") {
      const now = new Date()
      setDateFrom(`${now.getFullYear()}-01-01`)
      setDateTo(formatInputDate(now))
      return
    }
    setDateFrom(formatInputDate(shiftDays(new Date(), days)))
    setDateTo(formatInputDate(new Date()))
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("desc")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!selectedProductId) {
      setError("Vui lòng chọn sản phẩm cần thống kê.")
      return
    }
    if (!dateFrom || !dateTo) {
      setError("Vui lòng chọn đầy đủ từ ngày và đến ngày.")
      return
    }
    if (dateFrom > dateTo) {
      setError("Từ ngày phải nhỏ hơn hoặc bằng đến ngày.")
      return
    }

    try {
      setLoading(true)
      const response = await getProductRevenueByDay({
        product_id: selectedProductId,
        date_from: dateFrom,
        date_to: dateTo,
      })
      setResult(response.data || null)
    } catch (err) {
      setResult(null)
      setError(err.message || "Không thể tải dữ liệu thống kê.")
    } finally {
      setLoading(false)
    }
  }

  const summary = result?.summary
  const productInfo = result?.product
  const xAxisInterval = chartData.length > 60 ? Math.ceil(chartData.length / 12) : 0

  return (
    <>
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <div>
            <h3>Doanh thu theo sản phẩm & theo ngày</h3>
            <p className="adm-muted">
              Chọn sản phẩm và khoảng thời gian để xem biểu đồ doanh thu, số lượng bán từng ngày.
            </p>
          </div>
        </div>

        <form className="adm-form-compact" onSubmit={handleSubmit}>
          <div className="adm-form-row">
            <label htmlFor="product-search">Tìm sản phẩm</label>
            <input
              id="product-search"
              type="text"
              placeholder="Nhập tên, mã hoặc thương hiệu..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="adm-form-row">
            <label htmlFor="product-select">Chọn sản phẩm</label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  #{product.id} · {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="adm-form-row">
            <label htmlFor="date-from">Từ ngày</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="adm-form-row">
            <label htmlFor="date-to">Đến ngày</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>

          <div className="adm-form-row">
            <label>Preset nhanh</label>
            <div className="adm-chart-tabs">
              <button type="button" className="adm-chart-tab" onClick={() => applyPreset(7)}>7 ngày</button>
              <button type="button" className="adm-chart-tab" onClick={() => applyPreset(30)}>30 ngày</button>
              <button type="button" className="adm-chart-tab" onClick={() => applyPreset(90)}>90 ngày</button>
              <button type="button" className="adm-chart-tab" onClick={() => applyPreset("year")}>Năm nay</button>
            </div>
          </div>

          <div className="adm-form-actions">
            <button type="submit" className="adm-btn adm-btn-primary" disabled={loading}>
              {loading ? "Đang tải..." : "Xem thống kê"}
            </button>
          </div>
        </form>

        {error ? <p className="adm-muted" style={{ color: "#b42318", marginTop: 12 }}>{error}</p> : null}
        {!loading && !result && !error ? (
          <p className="adm-muted" style={{ marginTop: 12 }}>
            Chọn sản phẩm và nhấn &quot;Xem thống kê&quot; để hiển thị biểu đồ chi tiết theo ngày.
          </p>
        ) : null}
      </section>

      {loading ? (
        <section className="adm-card adm-card-pad">
          <p className="adm-muted">Đang tải dữ liệu doanh thu sản phẩm...</p>
        </section>
      ) : null}

      {!loading && result ? (
        <>
          <section className="adm-card adm-card-pad">
            <div className="adm-card-title">
              <div>
                <h3>{productInfo?.product_name || "--"}</h3>
                <p className="adm-muted">
                  {productInfo?.brand_name || "Chưa có thương hiệu"}
                  {" · "}
                  {productInfo?.category_name || "Chưa có danh mục"}
                  {" · Giá: "}
                  {toCurrency(productInfo?.price)}
                </p>
              </div>
              <span className="adm-pill adm-pill-muted">
                {result?.period?.date_from} → {result?.period?.date_to}
              </span>
            </div>

            <div className="adm-executive-grid">
              <article className="adm-executive-card adm-executive-card-primary">
                <span>Tổng doanh thu</span>
                <strong>{toCurrency(summary?.total_revenue)}</strong>
                <small>{result?.period?.total_days || 0} ngày được thống kê</small>
              </article>
              <article className="adm-executive-card">
                <span>Tổng số lượng bán</span>
                <strong>{Number(summary?.total_qty || 0).toLocaleString("vi-VN")}</strong>
                <small>Sản phẩm đã giao thành công</small>
              </article>
              <article className="adm-executive-card">
                <span>Số đơn hàng</span>
                <strong>{Number(summary?.total_orders || 0).toLocaleString("vi-VN")}</strong>
                <small>Chỉ tính đơn COMPLETED</small>
              </article>
              <article className="adm-executive-card">
                <span>Doanh thu TB/ngày</span>
                <strong>{toCurrency(summary?.avg_daily_revenue)}</strong>
                <small>
                  {summary?.peak_day
                    ? `Cao nhất: ${summary.peak_day.day} (${toCurrency(summary.peak_day.total_revenue)})`
                    : "Chưa có ngày cao điểm"}
                </small>
              </article>
            </div>
          </section>

          <section className="adm-card adm-card-pad adm-chart-card">
            <div className="adm-card-title">
              <h3>Biểu đồ doanh thu & số lượng theo ngày</h3>
            </div>
            <div className="adm-chart-wrap">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7dac0" />
                    <XAxis
                      dataKey="day_label"
                      interval={xAxisInterval}
                      tick={{ fill: "#5e5649", fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={formatAxisMoney}
                      tick={{ fill: "#5e5649", fontSize: 12 }}
                      width={72}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "#5e5649", fontSize: 12 }}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="total_revenue" name="Doanh thu" fill="#304a79" radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="total_qty"
                      name="Số lượng bán"
                      stroke="#e67e22"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="adm-muted">Không có dữ liệu biểu đồ trong khoảng thời gian này.</p>
              )}
            </div>
          </section>

          <section className="adm-card adm-card-pad">
            <div className="adm-card-title">
              <h3>Bảng chi tiết theo ngày</h3>
              <span className="adm-pill adm-pill-muted">{tableRows.length} ngày có doanh thu</span>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table adm-top-products-table">
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="adm-btn adm-btn-light" onClick={() => handleSort("day")}>
                        Ngày
                      </button>
                    </th>
                    <th>
                      <button type="button" className="adm-btn adm-btn-light" onClick={() => handleSort("order_count")}>
                        Số đơn
                      </button>
                    </th>
                    <th>
                      <button type="button" className="adm-btn adm-btn-light" onClick={() => handleSort("total_qty")}>
                        Số lượng bán
                      </button>
                    </th>
                    <th>
                      <button type="button" className="adm-btn adm-btn-light" onClick={() => handleSort("total_revenue")}>
                        Doanh thu
                      </button>
                    </th>
                    <th>
                      <button type="button" className="adm-btn adm-btn-light" onClick={() => handleSort("peak_percent")}>
                        % so ngày cao nhất
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length ? (
                    tableRows.map((row) => (
                      <tr key={row.day}>
                        <td>{row.day}</td>
                        <td>{Number(row.order_count || 0).toLocaleString("vi-VN")}</td>
                        <td>{Number(row.total_qty || 0).toLocaleString("vi-VN")}</td>
                        <td>{toCurrency(row.total_revenue)}</td>
                        <td>{row.peak_percent}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="adm-muted">Không có ngày nào phát sinh doanh thu trong khoảng đã chọn.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </>
  )
}
