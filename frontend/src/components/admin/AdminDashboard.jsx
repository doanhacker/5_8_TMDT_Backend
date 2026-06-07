import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import * as orderApi from '../../services/orderApi'
import { FiDollarSign, FiShoppingCart, FiBox, FiTrendingUp } from 'react-icons/fi'

const toCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`

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
  orders = [],
  products = [],
  customers = [],
  lowStockItems = [],
  comments = [],
  onNavigate,
}) {
  // Global stats state
  const [globalStartDate, setGlobalStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [globalEndDate, setGlobalEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [globalStats, setGlobalStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loadingGlobal, setLoadingGlobal] = useState(false)

  // Product specific stats state
  const [productStartDate, setProductStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [productEndDate, setProductEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [productStats, setProductStats] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(false)

  // Basic computed states from props
  const orderStatusCounts = useMemo(() => orders.reduce((acc, order) => {
    const status = order.status || "UNKNOWN"
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {}), [orders])

  const productHealth = useMemo(() => products.reduce((acc, product) => {
    const stock = Number(product.stock || 0)
    acc.total += 1
    if (product.status === "DISCONTINUED") { acc.discontinued += 1; return acc }
    if (product.status === "COMING_SOON") { acc.comingSoon += 1; return acc }
    if (stock <= 0 || product.status === "OUT_OF_STOCK") { acc.outOfStock += 1; return acc }
    if (stock <= 10) { acc.lowStock += 1; return acc }
    acc.healthy += 1
    return acc
  }, { total: 0, healthy: 0, lowStock: 0, outOfStock: 0, discontinued: 0, comingSoon: 0 }), [products])

  const reviewInsights = useMemo(() => comments.reduce((acc, comment) => {
    const rating = Number(comment.rating || 0)
    acc.total += 1
    acc.ratingSum += rating
    if (rating <= 3) acc.lowRated += 1
    return acc
  }, { total: 0, ratingSum: 0, lowRated: 0 }), [comments])

  const averageRating = reviewInsights.total ? (reviewInsights.ratingSum / reviewInsights.total).toFixed(1) : "0.0"

  const filteredProductsForSelect = useMemo(() => {
    if (!productSearchTerm.trim()) return products.slice(0, 50)
    return products.filter(p => 
      String(p.name || "").toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      String(p.id || "").toLowerCase().includes(productSearchTerm.toLowerCase())
    ).slice(0, 50)
  }, [products, productSearchTerm])

  // Fetch Global Stats
  useEffect(() => {
    const fetchGlobal = async () => {
      setLoadingGlobal(true)
      try {
        const [statsRes, topRes] = await Promise.all([
          orderApi.getRevenueStats(globalStartDate, globalEndDate),
          orderApi.getTopProducts(globalStartDate, globalEndDate, 10)
        ])
        if (statsRes.success) setGlobalStats(statsRes.data)
        if (topRes.success) setTopProducts(topRes.data)
      } catch (err) {
        console.error("Lỗi lấy dữ liệu tổng quan:", err)
      } finally {
        setLoadingGlobal(false)
      }
    }
    fetchGlobal()
  }, [globalStartDate, globalEndDate])

  // Fetch Product Stats
  const fetchProductStats = async () => {
    if (!selectedProductId) return
    setLoadingProduct(true)
    try {
      const res = await orderApi.getRevenueStats(productStartDate, productEndDate, selectedProductId)
      if (res.success) setProductStats(res.data)
    } catch (err) {
      console.error("Lỗi lấy dữ liệu sản phẩm:", err)
    } finally {
      setLoadingProduct(false)
    }
  }

  useEffect(() => {
    fetchProductStats()
  }, [productStartDate, productEndDate, selectedProductId])

  const applyPreset = (days, type) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    const endStr = end.toISOString().split('T')[0]
    const startStr = start.toISOString().split('T')[0]
    
    if (type === 'global') {
      setGlobalStartDate(startStr)
      setGlobalEndDate(endStr)
    } else {
      setProductStartDate(startStr)
      setProductEndDate(endStr)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="adm-card" style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Doanh thu' ? toCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const selectedProductData = products.find(p => String(p.id) === String(selectedProductId))

  return (
    <div className="adm-dashboard-stack">
      {/* 1. Kpi tổng quan */}
      <section className="adm-executive-grid">
        <article className="adm-executive-card adm-executive-card-primary" style={{ gridColumn: 'span 2' }}>
          <span>Giá trị đơn TB (kỳ báo cáo)</span>
          <strong>
            {globalStats && globalStats.summary.totalOrders > 0 
              ? toCurrency(globalStats.summary.totalRevenue / globalStats.summary.totalOrders) 
              : "0đ"}
          </strong>
          <small>{globalStats?.summary.totalOrders || 0} đơn hoàn thành trong khoảng thời gian này</small>
        </article>
        <article className="adm-executive-card">
          <span>Đơn hàng chờ xử lý</span>
          <strong>{(orderStatusCounts.PENDING_CONFIRMATION || 0) + (orderStatusCounts.WAITING_FOR_STOCK || 0)}</strong>
          <small>{orderStatusCounts.SHIPPING || 0} đang giao</small>
        </article>
        <article className="adm-executive-card">
          <span>Tồn kho sắp hết</span>
          <strong>{productHealth.lowStock + productHealth.outOfStock}</strong>
          <small>{productHealth.healthy} SP ổn định</small>
        </article>
      </section>

      {/* 2. Biểu đồ doanh thu tổng và Top sản phẩm */}
      <section className="adm-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Biểu đồ doanh thu</h3>
            <span className="adm-pill adm-pill-muted">Kỳ: {globalStartDate} - {globalEndDate}</span>
          </div>
          <div style={{ height: 300, width: '100%', marginTop: '20px' }}>
            {loadingGlobal ? (
              <p className="adm-muted" style={{ textAlign: 'center', marginTop: '100px' }}>Đang tải biểu đồ...</p>
            ) : globalStats?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalStats.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6c757d', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6c757d', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}tr`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#007bff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="adm-muted" style={{ textAlign: 'center', marginTop: '100px' }}>Không có dữ liệu</p>
            )}
          </div>
        </section>

        <section className="adm-card adm-card-pad">
          <div className="adm-card-title">
            <h3>Top sản phẩm bán chạy</h3>
            <span className="adm-pill adm-pill-muted">Trong kỳ báo cáo</span>
          </div>
          <div className="adm-table-wrap" style={{ marginTop: '15px' }}>
            {loadingGlobal ? (
              <p className="adm-muted">Đang tải danh sách...</p>
            ) : (
              <table className="adm-table2" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px' }}>Tên sản phẩm</th>
                    <th style={{ padding: '8px' }}>Đã bán</th>
                    <th style={{ padding: '8px' }}>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={p.product_id}>
                      <td style={{ padding: '8px' }}>{idx + 1}</td>
                      <td style={{ padding: '8px' }}>{p.product_name}</td>
                      <td style={{ padding: '8px' }}>{p.quantity_sold}</td>
                      <td style={{ padding: '8px' }}>{toCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="adm-muted" style={{ textAlign: 'center' }}>Chưa có dữ liệu.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </section>

      {/* 3. Phân tích theo từng sản phẩm */}
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>Doanh thu theo sản phẩm & theo ngày</h3>
          <p className="adm-muted">Chọn sản phẩm và khoảng thời gian để xem biểu đồ doanh thu, số lượng bán từng ngày.</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Tìm sản phẩm</label>
            <input 
              type="text" 
              className="adm-input" 
              placeholder="Nhập tên, mã..." 
              value={productSearchTerm}
              onChange={e => setProductSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Chọn sản phẩm</label>
            <select 
              className="adm-input" 
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {filteredProductsForSelect.map(p => (
                <option key={p.id} value={p.id}>#{p.id} - {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Từ ngày</label>
            <input 
              type="date" 
              className="adm-input" 
              value={productStartDate}
              onChange={e => setProductStartDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Đến ngày</label>
            <input 
              type="date" 
              className="adm-input" 
              value={productEndDate}
              onChange={e => setProductEndDate(e.target.value)}
            />
          </div>
          <div>
             <button className="adm-btn adm-btn-primary" onClick={fetchProductStats} disabled={loadingProduct || !selectedProductId}>
               Xem thống kê
             </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '13px', marginRight: '10px' }}>Preset nhanh:</span>
          <button className="adm-pill adm-pill-muted" onClick={() => applyPreset(7, 'product')} style={{ cursor: 'pointer', border: 'none' }}>7 ngày</button>
          <button className="adm-pill adm-pill-muted" onClick={() => applyPreset(30, 'product')} style={{ cursor: 'pointer', border: 'none', marginLeft: '5px' }}>30 ngày</button>
          <button className="adm-pill adm-pill-muted" onClick={() => applyPreset(90, 'product')} style={{ cursor: 'pointer', border: 'none', marginLeft: '5px' }}>90 ngày</button>
        </div>

        {selectedProductData && productStats && (
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h4 style={{ margin: 0 }}>{selectedProductData.name}</h4>
                <p className="adm-muted" style={{ margin: '5px 0 0 0', fontSize: '13px' }}>Giá hiện tại: {toCurrency(selectedProductData.price)}</p>
              </div>
              <span className="adm-pill">{productStartDate} - {productEndDate}</span>
            </div>

            <div className="adm-executive-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <article className="adm-executive-card" style={{ background: '#2c3e50', color: 'white', border: 'none' }}>
                <span style={{ color: '#cbd5e1' }}>Tổng doanh thu</span>
                <strong style={{ color: 'white' }}>{toCurrency(productStats.summary.totalRevenue)}</strong>
              </article>
              <article className="adm-executive-card">
                <span>Tổng số lượng bán</span>
                <strong>{productStats.summary.totalQuantity}</strong>
                <small>Sản phẩm đã giao thành công</small>
              </article>
              <article className="adm-executive-card">
                <span>Số đơn hàng</span>
                <strong>{productStats.summary.totalOrders}</strong>
                <small>Đơn hàng COMPLETED</small>
              </article>
              <article className="adm-executive-card">
                <span>Doanh thu TB/ngày</span>
                <strong>{toCurrency(Math.round(productStats.summary.totalRevenue / productStats.chartData.length || 1))}</strong>
                <small>Trung bình mỗi ngày</small>
              </article>
            </div>
          </div>
        )}

        {productStats && (
          <div style={{ height: 400, width: '100%' }}>
            <h4 style={{ marginBottom: '15px' }}>Biểu đồ doanh thu & số lượng theo ngày</h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={productStats.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6c757d', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: '#6c757d', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}tr`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6c757d', fontSize: 12 }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" barSize={30} fill="#2c3e50" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="quantity_sold" name="Số lượng bán" stroke="#f39c12" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
