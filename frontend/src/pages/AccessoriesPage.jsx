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
import QASection from "../components/QASection"
import Footer from "../components/Footer"
import "../styles/NewsPhone.css"
import { isProductInScope } from "../utils/adminScope"

const PRODUCT_FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Accessories"
const HERO_ACCESSORIES_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"
const PRODUCT_IMAGE_MAP = {
  8001: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  8002: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80",
  8003: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
  8004: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=1200&q=80",
  8005: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80",
  8006: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  8007: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=1200&q=80",
  8008: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
}

const ACCESSORY_PRODUCTS = [
  {
    id: 8001,
    name: "Airpods Pro 2 Wireless Earbuds",
    brand: "Apple",
    category: "Earbuds",
    price: 6490000,
    oldPrice: 7490000,
    rating: 4.8,
    sold: "2.5k",
    specs: ["Noise Cancelling", "30h Pin", "Bluetooth 5.3"],
    feature: "Âm thanh studio, chống ồn tích cực AI",
    image: PRODUCT_IMAGE_MAP[8001],
  },
  {
    id: 8002,
    name: "Anker PowerBank 100W 25000mAh",
    brand: "Anker",
    category: "Power Bank",
    price: 1590000,
    oldPrice: 1990000,
    rating: 4.7,
    sold: "1.8k",
    specs: ["25000mAh", "100W Sạc", "65W Sạc Nhanh"],
    feature: "Sạc 3 thiết bị cùng lúc, bảo hành 2 năm",
    image: PRODUCT_IMAGE_MAP[8002],
  },
  {
    id: 8003,
    name: "Logitech MX Master 3S Chuột Không Dây",
    brand: "Logitech",
    category: "Mouse",
    price: 2890000,
    oldPrice: 3490000,
    rating: 4.9,
    sold: "1.2k",
    specs: ["8K DPI", "Multi-Device", "USB-C Sạc"],
    feature: "Ergonomic, kết nối 3 thiết bị, pin 70 ngày",
    image: PRODUCT_IMAGE_MAP[8003],
  },
  {
    id: 8004,
    name: "Baseus USB-C Hub 7 in 1",
    brand: "Baseus",
    category: "Hub",
    price: 890000,
    oldPrice: 1290000,
    rating: 4.6,
    sold: "980",
    specs: ["7 Cổng", "4K HDMI", "100W PD"],
    feature: "Kết nối mọi thiết bị, chuẩn Thunderbolt 3",
    image: PRODUCT_IMAGE_MAP[8004],
  },
  {
    id: 8005,
    name: "Sony WH-CH720N Headphones Chống Ồn",
    brand: "Sony",
    category: "Headphones",
    price: 3290000,
    oldPrice: 4190000,
    rating: 4.8,
    sold: "1.5k",
    specs: ["ANC Tech", "35h Pin", "Multi-Device"],
    feature: "Chống ồn AI, âm bass sâu, thoải mái 10h",
    image: PRODUCT_IMAGE_MAP[8005],
  },
  {
    id: 8006,
    name: "Spigen Laptop Sleeve 16 inch",
    brand: "Spigen",
    category: "Túi/Balo",
    price: 690000,
    oldPrice: 990000,
    rating: 4.7,
    sold: "2.1k",
    specs: ["Chống Sốc", "Chống Nước", "16 inch"],
    feature: "Vải chuyên dụng, bảo vệ toàn diện MacBook/Laptop",
    image: PRODUCT_IMAGE_MAP[8006],
  },
  {
    id: 8007,
    name: "HDMI 2.1 Cable 8K 3M",
    brand: "Belkin",
    category: "Cáp/Dây",
    price: 490000,
    oldPrice: 690000,
    rating: 4.5,
    sold: "890",
    specs: ["8K 60Hz", "2.1 Standard", "Durable Design"],
    feature: "Cáp vàng, bền bỉ, bảo hành 2 năm",
    image: PRODUCT_IMAGE_MAP[8007],
  },
  {
    id: 8008,
    name: "Nillkin Stand Laptop Điều Chỉnh Được",
    brand: "Nillkin",
    category: "Chân Đế",
    price: 890000,
    oldPrice: 1290000,
    rating: 4.8,
    sold: "1.3k",
    specs: ["Độ Cao Điều Chỉnh", "Nhôm Hợp Kim", "10-17 inch"],
    feature: "Chống trượt, tản nhiệt tốt, gập gọn dễ mang",
    image: PRODUCT_IMAGE_MAP[8008],
  },
]

const ACCESSORY_FILTER_OPTIONS = {
  brand: ["Apple", "Samsung", "Anker", "Logitech", "Sony", "Belkin", "Spigen", "Baseus", "Nillkin"],
  category: ["Earbuds", "Headphones", "Mouse", "Hub", "Power Bank", "Túi/Balo", "Cáp/Dây", "Chân Đế"],
  priceRange: ["Dưới 500k", "500k - 1M", "1M - 2M", "2M - 3M", "3M - 5M", "Trên 5M"],
}

const ACCESSORY_FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng", icon: FiTruck },
  { id: "newArrival", label: "Hàng mới về", icon: FiBox },
  { id: "priceRange", label: "Xem theo giá", icon: FiDollarSign, hasDropdown: true, type: "price" },
  { id: "brand", label: "Hãng sản xuất", icon: FiTag, hasDropdown: true, options: ACCESSORY_FILTER_OPTIONS.brand },
  { id: "category", label: "Loại phụ kiện", hasDropdown: true, options: ACCESSORY_FILTER_OPTIONS.category },
]

const ACCESSORY_PRICE_RANGES = [
  { label: "Dưới 500 nghìn", min: 0, max: 500000 },
  { label: "500k - 1 triệu", min: 500000, max: 1000000 },
  { label: "1 - 2 triệu", min: 1000000, max: 2000000 },
  { label: "2 - 3 triệu", min: 2000000, max: 3000000 },
  { label: "3 - 5 triệu", min: 3000000, max: 5000000 },
  { label: "Trên 5 triệu", min: 5000000, max: Infinity },
]

const normalizeText = (value) => String(value || "").toLowerCase()

const mapApiProductToAccessoryCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "Phụ kiện",
  brand: product?.brand || "Unknown",
  category: product?.series || "Phụ kiện",
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  rating: 4.7,
  sold: String(product?.sold || "0"),
  specs: [product?.connectivity || "Kết nối", product?.chargingPort || "Cổng sạc", product?.waterResistance || "Chuẩn bảo vệ"],
  feature: (Array.isArray(product?.features) && product.features[0]) || "Sản phẩm chính hãng",
  image: product?.image || PRODUCT_FALLBACK_IMAGE,
})

export default function AccessoriesPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")

  const accessoryProducts = useMemo(() => {
    const source = Array.isArray(products) ? products.filter((item) => isProductInScope(item, "ACCESSORY")) : []
    return source.map(mapApiProductToAccessoryCard)
  }, [products])

  const handleFilterChange = (newFilters, newSortBy) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
  }
          <QASection title="Hỏi & Đáp - Phụ kiện" subtitle="Tư vấn tai nghe, sạc, cáp, chuột, hub và các phụ kiện công nghệ" introTitle="Cần chọn phụ kiện phù hợp?" introText="Đặt câu hỏi để được hỗ trợ nhanh hơn khi mua phụ kiện." listTitle="Câu hỏi gần đây" />

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const activeFilters = filters || {}

    return accessoryProducts.filter((product) => {
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
  }, [query, filters, sortBy, accessoryProducts])

  const handleAddToCart = (product) => {
    addToCart({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image,
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
          backgroundImage: `url(${HERO_ACCESSORIES_IMAGE})`,
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
            Phụ Kiện & Công Nghệ
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 18, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
            Trang bị đầy đủ cho thiết bị của bạn
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
                  placeholder="Tìm phụ kiện..."
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
              filterConfig={ACCESSORY_FILTER_CONFIG}
              priceRanges={ACCESSORY_PRICE_RANGES}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Product Count */}
          <div style={{ marginBottom: 20, color: "#64748b", fontSize: 14, fontWeight: 600 }}>
            {loading ? "Đang tải dữ liệu từ API..." : `Tìm thấy ${filteredProducts.length} sản phẩm`}
          </div>

          <LaptopFilterSection sectionTitle="Phụ kiện" deviceType="ACCESSORY" includeUnassigned />

          {/* Product Grid */}
          <div style={styles.grid}>
            {!loading && filteredProducts.length === 0 ? (
              <div style={{ ...styles.card, padding: 20, textAlign: "center" }}>
                <h3 style={{ margin: 0 }}>Chưa có sản phẩm Phụ kiện</h3>
                <p style={{ margin: "8px 0 0", color: "#64748b" }}>Hãy đăng nhập admin phụ kiện để thêm sản phẩm mới.</p>
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
    color: "#0891b2",
    background: "#cffafe",
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
