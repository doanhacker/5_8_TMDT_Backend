import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiFilter, FiSearch, FiShoppingCart } from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import FilterBar from "../components/FilterBar"
import Footer from "../components/Footer"

const PRODUCT_FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Monitor+Printer"
const HERO_MONITOR_PRINTER_IMAGE = "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80"
const CATEGORY_KEYWORDS = ["màn hình", "man hinh", "monitor", "máy in", "may in", "printer"]

const MONITOR_PRINTER_FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng" },
  { id: "newArrival", label: "Hàng mới về" },
  { id: "priceRange", label: "Xem theo giá", hasDropdown: true, type: "price" },
  { id: "brand", label: "Hãng sản xuất", hasDropdown: true, options: [] },
  { id: "category", label: "Loại thiết bị", hasDropdown: true, options: [] },
]

const MONITOR_PRINTER_PRICE_RANGES = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 - 4 tri?u", min: 2000000, max: 4000000 },
  { label: "4 - 6 tri?u", min: 4000000, max: 6000000 },
  { label: "6 - 8 tri?u", min: 6000000, max: 8000000 },
  { label: "8 - 10 tri?u", min: 8000000, max: 10000000 },
  { label: "Trên 10 triệu", min: 10000000, max: Infinity },
]

const normalize = (value) => String(value || "").toLowerCase()

const detectCategory = (product) => {
  const bucket = `${product?.name || ""} ${product?.series || ""}`.toLowerCase()
  if (bucket.includes("printer") || bucket.includes("máy in") || bucket.includes("may in")) return "Máy in"
  return "Màn hình"
}

const isMonitorPrinterProduct = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""} ${(product?.features || []).join(" ")}`.toLowerCase()
  return CATEGORY_KEYWORDS.some((keyword) => source.includes(keyword))
}

const mapApiProductToCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "Màn hình / Máy in",
  brand: product?.brand || "Unknown",
  category: detectCategory(product),
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  sold: Number(product?.sold || 0),
  image: product?.image || PRODUCT_FALLBACK_IMAGE,
  specs: [product?.screenSize, product?.cpu, product?.storage].filter(Boolean),
  feature: (Array.isArray(product?.features) && product.features[0]) || "Sản phẩm chính hãng",
})

export default function MonitorPrinterPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")

  const sourceProducts = useMemo(() => {
    const input = Array.isArray(products) ? products : []
    return input.filter(isMonitorPrinterProduct).map(mapApiProductToCard)
  }, [products])

  const brands = useMemo(() => [...new Set(sourceProducts.map((item) => item.brand).filter(Boolean))], [sourceProducts])
  const categories = useMemo(() => [...new Set(sourceProducts.map((item) => item.category).filter(Boolean))], [sourceProducts])

  const filterConfig = useMemo(() => {
    return MONITOR_PRINTER_FILTER_CONFIG.map((item) => {
      if (item.id === "brand") return { ...item, options: brands }
      if (item.id === "category") return { ...item, options: categories }
      return item
    })
  }, [brands, categories])

  const handleFilterChange = (newFilters, newSortBy) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalize(query).trim()
    const activeFilters = filters || {}

    return sourceProducts
      .filter((product) => {
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
  }, [query, filters, sortBy, sourceProducts])

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ backgroundImage: `url(${HERO_MONITOR_PRINTER_IMAGE})`, backgroundSize: "cover", padding: "88px 16px", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ margin: 0 }}>Màn Hình & Máy In</h1>
          <p style={{ marginTop: 8 }}>{loading ? "Đang đồng bộ dữ liệu từ API..." : "Danh mục lấy dữ liệu thật từ API sản phẩm."}</p>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "24px 16px" }}>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Tìm màn hình, máy in..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 40px 12px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}
          />
          <FiSearch style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>

        <FilterBar filterConfig={filterConfig} priceRanges={MONITOR_PRINTER_PRICE_RANGES} onFilterChange={handleFilterChange} />

        <p style={{ color: "#475569", marginTop: 16 }}>Tìm thấy {filteredProducts.length} sản phẩm</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {!loading && filteredProducts.length === 0 ? <p>Chưa có sản phẩm phù hợp cho mục Màn hình/Máy in.</p> : null}
          {filteredProducts.map((product) => (
            <article key={product.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              <img src={product.image || PRODUCT_FALLBACK_IMAGE} alt={product.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
              <p style={{ margin: "10px 0 6px", color: "#64748b", fontSize: 13 }}>{product.brand} - {product.category}</p>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, cursor: "pointer" }} onClick={() => openProduct(product)}>{product.name}</h3>
              <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: 13 }}>{product.feature}</p>
              <p style={{ margin: "0 0 10px", fontWeight: 700 }}>{product.price.toLocaleString("vi-VN")}đ</p>
              <button type="button" onClick={() => handleAddToCart(product)} style={{ width: "100%", border: 0, borderRadius: 8, padding: "10px 12px", background: "#0f172a", color: "#fff", display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
                <FiShoppingCart /> Thêm giỏ
              </button>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
