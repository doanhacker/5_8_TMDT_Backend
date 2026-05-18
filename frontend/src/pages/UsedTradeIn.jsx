import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiBatteryCharging,
  FiCheckCircle,
  FiChevronRight,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
} from "react-icons/fi"
import Footer from "../components/Footer"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"

const USED_KEYWORDS = ["cũ", "cu", "like new", "refurbished", "outlet", "đổi trả", "doi tra", "thu cũ", "thu cu"]

const TRADE_IN_STEPS = [
  "Chọn sản phẩm muốn lên đời và gửi thông tin máy cũ",
  "Kỹ thuật định giá trực tuyến trong 5-10 phút",
  "Mang máy đến cửa hàng để kiểm tra thực tế",
  "Bù chênh lệch và nhận máy mới ngay",
]

const normalize = (value) => String(value || "").toLowerCase()

const parseSold = (value) => {
  if (!value) return 0
  if (String(value).includes("k")) return Number(String(value).replace("k", "")) * 1000
  return Number(value) || 0
}

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)

const detectGrade = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""}`.toLowerCase()
  if (source.includes("like new")) return "Like New"
  if (source.includes("refurbished")) return "Refurbished"
  if (source.includes("đổi trả") || source.includes("doi tra")) return "Đổi trả"
  if (source.includes("outlet")) return "Outlet"
  return "Cũ đẹp"
}

const isUsedProduct = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""} ${(product?.features || []).join(" ")}`.toLowerCase()
  return USED_KEYWORDS.some((keyword) => source.includes(keyword))
}

const mapApiProductToUsedCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "Sản phẩm đã qua sử dụng",
  category: product?.deviceType || "Thiết bị",
  grade: detectGrade(product),
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  sold: String(product?.sold || "0"),
  cpu: product?.cpu || "Đang cập nhật",
  ram: product?.ram || "Đang cập nhật",
  storage: product?.storage || "Đang cập nhật",
  battery: product?.batteryCapacityMah ? `${product.batteryCapacityMah}%` : "Đang cập nhật",
  image: product?.image || "https://placehold.co/1200x900/e2e8f0/0f172a?text=Used+Product",
  note: (Array.isArray(product?.features) && product.features[0]) || "Sản phẩm được kiểm tra trước khi bán.",
})

export default function UsedTradeInPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products: apiProducts, loading } = useProducts()

  const [query, setQuery] = useState("")
  const [grade, setGrade] = useState("Tất cả")

  const usedProducts = useMemo(() => {
    const input = Array.isArray(apiProducts) ? apiProducts : []
    return input.filter(isUsedProduct).map(mapApiProductToUsedCard)
  }, [apiProducts])

  const gradeFilters = useMemo(() => ["Tất cả", ...new Set(usedProducts.map((item) => item.grade))], [usedProducts])

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    return usedProducts
      .filter((item) => {
        const matchQuery =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.cpu.toLowerCase().includes(q)
        const matchGrade = grade === "Tất cả" || item.grade === grade
        return matchQuery && matchGrade
      })
      .sort((a, b) => parseSold(b.sold) - parseSold(a.sold))
  }, [grade, query, usedProducts])

  return (
    <>
      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <span style={styles.heroKicker}>
              <FiRefreshCw size={14} /> Máy cũ, Thu cũ
            </span>
            <h1 style={styles.heroTitle}>Trang máy cũ và chương trình thu cũ đã lấy dữ liệu thật từ API.</h1>
            <p style={styles.heroSubtitle}>
              {loading ? "Đang đồng bộ dữ liệu từ API..." : "Thiết bị được kiểm định kỹ thuật, có bảo hành và hỗ trợ trả góp linh hoạt."}
            </p>

            <div style={styles.searchWrap}>
              <FiSearch size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm MacBook cũ, iPhone cũ, ThinkPad..."
                style={styles.searchInput}
              />
            </div>

            <div style={styles.gradeRow}>
              {gradeFilters.map((item) => (
                <button
                  key={item}
                  type="button"
                  style={{ ...styles.gradeChip, ...(grade === item ? styles.gradeChipActive : {}) }}
                  onClick={() => setGrade(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.tradeInBox}>
            <h2 style={styles.tradeTitle}>Quy trình thu cũ nhanh</h2>
            <ul style={styles.tradeList}>
              {TRADE_IN_STEPS.map((step) => (
                <li key={step} style={styles.tradeItem}>
                  <FiCheckCircle size={15} />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <button type="button" style={styles.tradeBtn}>
              Đăng ký thu cũ ngay <FiChevronRight />
            </button>
          </div>
        </section>

        <section style={styles.grid}>
          {!loading && products.length === 0 ? <p>Chưa có dữ liệu máy cũ/thu cũ phù hợp trong API hiện tại.</p> : null}
          {products.map((product) => {
            const discount = product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0
            const openDetail = () => {
              navigate(`/product/${product.id}`, { state: { mockProduct: product } })
            }

            return (
              <article
                key={product.id}
                style={styles.card}
                role="button"
                tabIndex={0}
                onClick={openDetail}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    openDetail()
                  }
                }}
              >
                <img src={product.image} alt={product.name} style={styles.cardImage} loading="lazy" />

                <div style={styles.cardBody}>
                  <div style={styles.badgeRow}>
                    <span style={styles.categoryBadge}>{product.category}</span>
                    <span style={styles.gradeBadge}>{product.grade}</span>
                  </div>

                  <h3 style={styles.cardTitle}>{product.name}</h3>
                  <p style={styles.cardNote}>{product.note}</p>

                  <div style={styles.specGrid}>
                    <span style={styles.specItem}>
                      <FiCpu size={13} /> {product.cpu}
                    </span>
                    <span style={styles.specItem}>
                      <FiHardDrive size={13} /> {product.storage}
                    </span>
                    <span style={styles.specItem}>{product.ram}</span>
                    <span style={styles.specItem}>
                      <FiBatteryCharging size={13} /> Pin {product.battery}
                    </span>
                  </div>

                  <div style={styles.metaRow}>
                    <span>Đã bán {product.sold}</span>
                    <span style={styles.discount}>-{discount}%</span>
                  </div>

                  <div style={styles.priceRow}>
                    <strong style={styles.price}>{formatCurrency(product.price)}</strong>
                    <span style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</span>
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.cartBtn}
                      onClick={(event) => {
                        event.stopPropagation()
                        addToCart(
                          {
                            id: product.id,
                            name: product.name,
                            image: product.image,
                            price: product.price,
                            oldPrice: product.oldPrice,
                            specs: `${product.cpu} | ${product.storage}`,
                            config: `${product.ram} | ${product.grade}`,
                          },
                          1
                        )
                      }}
                    >
                      <FiShoppingCart /> Thêm vào giỏ
                    </button>
                    <button
                      type="button"
                      style={styles.detailBtn}
                      onClick={(event) => {
                        event.stopPropagation()
                        openDetail()
                      }}
                    >
                      Xem chi ti?t <FiChevronRight />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
      <Footer />
    </>
  )
}

const styles = {
  page: {
    maxWidth: 1420,
    margin: "0 auto",
    padding: "22px 18px 46px",
    display: "grid",
    gap: 18,
    background: "linear-gradient(180deg, #fff8f3 0%, #ffffff 34%, #f8fafc 100%)",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 14,
    borderRadius: 22,
    padding: 18,
    background: "linear-gradient(135deg, #111827 0%, #92400e 52%, #ea580c 100%)",
    color: "#fff",
  },
  heroCopy: { display: "grid", gap: 10 },
  heroKicker: {
    width: "fit-content",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: "rgba(255,255,255,0.14)",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(24px, 3.2vw, 42px)",
    lineHeight: 1.08,
  },
  heroSubtitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.9)",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.08)",
  },
  searchInput: {
    width: "100%",
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#fff",
    fontSize: 14,
  },
  gradeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  gradeChip: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  gradeChipActive: {
    background: "#fff",
    color: "#111827",
    borderColor: "#fff",
  },
  tradeInBox: {
    background: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.24)",
    padding: 14,
    display: "grid",
    gap: 10,
    alignContent: "start",
  },
  tradeTitle: { margin: 0, fontSize: 18 },
  tradeList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  tradeItem: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 8,
    alignItems: "start",
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
  },
  tradeBtn: {
    border: 0,
    borderRadius: 10,
    padding: "10px 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontWeight: 700,
    color: "#111827",
    background: "#fff",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
  },
  card: {
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#fff",
    overflow: "hidden",
    boxShadow: "0 16px 34px -30px rgba(15, 23, 42, 0.7)",
  },
  cardImage: {
    width: "100%",
    height: 164,
    objectFit: "cover",
  },
  cardBody: { padding: 12, display: "grid", gap: 10 },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  categoryBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  gradeBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#fff7ed",
    color: "#c2410c",
  },
  cardTitle: { margin: 0, fontSize: 17 },
  cardNote: { margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.45 },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 6,
  },
  specItem: {
    fontSize: 12,
    color: "#334155",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 8px",
    borderRadius: 10,
    background: "#f8fafc",
  },
  metaRow: { display: "flex", justifyContent: "space-between", color: "#475569", fontSize: 12 },
  discount: { color: "#dc2626", fontWeight: 700 },
  priceRow: { display: "flex", alignItems: "center", gap: 10 },
  price: { fontSize: 17, color: "#0f172a" },
  oldPrice: { color: "#94a3b8", textDecoration: "line-through", fontSize: 13 },
  actions: { display: "grid", gap: 8 },
  cartBtn: {
    border: 0,
    borderRadius: 10,
    background: "#0f172a",
    color: "#fff",
    padding: "10px 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontWeight: 600,
    cursor: "pointer",
  },
  detailBtn: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    background: "#fff",
    color: "#0f172a",
    padding: "10px 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontWeight: 600,
    cursor: "pointer",
  },
}
