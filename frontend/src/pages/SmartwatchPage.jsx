import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiBox,
  FiChevronRight,
  FiDollarSign,
  FiFilter,
  FiSearch,
  FiShoppingCart,
  FiStar,
  FiTag,
  FiTruck,
} from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import FilterBar from "../components/FilterBar"
import LaptopFilterSection from "../components/LaptopFilterSection"
import Footer from "../components/Footer"
import "../styles/NewsPhone.css"
import { isProductInScope } from "../utils/adminScope"

const PRODUCT_FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Smartwatch"
const HERO_SMARTWATCH_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
const PRODUCT_IMAGE_MAP = {
  7001: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  7002: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  7003: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
  7004: "https://images.unsplash.com/photo-1617043786394-9e69e3c0a407?auto=format&fit=crop&w=1200&q=80",
  7005: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  7006: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
  7007: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=1200&q=80",
  7008: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
}

const SMARTWATCH_PRODUCTS = [
  {
    id: 7001,
    name: "Apple Watch Ultra 2",
    brand: "Apple",
    category: "Cao cấp",
    price: 11990000,
    oldPrice: 13990000,
    rating: 4.9,
    sold: "1.8k",
    specs: ["S9 Chip", "60h Pin", "2.0\" Retina"],
    feature: "Chứng chỉ IP6X, núi lên 100m, màn hình LTPO",
    image: PRODUCT_IMAGE_MAP[7001],
  },
  {
    id: 7002,
    name: "Samsung Galaxy Watch 6 Classic",
    brand: "Samsung",
    category: "Cao cấp",
    price: 8490000,
    oldPrice: 9990000,
    rating: 4.8,
    sold: "1.5k",
    specs: ["AMOLED 1.4\"", "Exynos W920", "40h Pin"],
    feature: "Vòng xoay vật lý, chạy Wear OS 3, IP68",
    image: PRODUCT_IMAGE_MAP[7002],
  },
  {
    id: 7003,
    name: "Garmin Epix Gen 2",
    brand: "Garmin",
    category: "Thể thao",
    price: 9890000,
    oldPrice: 11490000,
    rating: 4.7,
    sold: "1.2k",
    specs: ["AMOLED", "32 Sport Mode", "11 Ngày Pin"],
    feature: "GPS chính xác, theo dõi sức khỏe cao cấp",
    image: PRODUCT_IMAGE_MAP[7003],
  },
  {
    id: 7004,
    name: "Xiaomi Watch 2 Pro",
    brand: "Xiaomi",
    category: "Trung bình",
    price: 3990000,
    oldPrice: 5490000,
    rating: 4.6,
    sold: "2.3k",
    specs: ["AMOLED 1.43\"", "14 Ngày Pin", "150+ Mode"],
    feature: "Giá tốt, pin lâu, thiết kế đẹp",
    image: PRODUCT_IMAGE_MAP[7004],
  },
  {
    id: 7005,
    name: "Huawei Watch 4 Pro",
    brand: "Huawei",
    category: "Cao cấp",
    price: 7890000,
    oldPrice: 9290000,
    rating: 4.7,
    sold: "980",
    specs: ["AMOLED 1.43\"", "HarmonyOS", "14 Ngày Pin"],
    feature: "Màn hình sáng, tính năng sức khỏe đầy đủ",
    image: PRODUCT_IMAGE_MAP[7005],
  },
  {
    id: 7006,
    name: "Fitbit Sense 2",
    brand: "Fitbit",
    category: "Sức khỏe",
    price: 4590000,
    oldPrice: 5990000,
    rating: 4.5,
    sold: "1.1k",
    specs: ["AMOLED", "6 Ngày Pin", "Stress Sensor"],
    feature: "Chuyên sức khỏe, theo dõi giấc ngủ chi tiết",
    image: PRODUCT_IMAGE_MAP[7006],
  },
  {
    id: 7007,
    name: "Amazfit GTR 4",
    brand: "Amazfit",
    category: "Trung bình",
    price: 2990000,
    oldPrice: 4190000,
    rating: 4.6,
    sold: "1.9k",
    specs: ["AMOLED 1.43\"", "14 Ngày Pin", "150+ Mode"],
    feature: "Pin rất lâu, giá rẻ, tính năng đủ đầy",
    image: PRODUCT_IMAGE_MAP[7007],
  },
  {
    id: 7008,
    name: "OnePlus Watch 2",
    brand: "OnePlus",
    category: "Cao cấp",
    price: 5990000,
    oldPrice: 7490000,
    rating: 4.7,
    sold: "1.4k",
    specs: ["AMOLED 1.43\"", "Snapdragon", "10 Ngày Pin"],
    feature: "Wear OS 4, hiệu năng mạnh, thiết kế sang trọng",
    image: PRODUCT_IMAGE_MAP[7008],
  },
]

const SMARTWATCH_FILTER_OPTIONS = {
  brand: ["Apple", "Samsung", "Garmin", "Xiaomi", "Huawei", "Fitbit", "Amazfit", "OnePlus"],
  category: ["Cao cấp", "Trung bình", "Thể thao", "Sức khỏe"],
}

const SMARTWATCH_FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng", icon: FiTruck },
  { id: "newArrival", label: "Hàng mới về", icon: FiBox },
  { id: "priceRange", label: "Xem theo giá", icon: FiDollarSign, hasDropdown: true, type: "price" },
  { id: "brand", label: "Hãng sản xuất", icon: FiTag, hasDropdown: true, options: SMARTWATCH_FILTER_OPTIONS.brand },
  { id: "category", label: "Phân loại", hasDropdown: true, options: SMARTWATCH_FILTER_OPTIONS.category },
]

const SMARTWATCH_PRICE_RANGES = [
  { label: "Dưới 3 triệu", min: 0, max: 3000000 },
  { label: "3 - 5 triệu", min: 3000000, max: 5000000 },
  { label: "5 - 7 triệu", min: 5000000, max: 7000000 },
  { label: "7 - 10 triệu", min: 7000000, max: 10000000 },
  { label: "10 - 15 triệu", min: 10000000, max: 15000000 },
  { label: "Trên 15 triệu", min: 15000000, max: Infinity },
]

const normalizeText = (value) => String(value || "").toLowerCase()

const mapApiProductToWatchCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "Smartwatch",
  brand: product?.brand || "Unknown",
  category: product?.series || "Smartwatch",
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  rating: 4.7,
  sold: String(product?.sold || "0"),
  specs: [product?.cpu || "Chipset", product?.screenSize || "Màn hình", product?.batteryCapacityMah ? `${product.batteryCapacityMah} mAh` : "Pin"],
  feature: (Array.isArray(product?.features) && product.features[0]) || "Sản phẩm chính hãng",
  image: product?.image || PRODUCT_FALLBACK_IMAGE,
})

export default function SmartwatchPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")

  const smartwatchProducts = useMemo(() => {
    const source = Array.isArray(products) ? products.filter((item) => isProductInScope(item, "SMARTWATCH")) : []
    return source.map(mapApiProductToWatchCard)
  }, [products])

  const handleFilterChange = (newFilters, newSortBy) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const activeFilters = filters || {}

    return smartwatchProducts.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.category, product.feature, product.specs.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      if (!matchesQuery) return false

      if (activeFilters.priceRange) {
        const maxPrice = activeFilters.priceRange.max === Infinity ? Number.MAX_SAFE_INTEGER : activeFilters.priceRange.max
        if (product.price < activeFilters.priceRange.min || product.price > maxPrice) return false
      }

      if (Array.isArray(activeFilters.brand) && activeFilters.brand.length > 0) {
        if (!activeFilters.brand.includes(product.brand)) return false
      }

      if (Array.isArray(activeFilters.category) && activeFilters.category.length > 0) {
        if (!activeFilters.category.includes(product.category)) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price
      if (sortBy === "priceDesc") return b.price - a.price
      if (sortBy === "promotion") {
        const aDiscount = ((a.oldPrice - a.price) / a.oldPrice) * 100
        const bDiscount = ((b.oldPrice - b.price) / b.oldPrice) * 100
        return bDiscount - aDiscount
      }
      return parseInt(b.sold, 10) - parseInt(a.sold, 10)
    })
  }, [query, filters, sortBy, smartwatchProducts])

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    })
  }

  const calculateDiscount = (oldPrice, price) => Math.round(((oldPrice - price) / oldPrice) * 100)

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { mockProduct: product } })
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero Section */}
      <div
        style={{
          position: "relative",
          height: 280,
          backgroundImage: `url(${HERO_SMARTWATCH_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", paddingBottom: 40 }}>
          <h1 style={{ margin: 0, fontSize: 48, fontWeight: 800, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            Smartwatch & Đồng Hồ Thông Minh
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 18, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
            Theo dõi sức khỏe và thời gian thực
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, background: "#f8fafc", paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", paddingLeft: 16, paddingRight: 16 }}>
          {/* Search & Filter */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  placeholder="Tìm smartwatch..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 16px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <FiSearch style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              </div>
            </div>
            <FilterBar
              filterConfig={SMARTWATCH_FILTER_CONFIG}
              priceRanges={SMARTWATCH_PRICE_RANGES}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Product Count */}
          <div style={{ marginBottom: 20, color: "#64748b", fontSize: 14, fontWeight: 600 }}>
            {loading ? "Đang tải dữ liệu từ API..." : `Tìm thấy ${filteredProducts.length} sản phẩm`}
          </div>

          <LaptopFilterSection sectionTitle="Đồng hồ thông minh" deviceType="WATCH" includeUnassigned />

          {/* Product Grid */}
          <div style={styles.grid}>
            {!loading && filteredProducts.length === 0 ? (
              <div style={{ ...styles.card, padding: 20, textAlign: "center" }}>
                <h3 style={{ margin: 0 }}>Chưa có sản phẩm Smartwatch</h3>
                <p style={{ margin: "8px 0 0", color: "#64748b" }}>Hãy đăng nhập admin smartwatch để thêm sản phẩm mới.</p>
              </div>
            ) : null}
            {filteredProducts.map((product) => (
              <div key={product.id} style={styles.card}>
                <div style={styles.cardVisual}>
                  <img
                    src={product.image || PRODUCT_FALLBACK_IMAGE}
                    alt={product.name}
                    style={styles.cardImage}
                    onError={(e) => (e.target.src = PRODUCT_FALLBACK_IMAGE)}
                  />
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.badgeRow}>
                    <span style={styles.badge}>{product.category}</span>
                    <span style={styles.rating}>
                      <FiStar size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
                      {product.rating}
                    </span>
                  </div>

                  <h3 style={styles.cardTitle}>{product.name}</h3>

                  <p style={styles.cardFeature}>{product.feature}</p>

                  <div style={styles.specGrid}>
                    {product.specs.slice(0, 4).map((spec, idx) => (
                      <div key={idx} style={styles.specItem}>
                        {spec}
                      </div>
                    ))}
                  </div>

                  <div style={styles.priceRow}>
                    <div style={styles.price}>₫{(product.price / 1000000).toFixed(2)}M</div>
                    <div style={styles.oldPrice}>₫{(product.oldPrice / 1000000).toFixed(2)}M</div>
                    <div style={styles.discount}>{calculateDiscount(product.oldPrice, product.price)}%</div>
                  </div>

                  <div style={styles.actions}>
                    <button
                      style={styles.cartButton}
                      onClick={() => handleAddToCart(product)}
                      title="Thêm vào giỏ hàng"
                    >
                      <FiShoppingCart size={16} />
                      <span>Giỏ</span>
                    </button>
                    <button
                      style={styles.detailButton}
                      onClick={() => handleProductClick(product)}
                      title="Xem chi tiết"
                    >
                      <span>Chi tiết</span>
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Không tìm thấy sản phẩm</p>
              <p style={{ fontSize: 14 }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    background: "#fff",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
  },
  cardVisual: {
    position: "relative",
    height: 150,
    padding: 14,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 12,
    display: "block",
  },
  cardBody: { padding: 10, display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  badgeRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#7c3aed",
    background: "#ede9fe",
    borderRadius: 999,
    padding: "4px 8px",
  },
  rating: { fontSize: 11, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 3 },
  cardTitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.3,
    color: "#0f172a",
    minHeight: 36,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFeature: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.3,
    fontSize: 12,
    minHeight: 30,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 5,
    minHeight: 65,
  },
  specItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 7px",
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#334155",
    fontSize: 10,
    fontWeight: 600,
  },
  priceRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },
  price: { fontSize: 16, color: "#0f172a", fontWeight: 800 },
  oldPrice: { color: "#94a3b8", textDecoration: "line-through", fontSize: 12 },
  discount: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: 800,
  },
  actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: "auto" },
  cartButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 7px",
    borderRadius: 8,
    border: 0,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  },
  detailButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 7px",
    borderRadius: 8,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  },
}
