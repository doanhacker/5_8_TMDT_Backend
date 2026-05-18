import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiBatteryCharging,
  FiBox,
  FiCamera,
  FiChevronRight,
  FiCpu,
  FiDollarSign,
  FiFilter,
  FiSearch,
  FiShield,
  FiShoppingCart,
  FiSmartphone,
  FiStar,
  FiTag,
  FiTruck,
} from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import LaptopFilterSection from "../components/LaptopFilterSection"
import FilterBar from "../components/FilterBar"
import Footer from "../components/Footer"
import { BLOG_API_BASE } from "../config/api"
import "../styles/NewsPhone.css"

const NEWS_FALLBACK_IMAGE = "https://placehold.co/640x400/e2e8f0/0f172a?text=Tin+tuc+cong+nghe"
const PRODUCT_FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Phone+Image"
const HERO_PHONE_IMAGE = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80"


const PHONE_PRODUCTS = [
  {
    id: 9001,
    name: "Galaxy S25 Ultra 5G",
    brand: "Samsung",
    series: "Flagship",
    price: 28990000,
    oldPrice: 33990000,
    rating: 4.9,
    sold: "1.8k",
    storage: "256GB",
    ram: "12GB",
    chipset: "Snapdragon 8 Elite",
    battery: "5000 mAh",
    camera: "200MP",
    display: "6.9 inch QHD+ 120Hz",
    feature: "Bút S Pen, AI chụp ảnh, zoom xa",
    tag: "Bán chạy",
    accent: "from-slate-900 via-blue-900 to-cyan-700",
  },
  {
    id: 9002,
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    series: "Premium",
    price: 32990000,
    oldPrice: 35990000,
    rating: 5,
    sold: "2.4k",
    storage: "256GB",
    ram: "8GB",
    chipset: "A18 Pro",
    battery: "4676 mAh",
    camera: "48MP",
    display: "6.9 inch Super Retina XDR",
    feature: "Camera Control, ProRes, pin tối ưu",
    tag: "Hot",
    accent: "from-zinc-900 via-stone-700 to-neutral-500",
  },
  {
    id: 9003,
    name: "Xiaomi 15 Pro",
    brand: "Xiaomi",
    series: "Hiệu năng",
    price: 22990000,
    oldPrice: 25990000,
    rating: 4.8,
    sold: "980",
    storage: "512GB",
    ram: "12GB",
    chipset: "Snapdragon 8 Elite",
    battery: "5400 mAh",
    camera: "50MP Leica",
    display: "6.73 inch LTPO 120Hz",
    feature: "Sạc nhanh, màn đẹp, tối ưu gaming",
    tag: "Giảm sâu",
    accent: "from-orange-600 via-rose-600 to-fuchsia-700",
  },
  {
    id: 9004,
    name: "OPPO Find X8",
    brand: "OPPO",
    series: "Camera",
    price: 21990000,
    oldPrice: 24990000,
    rating: 4.7,
    sold: "760",
    storage: "256GB",
    ram: "12GB",
    chipset: "Dimensity 9400",
    battery: "5630 mAh",
    camera: "50MP Hasselblad",
    display: "6.78 inch AMOLED 120Hz",
    feature: "Chụp chân dung đẹp, sạc siêu nhanh",
    tag: "Mới về",
    accent: "from-emerald-700 via-teal-600 to-sky-700",
  },
  {
    id: 9005,
    name: "vivo X200 Pro",
    brand: "vivo",
    series: "Chuyên camera",
    price: 24990000,
    oldPrice: 27990000,
    rating: 4.8,
    sold: "540",
    storage: "512GB",
    ram: "16GB",
    chipset: "Dimensity 9400",
    battery: "6000 mAh",
    camera: "200MP tele",
    display: "6.78 inch LTPO 120Hz",
    feature: "Ảnh thiếu sáng, màu sắc rực, pin lớn",
    tag: "Nổi bật",
    accent: "from-violet-700 via-indigo-700 to-sky-800",
  },
  {
    id: 9006,
    name: "Samsung Galaxy A56",
    brand: "Samsung",
    series: "Tầm trung",
    price: 9990000,
    oldPrice: 11990000,
    rating: 4.6,
    sold: "1.2k",
    storage: "256GB",
    ram: "8GB",
    chipset: "Exynos 1480",
    battery: "5000 mAh",
    camera: "50MP",
    display: "6.7 inch Super AMOLED 120Hz",
    feature: "Mượt ổn định, pin tốt, màn sáng",
    tag: "Best choice",
    accent: "from-indigo-700 via-blue-700 to-cyan-600",
  },
  {
    id: 9007,
    name: "Nothing Phone (3a)",
    brand: "Nothing",
    series: "Thiết kế",
    price: 12990000,
    oldPrice: 13990000,
    rating: 4.7,
    sold: "430",
    storage: "256GB",
    ram: "12GB",
    chipset: "Snapdragon 7+ Gen 3",
    battery: "5000 mAh",
    camera: "50MP",
    display: "6.7 inch OLED 120Hz",
    feature: "Glyph, giao diện lạ, cảm giác cao cấp",
    tag: "Thiết kế đẹp",
    accent: "from-neutral-950 via-slate-800 to-zinc-600",
  },
  {
    id: 9008,
    name: "realme GT 7 Pro",
    brand: "realme",
    series: "Gaming",
    price: 18990000,
    oldPrice: 20990000,
    rating: 4.8,
    sold: "670",
    storage: "512GB",
    ram: "16GB",
    chipset: "Snapdragon 8 Elite",
    battery: "5800 mAh",
    camera: "50MP",
    display: "6.78 inch LTPO 120Hz",
    feature: "Hiệu năng mạnh, sạc rất nhanh, chơi game tốt",
    tag: "Gaming",
    accent: "from-amber-600 via-orange-600 to-rose-600",
  },
]

const PHONE_HIGHLIGHTS = [
  { title: "Màn hình", value: "AMOLED / LTPO 120Hz" },
  { title: "Pin", value: "5.000mAh trở lên" },
  { title: "Chip", value: "Flagship và cận flagship" },
  { title: "Camera", value: "Từ 50MP đến 200MP" },
]

const PHONE_FILTER_OPTIONS = {
  brand: ["Apple", "Samsung", "Xiaomi", "OPPO", "vivo", "Nothing", "realme"],
  series: ["Flagship", "Premium", "Hiệu năng", "Camera", "Tầm trung", "Gaming", "Thiết kế"],
  storage: ["128GB", "256GB", "512GB", "1TB"],
  ram: ["6GB", "8GB", "12GB", "16GB"],
  cpu: ["Snapdragon", "Apple A", "Dimensity", "Exynos"],
  screenSize: ["6.1 inch", "6.5 inch", "6.7 inch", "6.8 inch", "6.9 inch"],
  camera: ["48MP", "50MP", "200MP"],
  battery: ["Dưới 5000 mAh", "5000 - 5500 mAh", "Trên 5500 mAh"],
  refreshRate: ["60Hz", "90Hz", "120Hz", "144Hz"],
  os: ["Android", "iOS"],
  features: ["Sạc nhanh", "Camera AI", "Kháng nước", "Màn hình 120Hz", "Thiết kế độc đáo"],
}

const PHONE_FILTER_CONFIG = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng", icon: FiTruck },
  { id: "newArrival", label: "Hàng mới về", icon: FiBox },
  { id: "priceRange", label: "Xem theo giá", icon: FiDollarSign, hasDropdown: true, type: "price" },
  { id: "brand", label: "Hãng sản xuất", icon: FiSmartphone, hasDropdown: true, options: PHONE_FILTER_OPTIONS.brand },
  { id: "series", label: "Dòng sản phẩm", icon: FiTag, hasDropdown: true, options: PHONE_FILTER_OPTIONS.series },
  { id: "storage", label: "Bộ nhớ trong", hasDropdown: true, options: PHONE_FILTER_OPTIONS.storage },
  { id: "ram", label: "Dung lượng RAM", hasDropdown: true, options: PHONE_FILTER_OPTIONS.ram },
  { id: "cpu", label: "Chip xử lý", hasDropdown: true, options: PHONE_FILTER_OPTIONS.cpu },
  { id: "screenSize", label: "Kích thước màn hình", hasDropdown: true, options: PHONE_FILTER_OPTIONS.screenSize },
  { id: "camera", label: "Camera", hasDropdown: true, options: PHONE_FILTER_OPTIONS.camera },
  { id: "battery", label: "Dung lượng pin", hasDropdown: true, options: PHONE_FILTER_OPTIONS.battery },
  { id: "refreshRate", label: "Tần số quét", hasDropdown: true, options: PHONE_FILTER_OPTIONS.refreshRate },
  { id: "os", label: "Hệ điều hành", hasDropdown: true, options: PHONE_FILTER_OPTIONS.os },
  { id: "features", label: "Tính năng nổi bật", hasDropdown: true, options: PHONE_FILTER_OPTIONS.features },
]

const PHONE_PRICE_RANGES = [
  { label: "Dưới 10 triệu", min: 0, max: 10000000 },
  { label: "10 - 15 triệu", min: 10000000, max: 15000000 },
  { label: "15 - 20 triệu", min: 15000000, max: 20000000 },
  { label: "20 - 25 triệu", min: 20000000, max: 25000000 },
  { label: "Trên 25 triệu", min: 25000000, max: Infinity },
]

const formatCurrency = (value) => `${Number(value).toLocaleString("vi-VN")}đ`

const parseSoldCount = (value) => {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return 0
  if (normalized.endsWith("k")) {
    return Math.round(parseFloat(normalized) * 1000)
  }
  return Number(normalized.replace(/[^\d]/g, "")) || 0
}

const normalizeText = (value) => String(value || "").toLowerCase()
const parseBatteryMah = (value) => Number(String(value || "").replace(/[^\d]/g, "")) || 0
const resolveOs = (brandName) => (brandName === "Apple" ? "iOS" : "Android")
const isPhoneProduct = (product) => {
  const normalizedCategory = String(product?.series || "").toLowerCase()
  return String(product?.deviceType || "").toUpperCase() === "PHONE" || normalizedCategory.includes("điện thoại") || normalizedCategory.includes("dien thoai") || normalizedCategory.includes("phone")
}

const mapApiProductToPhoneCard = (product, index) => {
  const chipset = product.cpu || "Đang cập nhật"
  const batteryValue = product.batteryCapacityMah ? `${product.batteryCapacityMah} mAh` : "Đang cập nhật"
  const display = product.screenSize || "Đang cập nhật"
  const accentPalette = [
    "from-slate-900 via-blue-900 to-cyan-700",
    "from-zinc-900 via-stone-700 to-neutral-500",
    "from-orange-600 via-rose-600 to-fuchsia-700",
    "from-emerald-700 via-teal-600 to-sky-700",
    "from-violet-700 via-indigo-700 to-sky-800",
  ]

  return {
    ...product,
    id: Number(product.id),
    name: product.name,
    brand: product.brand || "Unknown",
    series: product.series || "Điện thoại",
    price: Number(product.price || 0),
    oldPrice: Number(product.oldPrice || product.price || 0),
    rating: 4.7,
    sold: String(product.sold || "0"),
    storage: product.storage || "Đang cập nhật",
    ram: product.ram || "Đang cập nhật",
    chipset,
    battery: batteryValue,
    camera: product.deviceSpecificSpecs?.rear_camera_mp ? `${product.deviceSpecificSpecs.rear_camera_mp}MP` : "Đang cập nhật",
    display,
    feature: (Array.isArray(product.features) && product.features[0]) || "Sản phẩm chính hãng",
    tag: product.newArrival ? "Mới về" : "Đang bán",
    accent: accentPalette[index % accentPalette.length],
    image: product.image || PRODUCT_FALLBACK_IMAGE,
  }
}

const getNewsImageUrl = (thumbnailUrl) => {
  if (!thumbnailUrl) return NEWS_FALLBACK_IMAGE
  if (String(thumbnailUrl).startsWith("http")) return thumbnailUrl
  return `${BLOG_API_BASE.replace("/api/blog", "")}${thumbnailUrl}`
}

export default function PhonePage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")
  const [phoneNews, setPhoneNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(false)

  useEffect(() => {
    let active = true

    const fetchPhoneNews = async () => {
      try {
        setNewsLoading(true)
        const response = await fetch(`${BLOG_API_BASE}/posts/published?limit=5`)
        if (!response.ok) {
          throw new Error("Không thể tải tin tức")
        }

        const data = await response.json()
        if (active && data.success && Array.isArray(data.data)) {
          setPhoneNews(data.data)
        }
      } catch (error) {
        console.error("Error fetching phone news:", error)
      } finally {
        if (active) setNewsLoading(false)
      }
    }

    fetchPhoneNews()

    return () => {
      active = false
    }
  }, [])

  const phoneProducts = useMemo(() => {
    const source = Array.isArray(products) ? products.filter(isPhoneProduct) : []
    return source.map((item, index) => mapApiProductToPhoneCard(item, index))
  }, [products])

  const handleFilterChange = (newFilters, newSortBy) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const activeFilters = filters || {}

    return phoneProducts.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.series, product.feature, product.chipset]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)

      if (!matchesQuery) return false

      if (activeFilters.inStock) {
        // Mock data does not track stock, so treat all sample items as available.
      }

      if (activeFilters.newArrival && product.tag !== "Mới về") {
        return false
      }

      if (activeFilters.priceRange) {
        const maxPrice = activeFilters.priceRange.max === Infinity ? Number.MAX_SAFE_INTEGER : activeFilters.priceRange.max
        if (product.price < activeFilters.priceRange.min || product.price > maxPrice) {
          return false
        }
      }

      if (Array.isArray(activeFilters.storage) && activeFilters.storage.length > 0) {
        if (!activeFilters.storage.includes(product.storage)) return false
      }

      if (Array.isArray(activeFilters.ram) && activeFilters.ram.length > 0) {
        if (!activeFilters.ram.includes(product.ram)) return false
      }

      if (Array.isArray(activeFilters.cpu) && activeFilters.cpu.length > 0) {
        const chipset = normalizeText(product.chipset)
        const hasCpuMatch = activeFilters.cpu.some((option) => {
          const keyword = normalizeText(option).replace("apple ", "a")
          return chipset.includes(keyword)
        })
        if (!hasCpuMatch) return false
      }

      if (Array.isArray(activeFilters.screenSize) && activeFilters.screenSize.length > 0) {
        const hasScreenMatch = activeFilters.screenSize.some((size) => normalizeText(product.display).includes(normalizeText(size)))
        if (!hasScreenMatch) return false
      }

      if (Array.isArray(activeFilters.camera) && activeFilters.camera.length > 0) {
        const hasCameraMatch = activeFilters.camera.some((camera) => normalizeText(product.camera).includes(normalizeText(camera)))
        if (!hasCameraMatch) return false
      }

      if (Array.isArray(activeFilters.battery) && activeFilters.battery.length > 0) {
        const batteryMah = parseBatteryMah(product.battery)
        const hasBatteryMatch = activeFilters.battery.some((label) => {
          if (label === "Dưới 5000 mAh") return batteryMah > 0 && batteryMah < 5000
          if (label === "5000 - 5500 mAh") return batteryMah >= 5000 && batteryMah <= 5500
          if (label === "Trên 5500 mAh") return batteryMah > 5500
          return false
        })
        if (!hasBatteryMatch) return false
      }

      if (Array.isArray(activeFilters.refreshRate) && activeFilters.refreshRate.length > 0) {
        const hasRefreshRateMatch = activeFilters.refreshRate.some((hz) => normalizeText(product.display).includes(normalizeText(hz)))
        if (!hasRefreshRateMatch) return false
      }

      if (Array.isArray(activeFilters.os) && activeFilters.os.length > 0) {
        const productOs = resolveOs(product.brand)
        if (!activeFilters.os.includes(productOs)) return false
      }

      if (Array.isArray(activeFilters.features) && activeFilters.features.length > 0) {
        const normalizedFeature = normalizeText(product.feature)
        const hasFeatureMatch = activeFilters.features.some((feature) => {
          const keyword = normalizeText(feature).split(" ")[0]
          return normalizedFeature.includes(keyword)
        })
        if (!hasFeatureMatch) return false
      }

      if (Array.isArray(activeFilters.brand) && activeFilters.brand.length > 0) {
        if (!activeFilters.brand.includes(product.brand)) return false
      }

      if (Array.isArray(activeFilters.series) && activeFilters.series.length > 0) {
        if (!activeFilters.series.includes(product.series)) return false
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
      return parseSoldCount(b.sold) - parseSoldCount(a.sold)
    })
  }, [filters, query, sortBy, phoneProducts])

  return (
    <>
      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <span style={styles.kicker}>Điện thoại chính hãng</span>
            <h1 style={styles.title}>Khám phá showroom điện thoại với dữ liệu thật cập nhật từ hệ thống.</h1>
            <p style={styles.subtitle}>
              Danh sách sản phẩm được tải trực tiếp từ API, có thể lọc và tìm kiếm theo nhu cầu.
            </p>

            <div style={styles.searchRow}>
              <div style={styles.searchBox}>
                <FiSearch size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm iPhone, Samsung, camera, pin, chip..."
                  style={styles.searchInput}
                />
              </div>
              <button type="button" style={styles.heroCta} onClick={() => navigate("/laptop")}>
                Xem laptop <FiChevronRight />
              </button>
            </div>

            <div style={styles.highlightGrid}>
              {PHONE_HIGHLIGHTS.map((item) => (
                <div key={item.title} style={styles.highlightCard}>
                  <span style={styles.highlightTitle}>{item.title}</span>
                  <strong style={styles.highlightValue}>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.heroVisual}>
            <div style={styles.deviceFrame}>
              <div style={styles.deviceCamera} />
              <div style={styles.deviceScreen}>
                <img
                  src={HERO_PHONE_IMAGE}
                  alt="Phone hero"
                  style={styles.deviceImage}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = PRODUCT_FALLBACK_IMAGE
                  }}
                />
                <div style={styles.deviceOverlay} />
                <div style={styles.deviceContent}>
                  <span style={styles.deviceBadge}>New season</span>
                  <h2 style={styles.deviceTitle}>Phone Lab</h2>
                  <p style={styles.deviceText}>Sạc nhanh, camera mạnh, màn hình đẹp.</p>
                  <div style={styles.deviceSpecRow}>
                    <div style={styles.deviceSpecChip}>120Hz</div>
                    <div style={styles.deviceSpecChip}>5G</div>
                    <div style={styles.deviceSpecChip}>AI Camera</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LaptopFilterSection sectionTitle="Điện thoại" deviceType="PHONE" includeUnassigned />

        <FilterBar
          title="Chọn theo tiêu chí"
          filterConfig={PHONE_FILTER_CONFIG}
          priceRanges={PHONE_PRICE_RANGES}
          onFilterChange={handleFilterChange}
        />

        <section style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Điện thoại nổi bật</h2>
            <p style={styles.sectionSubtitle}>
              {loading ? "Đang tải dữ liệu từ hệ thống..." : `${filteredProducts.length} sản phẩm đang hiển thị theo bộ lọc hiện tại.`}
            </p>
          </div>
          <span style={styles.sectionPill}>Live API</span>
        </section>

        <section style={styles.grid}>
          {!loading && filteredProducts.length === 0 ? (
            <article style={styles.emptyCard}>
              <h3 style={styles.emptyTitle}>Chưa có sản phẩm Điện thoại</h3>
              <p style={styles.emptyText}>Hãy đăng nhập admin điện thoại để thêm sản phẩm mới.</p>
            </article>
          ) : null}
          {filteredProducts.map((product) => {
            const discount = product.oldPrice > 0 ? Math.max(0, Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)) : 0
            const productImage = product.image || PRODUCT_FALLBACK_IMAGE
            const mockProductPayload = { ...product, image: productImage }

            const openDetail = () => {
              navigate(`/product/${product.id}`, { state: { mockProduct: mockProductPayload } })
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
                <div style={{ ...styles.cardVisual, background: `linear-gradient(145deg, ${product.accent})` }}>
                  <img
                    src={productImage}
                    alt={product.name}
                    style={styles.cardImage}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = PRODUCT_FALLBACK_IMAGE
                    }}
                  />
                  <div style={styles.cardImageOverlay} />
                  <div style={styles.cardGlow} />
                  <div style={styles.cardTopRow}>
                    <span style={styles.tag}>{product.tag}</span>
                    <span style={styles.rating}>
                      <FiStar size={14} /> {product.rating}
                    </span>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.brandRow}>
                    <span style={styles.brandChip}>{product.brand}</span>
                    <span style={styles.seriesChip}>{product.series}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{product.name}</h3>
                  <p style={styles.cardFeature}>{product.feature}</p>

                  <div style={styles.specGrid}>
                    <div style={styles.specItem}>
                      <FiCpu size={14} /> {product.chipset}
                    </div>
                    <div style={styles.specItem}>
                      <FiCamera size={14} /> {product.camera}
                    </div>
                    <div style={styles.specItem}>
                      <FiBatteryCharging size={14} /> {product.battery}
                    </div>
                    <div style={styles.specItem}>
                      <FiShield size={14} /> {product.display}
                    </div>
                  </div>

                  <div style={styles.metaRow}>
                    <span>{product.ram}</span>
                    <span>{product.storage}</span>
                    <span>Đã bán {product.sold}</span>
                  </div>

                  <div style={styles.priceRow}>
                    <strong style={styles.price}>{formatCurrency(product.price)}</strong>
                    <span style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</span>
                    {discount > 0 ? <span style={styles.discount}>-{discount}%</span> : null}
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.cartButton}
                      onClick={(event) => {
                        event.stopPropagation()
                        addToCart(
                          {
                            id: product.id,
                            name: product.name,
                            image: productImage,
                            price: product.price,
                            oldPrice: product.oldPrice,
                            specs: `${product.chipset} | ${product.display}`,
                            config: `${product.ram} • ${product.storage}`,
                          },
                          1
                        )
                      }}
                    >
                      <FiShoppingCart /> Thêm vào giỏ
                    </button>
                    <button
                      type="button"
                      style={styles.detailButton}
                      onClick={(event) => {
                        event.stopPropagation()
                        openDetail()
                      }}
                    >
                      Xem chi tiết <FiChevronRight />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
        <section className="news-section">
          <div className="news-header">
            <h2>TIN TỨC</h2>
            <button type="button" className="news-view-all" onClick={() => navigate("/news")}>
              Xem tất cả <FiChevronRight />
            </button>
          </div>
          <div className="news-list">
            {newsLoading ? <p>Đang tải tin tức...</p> : null}
            {!newsLoading && phoneNews.length === 0 ? <p>Chưa có bài viết tin tức.</p> : null}
            {!newsLoading && phoneNews.map((item) => (
              <article
                className="news-card"
                key={item.post_id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/news/${item.post_id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    navigate(`/news/${item.post_id}`)
                  }
                }}
              >
                <img
                  src={getNewsImageUrl(item.thumbnail_url)}
                  alt={item.title}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = NEWS_FALLBACK_IMAGE
                  }}
                />
                <h3>{item.title}</h3>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

const styles = {
  page: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "24px 20px 48px",
    background: "linear-gradient(180deg, #f6f8ff 0%, #ffffff 34%, #f8fafc 100%)",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.9fr",
    gap: 24,
    alignItems: "center",
    padding: 24,
    borderRadius: 28,
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 56%, #0ea5e9 100%)",
    color: "#fff",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
  },
  heroCopy: { display: "grid", gap: 16 },
  kicker: {
    display: "inline-flex",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  title: {
    margin: 0,
    fontSize: "clamp(32px, 4vw, 56px)",
    lineHeight: 1.02,
    maxWidth: 780,
  },
  subtitle: {
    margin: 0,
    maxWidth: 720,
    fontSize: 16,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.86)",
  },
  searchRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  searchBox: {
    flex: "1 1 360px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
  },
  searchInput: {
    width: "100%",
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#fff",
    fontSize: 15,
  },
  heroCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 18px",
    borderRadius: 16,
    border: 0,
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  highlightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  highlightCard: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  highlightTitle: { display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 },
  highlightValue: { fontSize: 15, lineHeight: 1.4 },
  heroVisual: { display: "flex", justifyContent: "center" },
  deviceFrame: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: "0.76 / 1",
    padding: 18,
    borderRadius: 34,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  deviceCamera: {
    width: 92,
    height: 10,
    borderRadius: 999,
    margin: "0 auto 16px",
    background: "rgba(255,255,255,0.45)",
  },
  deviceScreen: {
    height: "calc(100% - 34px)",
    borderRadius: 24,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(17,24,39,0.6), rgba(15,23,42,0.95))",
    display: "grid",
    alignContent: "end",
    gap: 10,
  },
  deviceImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },
  deviceOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.82) 100%)",
    zIndex: 1,
  },
  deviceContent: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    alignContent: "end",
    gap: 10,
  },
  deviceBadge: {
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(14,165,233,0.18)",
    color: "#8be1ff",
    fontSize: 12,
    fontWeight: 700,
  },
  deviceTitle: { margin: 0, fontSize: 32, lineHeight: 1 },
  deviceText: { margin: 0, color: "rgba(255,255,255,0.8)" },
  deviceSpecRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  deviceSpecChip: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 700,
  },
  filterStrip: {
    marginTop: 20,
    display: "grid",
    gap: 14,
    padding: 18,
    borderRadius: 22,
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
  },
  filterHeaderRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  filterTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.15,
    color: "#0f172a",
    fontWeight: 800,
  },
  filterStatPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 13px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "linear-gradient(180deg, #ffffff, #f8fafc)",
    boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
    cursor: "pointer",
    fontWeight: 700,
    transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
    color: "#334155",
  },
  filterChipActive: {
    background: "linear-gradient(135deg, #0f172a, #2563eb)",
    color: "#fff",
    borderColor: "transparent",
    boxShadow: "0 14px 24px rgba(15,23,42,0.18)",
    transform: "translateY(-1px)",
  },
  sortRow: {
    display: "grid",
    gap: 12,
  },
  sortTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.15,
    color: "#0f172a",
    fontWeight: 800,
  },
  sortPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  sortChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    color: "#334155",
    boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
  },
  sortChipActive: {
    background: "linear-gradient(135deg, #ef4444, #e11d48)",
    color: "#fff",
    borderColor: "transparent",
    boxShadow: "0 14px 24px rgba(225,29,72,0.2)",
    transform: "translateY(-1px)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 16,
    margin: "24px 0 14px",
  },
  sectionTitle: { margin: 0, fontSize: 26, color: "#0f172a" },
  sectionSubtitle: { margin: "6px 0 0", color: "#64748b" },
  sectionPill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    borderRadius: 18,
  emptyCard: {
    gridColumn: "1 / -1",
    padding: 24,
    borderRadius: 20,
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  },
  emptyTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
  },
  emptyText: {
    margin: "8px 0 0",
    color: "#475569",
  },
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
  },
  cardVisual: {
    position: "relative",
    height: 150,
    padding: 14,
    overflow: "hidden",
  },
  cardImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },
  cardImageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0.48) 100%)",
    zIndex: 1,
  },
  cardGlow: {
    position: "absolute",
    inset: "auto -15% -55% auto",
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    filter: "blur(2px)",
    zIndex: 2,
  },
  cardTopRow: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 3,
  },
  tag: {
    padding: "5px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
  },
  rating: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
  },
  phoneMock: {
    position: "relative",
    zIndex: 1,
    marginTop: 24,
    marginLeft: "auto",
    width: 168,
    height: 210,
    padding: 10,
    borderRadius: 28,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    backdropFilter: "blur(10px)",
  },
  phoneCamera: {
    width: 34,
    height: 8,
    borderRadius: 999,
    margin: "0 auto 12px",
    background: "rgba(255,255,255,0.45)",
  },
  phoneScreen: {
    height: "calc(100% - 20px)",
    borderRadius: 20,
    padding: 14,
    background: "linear-gradient(180deg, rgba(15,23,42,0.4), rgba(15,23,42,0.88))",
    display: "grid",
    alignContent: "end",
    gap: 6,
  },
  mockBrand: { color: "#fff", fontSize: 12, letterSpacing: 0.5 },
  mockName: { color: "#fff", fontSize: 18, fontWeight: 800, lineHeight: 1.1 },
  mockFeature: { color: "rgba(255,255,255,0.76)", fontSize: 12, lineHeight: 1.4 },
  cardBody: { padding: 10, display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  brandRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  brandChip: {
    padding: "5px 10px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
  },
  seriesChip: {
    padding: "5px 10px",
    borderRadius: 999,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 12,
    fontWeight: 700,
  },
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
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    borderRadius: 8,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 10,
    fontWeight: 600,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: "#64748b",
    fontSize: 11,
    fontWeight: 600,
  },
  priceRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 10,
  },
  price: { fontSize: 16, color: "#0f172a", fontWeight: 800 },
  oldPrice: { color: "#94a3b8", textDecoration: "line-through", fontSize: 12 },
  discount: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: 800,
  },
  actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" },
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
