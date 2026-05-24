import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiHardDrive,
  FiHome,
  FiSearch,
  FiShield,
  FiShoppingCart,
  FiTag,
  FiTool,
  FiTruck,
} from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import FilterBar from "../components/FilterBar"
import Footer from "../components/Footer"
import { getServiceUtilities } from "../services/serviceUtilityApi"

const FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Dich+vu"
const HERO_IMAGE = "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80"

const SERVICE_IMAGE_MAP = {
  "Bảo hành": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
  "Hỗ trợ kỹ thuật": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "Lắp đặt": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80",
  "Phục hồi dữ liệu": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  "Sửa chữa": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
  "Bảo hiểm": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
  "Bảo vệ màn hình": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80",
  "Dịch vụ": FALLBACK_IMAGE,
}

const SERVICE_FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng", icon: FiTruck },
  { id: "newArrival", label: "Mới cập nhật", icon: FiCheckCircle },
  { id: "priceRange", label: "Xem theo giá", icon: FiDollarSign, hasDropdown: true, type: "price" },
  { id: "brand", label: "Đơn vị", icon: FiTag, hasDropdown: true, options: [] },
  { id: "category", label: "Nhóm dịch vụ", icon: FiTool, hasDropdown: true, options: [] },
]

const SERVICE_PRICE_RANGES = [
  { label: "Dưới 500K", min: 0, max: 500000 },
  { label: "500K - 1 triệu", min: 500000, max: 1000000 },
  { label: "1 - 2 triệu", min: 1000000, max: 2000000 },
  { label: "2 - 3 triệu", min: 2000000, max: 3000000 },
  { label: "Trên 3 triệu", min: 3000000, max: Infinity },
]

const FALLBACK_SERVICE_PACKAGES = [
  {
    id: "svc-install-standard",
    name: "Gói lắp đặt tiêu chuẩn tại nhà",
    brand: "TechMart Care",
    category: "Lắp đặt",
    price: 350000,
    oldPrice: 500000,
    stock: 999,
    inStock: true,
    sold: 286,
    image: SERVICE_IMAGE_MAP["Lắp đặt"],
    feature: "Kỹ thuật viên đến tận nơi trong 2 giờ nội thành.",
    features: ["Hẹn giờ linh hoạt", "Có biên nhận", "Bảo hành lắp đặt 30 ngày"],
  },
  {
    id: "svc-warranty-plus",
    name: "Gia hạn bảo hành Plus 12 tháng",
    brand: "TechMart Warranty",
    category: "Bảo hành",
    price: 890000,
    oldPrice: 1190000,
    stock: 999,
    inStock: true,
    sold: 402,
    image: SERVICE_IMAGE_MAP["Bảo hành"],
    feature: "Đổi mới nhanh khi lỗi phần cứng theo chính sách áp dụng.",
    features: ["Hỗ trợ 7 ngày/tuần", "Ưu tiên xử lý", "Không phụ phí kiểm tra"],
  },
  {
    id: "svc-data-recovery",
    name: "Phục hồi dữ liệu chuyên sâu",
    brand: "TechMart Lab",
    category: "Phục hồi dữ liệu",
    price: 1490000,
    oldPrice: 1990000,
    stock: 999,
    inStock: true,
    sold: 93,
    image: SERVICE_IMAGE_MAP["Phục hồi dữ liệu"],
    feature: "Khôi phục dữ liệu SSD/HDD/điện thoại theo mức độ hỏng.",
    features: ["Báo giá trước", "Cam kết bảo mật", "Xuất biên bản kỹ thuật"],
  },
  {
    id: "svc-support-priority",
    name: "Hỗ trợ kỹ thuật ưu tiên 1:1",
    brand: "TechMart Support",
    category: "Hỗ trợ kỹ thuật",
    price: 590000,
    oldPrice: 790000,
    stock: 999,
    inStock: true,
    sold: 218,
    image: SERVICE_IMAGE_MAP["Hỗ trợ kỹ thuật"],
    feature: "Hỗ trợ cài đặt, tối ưu và xử lý lỗi từ xa trong 60 phút.",
    features: ["Video call", "TeamViewer/AnyDesk", "Báo cáo sau xử lý"],
  },
]

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const formatPrice = (value) => Number(value || 0).toLocaleString("vi-VN")

const normalizePriceToVnd = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0

  // Data can be stored as "million" units (e.g. 1.49), normalize to VND.
  if (number < 1000) return Math.round(number * 1000000)
  return Math.round(number)
}

const isServiceProduct = (product) => {
  const source = normalizeText(`${product?.name || ""} ${product?.series || ""} ${(product?.features || []).join(" ")}`)
  return (
    String(product?.deviceType || "").toUpperCase() === "SERVICE" ||
    source.includes("dich vu") ||
    source.includes("dich vu tien ich") ||
    source.includes("bao hanh") ||
    source.includes("ho tro ky thuat") ||
    source.includes("lap dat") ||
    source.includes("phuc hoi du lieu") ||
    source.includes("sua chua") ||
    source.includes("bao tri") ||
    source.includes("ve sinh") ||
    source.includes("cai dat") ||
    source.includes("bao hiem") ||
    source.includes("kinh cuong luc") ||
    source.includes("data recovery")
  )
}

const detectServiceGroup = (product) => {
  const source = normalizeText(`${product?.name || ""} ${product?.highlightFeatures || ""} ${(product?.features || []).join(" ")}`)
  if (source.includes("bao hanh")) return "Bảo hành"
  if (source.includes("ho tro") || source.includes("support")) return "Hỗ trợ kỹ thuật"
  if (source.includes("lap dat") || source.includes("cau hinh")) return "Lắp đặt"
  if (source.includes("phuc hoi") || source.includes("data recovery")) return "Phục hồi dữ liệu"
  if (source.includes("sua chua") || source.includes("linh kien")) return "Sửa chữa"
  if (source.includes("bao hiem") || source.includes("boi thuong")) return "Bảo hiểm"
  if (source.includes("kinh cuong luc") || source.includes("screen") || source.includes("9h")) return "Bảo vệ màn hình"
  return "Dịch vụ"
}

const getGroupIcon = (group) => {
  if (group === "Bảo hành" || group === "Bảo hiểm") return FiShield
  if (group === "Hỗ trợ kỹ thuật") return FiClock
  if (group === "Lắp đặt") return FiHome
  if (group === "Phục hồi dữ liệu") return FiHardDrive
  return FiTool
}

const mapProductToServiceCard = (product) => {
  const category = detectServiceGroup(product)
  const featureList = Array.isArray(product?.features) && product.features.length > 0
    ? product.features
    : String(product?.highlightFeatures || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

  return {
    id: String(product?.id || `svc-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`),
    name: product?.name || "Dịch vụ tiện ích",
    brand: product?.brand || "TechMart",
    category,
    series: product?.series || "Dịch vụ tiện ích",
    price: normalizePriceToVnd(product?.price),
    oldPrice: normalizePriceToVnd(product?.oldPrice || product?.price),
    stock: Number(product?.stock || 0),
    inStock: Boolean(product?.inStock ?? Number(product?.stock || 0) > 0),
    newArrival: Boolean(product?.newArrival),
    sold: Number(product?.sold || 0),
    image: product?.image || SERVICE_IMAGE_MAP[category] || FALLBACK_IMAGE,
    feature: featureList[0] || "Dịch vụ chính hãng từ dữ liệu sản phẩm hiện có",
    features: featureList.slice(0, 4),
    hasProductDetail: Number.isFinite(Number(product?.id)) && Number(product?.id) > 0,
  }
}

const mapApiServiceToCard = (item) => ({
  id: String(item?.id || ""),
  name: item?.name || "Dịch vụ tiện ích",
  brand: item?.provider || "TechMart",
  category: item?.category || "Dịch vụ",
  series: item?.category || "Dịch vụ",
  price: normalizePriceToVnd(item?.price),
  oldPrice: normalizePriceToVnd(item?.oldPrice || item?.price),
  stock: Number(item?.stock || 0),
  inStock: Boolean(item?.inStock),
  newArrival: false,
  sold: Number(item?.sold || 0),
  image: item?.image || SERVICE_IMAGE_MAP[item?.category] || FALLBACK_IMAGE,
  feature: String(item?.description || "Dịch vụ chính hãng"),
  features: Array.isArray(item?.features) ? item.features.slice(0, 4) : [],
  hasProductDetail: false,
})

export default function ServicesPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading: productLoading } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")
  const [activeGroup, setActiveGroup] = useState("Tất cả")
  const [apiServices, setApiServices] = useState([])
  const [serviceLoading, setServiceLoading] = useState(true)
  const [serviceError, setServiceError] = useState("")

  useEffect(() => {
    let active = true

    const loadServices = async () => {
      try {
        setServiceLoading(true)
        setServiceError("")
        const result = await getServiceUtilities({ limit: 100 })
        if (!active) return
        setApiServices(Array.isArray(result.data) ? result.data.map(mapApiServiceToCard) : [])
      } catch (error) {
        if (!active) return
        setApiServices([])
        setServiceError(error?.message || "Không thể tải dịch vụ từ backend")
      } finally {
        if (active) {
          setServiceLoading(false)
        }
      }
    }

    loadServices()

    return () => {
      active = false
    }
  }, [])

  const serviceProducts = useMemo(() => {
    if (Array.isArray(apiServices) && apiServices.length > 0) {
      return apiServices
    }

    const input = Array.isArray(products) ? products : []
    const mapped = input.filter(isServiceProduct).map(mapProductToServiceCard)
    if (mapped.length > 0) return mapped
    return FALLBACK_SERVICE_PACKAGES.map((item) => ({ ...item, hasProductDetail: false }))
  }, [apiServices, products])

  const usingFallbackCatalog = useMemo(() => {
    if (Array.isArray(apiServices) && apiServices.length > 0) return false

    const input = Array.isArray(products) ? products : []
    return input.filter(isServiceProduct).length === 0
  }, [apiServices, products])

  const loading = serviceLoading || productLoading

  const brands = useMemo(() => [...new Set(serviceProducts.map((item) => item.brand).filter(Boolean))], [serviceProducts])
  const categories = useMemo(() => [...new Set(serviceProducts.map((item) => item.category).filter(Boolean))], [serviceProducts])
  const groups = useMemo(() => ["Tất cả", ...categories], [categories])

  const filterConfig = useMemo(() => {
    return SERVICE_FILTER_CONFIG.map((item) => {
      if (item.id === "brand") return { ...item, options: brands }
      if (item.id === "category") return { ...item, options: categories }
      return item
    })
  }, [brands, categories])

  const filteredProducts = useMemo(() => {
    const activeFilters = filters || {}
    const query = normalizeText(searchTerm).trim()

    return serviceProducts
      .filter((product) => {
        if (activeGroup !== "Tất cả" && product.category !== activeGroup) return false

        const searchable = normalizeText([
          product.name,
          product.brand,
          product.category,
          product.feature,
          product.features.join(" "),
        ].join(" "))
        if (query && !searchable.includes(query)) return false

        if (activeFilters.inStock && !product.inStock) return false
        if (activeFilters.newArrival && !product.newArrival) return false

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
  }, [activeGroup, filters, searchTerm, serviceProducts, sortBy])

  const summary = useMemo(() => {
    const lowestPrice = serviceProducts.reduce((min, item) => (item.price > 0 ? Math.min(min, item.price) : min), Infinity)
    const totalStock = serviceProducts.reduce((sum, item) => sum + item.stock, 0)

    return {
      total: serviceProducts.length,
      groups: categories.length,
      totalStock,
      lowestPrice: Number.isFinite(lowestPrice) ? lowestPrice : 0,
    }
  }, [categories.length, serviceProducts])

  const handleFilterChange = (nextFilters, nextSortBy) => {
    setFilters(nextFilters)
    setSortBy(nextSortBy)
  }

  const openProduct = (product) => {
    if (product.hasProductDetail) {
      navigate(`/product/${product.id}`, { state: { mockProduct: product } })
      return
    }

    handleAddToCart(product)
    navigate("/cart")
  }

  const handleAddToCart = (product) => {
    const safePrice = normalizePriceToVnd(product.price)
    const safeOldPrice = normalizePriceToVnd(product.oldPrice || product.price)

    addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        price: safePrice,
        oldPrice: safeOldPrice,
        specs: product.features.join(" | ") || product.feature,
        config: product.category,
      },
      1
    )
  }

  return (
    <div style={styles.shell}>
      <main style={styles.page}>
        <section style={{ ...styles.hero, backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.86), rgba(15,23,42,0.42)), url(${HERO_IMAGE})` }}>
          <div style={styles.heroInner}>
            <div style={styles.heroCopy}>
              <p style={styles.eyebrow}>Dữ liệu từ danh mục Dịch vụ tiện ích</p>
              <h1 style={styles.title}>Dịch vụ tiện ích</h1>
              <p style={styles.subtitle}>
                Bảo hành, sửa chữa, lắp đặt, phục hồi dữ liệu và các gói bảo vệ thiết bị đang có trong kho sản phẩm.
              </p>
            </div>

            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <strong>{loading ? "..." : summary.total}</strong>
                <span>Dịch vụ</span>
              </div>
              <div style={styles.summaryItem}>
                <strong>{loading ? "..." : summary.groups}</strong>
                <span>Nhóm</span>
              </div>
              <div style={styles.summaryItem}>
                <strong>{loading ? "..." : formatPrice(summary.lowestPrice)}</strong>
                <span>Giá từ</span>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.toolbar}>
          <div style={styles.searchWrap}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Tìm bảo hành, lắp đặt, sửa chữa..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.groupRail}>
            {groups.map((group) => {
              const Icon = group === "Tất cả" ? FiCheckCircle : getGroupIcon(group)
              const isActive = activeGroup === group
              return (
                <button
                  key={group}
                  type="button"
                  style={{ ...styles.groupButton, ...(isActive ? styles.groupButtonActive : null) }}
                  onClick={() => setActiveGroup(group)}
                >
                  <Icon size={15} />
                  <span>{group}</span>
                </button>
              )
            })}
          </div>

          <FilterBar
            title="Lọc dịch vụ"
            filterConfig={filterConfig}
            priceRanges={SERVICE_PRICE_RANGES}
            onFilterChange={handleFilterChange}
          />
        </section>

        <section style={styles.resultHeader}>
          <div>
            <h2 style={styles.sectionTitle}>{loading ? "Đang tải dữ liệu..." : `Tìm thấy ${filteredProducts.length} dịch vụ`}</h2>
            <p style={styles.sectionMeta}>
              Tồn khả dụng: {summary.totalStock} lượt dịch vụ
              {usingFallbackCatalog ? " • Đang hiển thị gói dịch vụ mẫu" : ""}
              {serviceError ? ` • ${serviceError}` : ""}
            </p>
          </div>
        </section>

        <section style={styles.grid}>
          {!loading && filteredProducts.length === 0 ? (
            <div style={styles.emptyState}>
              <h3>Chưa có dịch vụ phù hợp</h3>
              <p>Thử đổi nhóm dịch vụ, bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : null}

          {filteredProducts.map((product) => {
            const discount = product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0
            const Icon = getGroupIcon(product.category)

            return (
              <article key={product.id} style={styles.card}>
                <div style={styles.cardImageWrap}>
                  <img
                    src={product.image || SERVICE_IMAGE_MAP[product.category] || FALLBACK_IMAGE}
                    alt={product.name}
                    style={styles.cardImage}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE
                    }}
                  />
                  {discount > 0 ? <span style={styles.discountBadge}>-{discount}%</span> : null}
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.badgeRow}>
                    <span style={styles.groupBadge}>
                      <Icon size={13} />
                      {product.category}
                    </span>
                    <span style={product.inStock ? styles.stockBadge : styles.stockBadgeMuted}>
                      {product.inStock ? "Sẵn hàng" : "Tạm hết"}
                    </span>
                  </div>

                  <button type="button" style={styles.titleButton} onClick={() => openProduct(product)}>
                    {product.name}
                  </button>

                  <p style={styles.feature}>{product.feature}</p>

                  <div style={styles.featureGrid}>
                    {(product.features.length > 0 ? product.features : [product.series]).slice(0, 3).map((feature, index) => (
                      <span key={`${product.id}-${index}`} style={styles.featureChip}>{feature}</span>
                    ))}
                  </div>

                  <div style={styles.priceRow}>
                    <strong>{formatPrice(product.price)}đ</strong>
                    {product.oldPrice > product.price ? <span>{formatPrice(product.oldPrice)}đ</span> : null}
                  </div>

                  <div style={styles.actions}>
                    <button type="button" style={styles.cartButton} onClick={() => handleAddToCart(product)}>
                      <FiShoppingCart size={16} />
                      Đặt dịch vụ
                    </button>
                    <button type="button" style={styles.detailButton} onClick={() => openProduct(product)}>
                      {product.hasProductDetail ? "Chi tiết" : "Mua ngay"}
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
      <Footer />
    </div>
  )
}

const styles = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f8fafc",
  },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
    padding: "24px 16px 44px",
  },
  hero: {
    minHeight: 260,
    borderRadius: 8,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
  },
  heroInner: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)",
    gap: 24,
    padding: 28,
    alignItems: "end",
  },
  heroCopy: {
    maxWidth: 720,
  },
  eyebrow: {
    margin: "0 0 8px",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0,
    color: "#bae6fd",
  },
  title: {
    margin: 0,
    fontSize: 44,
    lineHeight: 1.05,
    fontWeight: 850,
  },
  subtitle: {
    margin: "12px 0 0",
    maxWidth: 680,
    color: "rgba(255,255,255,0.88)",
    fontSize: 16,
    lineHeight: 1.55,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  summaryItem: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 8,
    padding: "12px 14px",
    minHeight: 78,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  toolbar: {
    marginTop: 18,
    display: "grid",
    gap: 14,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    padding: "0 14px",
    minHeight: 46,
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    border: 0,
    outline: "none",
    fontSize: 14,
    background: "transparent",
    color: "#0f172a",
  },
  groupRail: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 2,
  },
  groupButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    minHeight: 38,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #dbe3ef",
    background: "#fff",
    color: "#334155",
    fontWeight: 700,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  groupButtonActive: {
    background: "#0f172a",
    borderColor: "#0f172a",
    color: "#fff",
  },
  resultHeader: {
    marginTop: 22,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    color: "#0f172a",
  },
  sectionMeta: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: 14,
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "56px 20px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    color: "#475569",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    minHeight: 430,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
  },
  cardImageWrap: {
    position: "relative",
    height: 150,
    background: "#e2e8f0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#dc2626",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
  },
  cardBody: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 9,
    flex: 1,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  groupBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 8px",
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#0369a1",
    fontSize: 12,
    fontWeight: 800,
  },
  stockBadge: {
    color: "#047857",
    fontSize: 12,
    fontWeight: 800,
  },
  stockBadgeMuted: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: 800,
  },
  titleButton: {
    margin: 0,
    padding: 0,
    border: 0,
    background: "transparent",
    color: "#0f172a",
    textAlign: "left",
    fontSize: 16,
    lineHeight: 1.35,
    fontWeight: 800,
    minHeight: 44,
    cursor: "pointer",
  },
  feature: {
    margin: 0,
    minHeight: 38,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.45,
  },
  featureGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 58,
  },
  featureChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 8px",
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#334155",
    fontSize: 12,
    fontWeight: 650,
  },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginTop: "auto",
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  cartButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 38,
    border: 0,
    borderRadius: 8,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  detailButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
}
