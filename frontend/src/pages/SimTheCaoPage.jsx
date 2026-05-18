import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiFilter, FiSearch, FiShoppingCart } from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import FilterBar from "../components/FilterBar"
import Footer from "../components/Footer"

const PRODUCT_FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=SIM+Card"
const HERO_SIM_IMAGE = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80"
const SIM_KEYWORDS = ["sim", "thẻ cào", "the cao", "gói data", "goi data", "viettel", "mobifone", "vinaphone"]

const SIM_FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng" },
  { id: "newArrival", label: "Mới cập nhật" },
  { id: "priceRange", label: "Xem theo giá", hasDropdown: true, type: "price" },
  { id: "brand", label: "Nhà mạng", hasDropdown: true, options: [] },
  { id: "category", label: "Loại sản phẩm", hasDropdown: true, options: [] },
]

const SIM_PRICE_RANGES = [
  { label: "Dưới 50 nghìn", min: 0, max: 50000 },
  { label: "50k - 100k", min: 50000, max: 100000 },
  { label: "100k - 200k", min: 100000, max: 200000 },
  { label: "200k - 300k", min: 200000, max: 300000 },
  { label: "300k - 500k", min: 300000, max: 500000 },
  { label: "Trên 500k", min: 500000, max: Infinity },
]

const normalize = (value) => String(value || "").toLowerCase()

const detectCategory = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""}`.toLowerCase()
  if (source.includes("thẻ") || source.includes("the")) return "Thẻ nạp"
  if (source.includes("data")) return "Gói data"
  return "SIM"
}

const isSimProduct = (product) => {
  const source = `${product?.name || ""} ${product?.series || ""} ${(product?.features || []).join(" ")}`.toLowerCase()
  return SIM_KEYWORDS.some((keyword) => source.includes(keyword))
}

const mapApiProductToCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "SIM / Thẻ cào",
  brand: product?.brand || "Unknown",
  category: detectCategory(product),
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  sold: Number(product?.sold || 0),
  image: product?.image || PRODUCT_FALLBACK_IMAGE,
  specs: [product?.connectivity, product?.features?.[0], product?.features?.[1]].filter(Boolean),
  feature: (Array.isArray(product?.features) && product.features[0]) || "Kết nối nhanh, ổn định",
})

export default function SimTheCaoPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")

  const sourceProducts = useMemo(() => {
    const input = Array.isArray(products) ? products : []
    return input.filter(isSimProduct).map(mapApiProductToCard)
  }, [products])

  const brands = useMemo(() => [...new Set(sourceProducts.map((item) => item.brand).filter(Boolean))], [sourceProducts])
  const categories = useMemo(() => [...new Set(sourceProducts.map((item) => item.category).filter(Boolean))], [sourceProducts])

  const filterConfig = useMemo(() => {
    return SIM_FILTER_CONFIG.map((item) => {
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
      <div style={{ backgroundImage: `url(${HERO_SIM_IMAGE})`, backgroundSize: "cover", padding: "88px 16px", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ margin: 0 }}>SIM & Thẻ Cào</h1>
          <p style={{ marginTop: 8 }}>{loading ? "Đang đồng bộ dữ liệu từ API..." : "Danh mục lấy dữ liệu thật từ API sản phẩm."}</p>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "24px 16px" }}>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Tìm sim, thẻ cào..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 40px 12px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}
          />
          <FiSearch style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>

        <FilterBar filterConfig={filterConfig} priceRanges={SIM_PRICE_RANGES} onFilterChange={handleFilterChange} />

        <p style={{ color: "#475569", marginTop: 16 }}>Tìm thấy {filteredProducts.length} sản phẩm</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {!loading && filteredProducts.length === 0 ? <p>Chưa có sản phẩm phù hợp cho mục SIM/Thẻ cào.</p> : null}
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
