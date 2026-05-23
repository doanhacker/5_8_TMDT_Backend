import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiSearch, FiShoppingCart } from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import FilterBar from "../components/FilterBar"
import Footer from "../components/Footer"

const SERVICE_KEYWORDS = ["dịch vụ", "dich vu", "bảo hành", "bao hanh", "sửa chữa", "sua chua", "lắp đặt", "lap dat", "bảo hiểm", "bao hiem", "hỗ trợ", "ho tro", "service"]
const FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Service"

const FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", isToggle: true },
  { id: "inStock", label: "Sẵn hàng" },
  { id: "newArrival", label: "Mới cập nhật" },
  { id: "priceRange", label: "Xem theo giá", hasDropdown: true, type: "price" },
  { id: "brand", label: "Đơn vị", hasDropdown: true, options: [] },
  { id: "category", label: "Nhóm dịch vụ", hasDropdown: true, options: [] },
]

const PRICE_RANGES = [
  { label: "Dưới 500K", min: 0, max: 500000 },
  { label: "500K - 1M", min: 500000, max: 1000000 },
  { label: "1M - 2M", min: 1000000, max: 2000000 },
  { label: "2M - 3M", min: 2000000, max: 3000000 },
  { label: "3M - 5M", min: 3000000, max: 5000000 },
  { label: "Trên 5M", min: 5000000, max: Infinity },
]

const normalize = (value) => String(value || "").toLowerCase()

const isServiceProduct = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""} ${(product?.features || []).join(" ")}`.toLowerCase()
  return SERVICE_KEYWORDS.some((keyword) => source.includes(keyword))
}

const detectCategory = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""}`.toLowerCase()
  if (source.includes("bảo hành") || source.includes("bao hanh")) return "Bảo hành"
  if (source.includes("bảo hiểm") || source.includes("bao hiem")) return "Bảo hiểm"
  if (source.includes("sửa") || source.includes("repair")) return "Sửa chữa"
  if (source.includes("lắp") || source.includes("install")) return "Lắp đặt"
  return "Dịch vụ"
}

const mapApiProductToCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "Dịch vụ",
  brand: product?.brand || "TechMart",
  category: detectCategory(product),
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  sold: Number(product?.sold || 0),
  rating: 4.7,
  image: product?.image || FALLBACK_IMAGE,
  specs: Array.isArray(product?.features) ? product.features.slice(0, 4) : [],
  feature: (Array.isArray(product?.features) && product.features[0]) || "Dịch vụ chính hãng",
})

export default function ServicesPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")

  const serviceProducts = useMemo(() => {
    const input = Array.isArray(products) ? products : []
    return input.filter(isServiceProduct).map(mapApiProductToCard)
  }, [products])

  const brands = useMemo(() => [...new Set(serviceProducts.map((item) => item.brand).filter(Boolean))], [serviceProducts])
  const categories = useMemo(() => [...new Set(serviceProducts.map((item) => item.category).filter(Boolean))], [serviceProducts])

  const filterConfig = useMemo(() => {
    return FILTER_CONFIG.map((item) => {
      if (item.id === "brand") return { ...item, options: brands }
      if (item.id === "category") return { ...item, options: categories }
      return item
    })
  }, [brands, categories])

  const filteredProducts = useMemo(() => {
    const activeFilters = filters || {}
    const query = normalize(searchTerm)

    return serviceProducts
      .filter((product) => {
        const matchesSearch = !query || [product.name, product.brand, product.category].join(" ").toLowerCase().includes(query)
        if (!matchesSearch) return false

        if (activeFilters.priceRange) {
          const maxPrice = activeFilters.priceRange.max === Infinity ? Number.MAX_SAFE_INTEGER : activeFilters.priceRange.max
          if (product.price < activeFilters.priceRange.min || product.price > maxPrice) return false
        }

        if (Array.isArray(activeFilters.brand) && activeFilters.brand.length > 0 && !activeFilters.brand.includes(product.brand)) {
          return false
        }

        if (Array.isArray(activeFilters.category) && activeFilters.category.length > 0 && !activeFilters.category.includes(product.category)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "priceAsc") return a.price - b.price
        if (sortBy === "priceDesc") return b.price - a.price
        if (sortBy === "promotion") {
          const aDiscount = a.oldPrice > a.price ? ((a.oldPrice - a.price) / a.oldPrice) * 100 : 0
          const bDiscount = b.oldPrice > b.price ? ((b.oldPrice - b.price) / b.oldPrice) * 100 : 0
          return bDiscount - aDiscount
        }
        return b.sold - a.sold
      })
  }, [serviceProducts, searchTerm, filters, sortBy])

  const openProduct = (product) => {
    navigate(`/product/${product.id}`, { state: { mockProduct: product } })
  }

  const handleAddToCart = (product) => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        oldPrice: product.oldPrice,
        specs: product.specs.join(" | ") || "Đang cập nhật",
        config: product.brand,
      },
      1
    )
  }

  return (
    <>
      <main style={styles.page}>
        <section style={styles.hero}>
          <h1 style={styles.title}>Dịch vụ tiện ích</h1>
          <p style={styles.subtitle}>{loading ? "Đang đồng bộ dữ liệu dịch vụ từ API..." : "Trang đã dùng dữ liệu thật từ API sản phẩm."}</p>
        </section>

        <section style={styles.filterSection}>
          <div style={styles.searchBar}>
            <FiSearch size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <FilterBar filterConfig={filterConfig} priceRanges={PRICE_RANGES} onFilterChange={(nextFilters, nextSortBy) => {
            setFilters(nextFilters)
            setSortBy(nextSortBy)
          }} />
        </section>

        <section style={styles.productsSection}>
          <h2 style={styles.resultCount}>Tìm thấy {filteredProducts.length} dịch vụ</h2>

          <div style={styles.grid}>
            {!loading && filteredProducts.length === 0 ? <p>Chưa có dịch vụ phù hợp trong dữ liệu hiện tại.</p> : null}
            {filteredProducts.map((product) => {
              const discount = product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0
              return (
                <article key={product.id} style={styles.card}>
                  <div style={styles.cardVisual}>
                    <img src={product.image} alt={product.name} style={styles.cardImage} onError={(e) => {
                      e.target.src = FALLBACK_IMAGE
                    }} />
                    {discount > 0 ? <div style={styles.discountBadge}>{discount}%</div> : null}
                  </div>

                  <div style={styles.cardBody}>
                    <p style={styles.brand}>{product.brand}</p>
                    <h3 style={styles.cardTitle} onClick={() => openProduct(product)}>{product.name}</h3>

                    <div style={styles.specGrid}>
                      {product.specs.map((spec, idx) => (
                        <div key={`${product.id}-${idx}`} style={styles.specItem}>{spec}</div>
                      ))}
                    </div>

                    <p style={styles.cardFeature}>{product.feature}</p>

                    <div style={styles.priceSection}>
                      <span style={styles.price}>{product.price.toLocaleString("vi-VN")}đ</span>
                      <span style={styles.oldPrice}>{product.oldPrice.toLocaleString("vi-VN")}đ</span>
                    </div>

                    <button style={styles.cartButton} type="button" onClick={() => handleAddToCart(product)}>
                      <FiShoppingCart size={16} /> Thêm giỏ
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px 16px 36px",
    background: "#f8fafc",
  },
  hero: {
    maxWidth: 1200,
    margin: "0 auto",
    borderRadius: 16,
    background: "linear-gradient(135deg, #0f172a, #334155)",
    color: "#fff",
    padding: "28px 24px",
  },
  title: { margin: 0, fontSize: 30, fontWeight: 800 },
  subtitle: { margin: "8px 0 0", opacity: 0.9 },
  filterSection: { maxWidth: 1200, margin: "16px auto 0", display: "grid", gap: 12 },
  searchBar: { position: "relative" },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" },
  searchInput: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "11px 12px 11px 40px",
    background: "#fff",
  },
  productsSection: { maxWidth: 1200, margin: "18px auto 0" },
  resultCount: { margin: "0 0 12px", color: "#334155" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 },
  card: { border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" },
  cardVisual: { position: "relative" },
  cardImage: { width: "100%", height: 150, objectFit: "cover" },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "#dc2626",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  cardBody: { padding: 12, display: "grid", gap: 8 },
  brand: { margin: 0, fontSize: 13, color: "#64748b" },
  cardTitle: { margin: 0, fontSize: 16, cursor: "pointer" },
  specGrid: { display: "flex", gap: 6, flexWrap: "wrap" },
  specItem: { fontSize: 12, padding: "3px 8px", borderRadius: 999, background: "#e2e8f0", color: "#334155" },
  cardFeature: { margin: 0, fontSize: 13, color: "#475569" },
  priceSection: { display: "flex", alignItems: "center", gap: 8 },
  price: { fontWeight: 800, color: "#0f172a" },
  oldPrice: { textDecoration: "line-through", color: "#94a3b8", fontSize: 13 },
  cartButton: {
    border: 0,
    borderRadius: 8,
    padding: "10px 12px",
    background: "#0f172a",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
  },
}
