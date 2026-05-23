import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiBatteryCharging,
  FiCamera,
  FiChevronRight,
  FiCpu,
  FiSearch,
  FiShoppingCart,
  FiTablet,
} from "react-icons/fi"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import Footer from "../components/Footer"
import LaptopFilterSection from "../components/LaptopFilterSection"
import { isProductInScope } from "../utils/adminScope"

const TABLET_PRODUCTS = [
  {
    id: 9801,
    name: "iPad Pro M4 11 inch",
    brand: "Apple",
    price: 27990000,
    oldPrice: 30990000,
    rating: 4.9,
    sold: "1.1k",
    storage: "256GB",
    display: "11 inch Ultra Retina XDR",
    chipset: "Apple M4",
    battery: "31.29Wh",
    camera: "12MP",
    image:
      "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=1200&q=80",
    feature: "Thiết kế mỏng nhẹ, hiệu năng mạnh cho đồ họa và sáng tạo nội dung",
  },
  {
    id: 9802,
    name: "Samsung Galaxy Tab S10 Ultra",
    brand: "Samsung",
    price: 25990000,
    oldPrice: 28990000,
    rating: 4.8,
    sold: "860",
    storage: "256GB",
    display: "14.6 inch Dynamic AMOLED 2X 120Hz",
    chipset: "Dimensity 9300+",
    battery: "11200 mAh",
    camera: "13MP + 8MP",
    image:
      "https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=1200&q=80",
    feature: "Màn hình lớn, bút S Pen, giải trí và làm việc đa nhiệm tốt",
  },
  {
    id: 9803,
    name: "Xiaomi Pad 7 Pro",
    brand: "Xiaomi",
    price: 13990000,
    oldPrice: 15990000,
    rating: 4.7,
    sold: "590",
    storage: "256GB",
    display: "12.1 inch 144Hz",
    chipset: "Snapdragon 8s Gen 3",
    battery: "10000 mAh",
    camera: "50MP",
    image:
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80",
    feature: "Hiệu năng cao, giá hợp lý, tối ưu học tập và giải trí",
  },
  {
    id: 9804,
    name: "iPad Air M2 13 inch",
    brand: "Apple",
    price: 22990000,
    oldPrice: 24990000,
    rating: 4.8,
    sold: "740",
    storage: "128GB",
    display: "13 inch Liquid Retina",
    chipset: "Apple M2",
    battery: "36.59Wh",
    camera: "12MP",
    image:
      "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80",
    feature: "Màn hình lớn nhẹ, phù hợp ghi chú, học online và làm việc",
  },
  {
    id: 9805,
    name: "Lenovo Tab P12",
    brand: "Lenovo",
    price: 10990000,
    oldPrice: 12990000,
    rating: 4.6,
    sold: "320",
    storage: "128GB",
    display: "12.7 inch 3K",
    chipset: "Dimensity 7050",
    battery: "10200 mAh",
    camera: "13MP",
    image:
      "https://images.unsplash.com/photo-1527698266440-12104e498b76?auto=format&fit=crop&w=1200&q=80",
    feature: "Màn hình 3K lớn, pin trâu, thích hợp học tập và văn phòng",
  },
  {
    id: 9806,
    name: "Huawei MatePad 11.5S",
    brand: "Huawei",
    price: 11990000,
    oldPrice: 13990000,
    rating: 4.6,
    sold: "280",
    storage: "256GB",
    display: "11.5 inch 144Hz",
    chipset: "Kirin 9000WL",
    battery: "8800 mAh",
    camera: "13MP",
    image:
      "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=1200&q=80",
    feature: "Màn hình mượt, thiết kế đẹp, hỗ trợ bút ghi chú tốt",
  },
]

const PRODUCT_FALLBACK_IMAGE = "https://placehold.co/1200x900/e2e8f0/0f172a?text=Tablet"

const sorters = {
  popular: (a, b) => parseSold(b.sold) - parseSold(a.sold),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
}

function parseSold(value) {
  if (!value) return 0
  if (String(value).includes("k")) return Number(String(value).replace("k", "")) * 1000
  return Number(value) || 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

const mapApiProductToTabletCard = (product) => ({
  id: Number(product?.id),
  name: product?.name || "Tablet",
  brand: product?.brand || "Unknown",
  price: Number(product?.price || 0),
  oldPrice: Number(product?.oldPrice || product?.price || 0),
  rating: 4.7,
  sold: String(product?.sold || "0"),
  storage: product?.storage || "Đang cập nhật",
  display: product?.screenSize || "Đang cập nhật",
  chipset: product?.cpu || "Đang cập nhật",
  battery: product?.batteryCapacityMah ? `${product.batteryCapacityMah} mAh` : "Đang cập nhật",
  camera: product?.deviceSpecificSpecs?.rear_camera_mp ? `${product.deviceSpecificSpecs.rear_camera_mp}MP` : "Đang cập nhật",
  image: product?.image || PRODUCT_FALLBACK_IMAGE,
  feature: (Array.isArray(product?.features) && product.features[0]) || "Sản phẩm chính hãng",
})

export default function TabletPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products, loading } = useProducts()
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState("Tất cả")
  const [sortBy, setSortBy] = useState("popular")

  const tabletProducts = useMemo(() => {
    const source = Array.isArray(products) ? products.filter((item) => isProductInScope(item, "TABLET")) : []
    return source.map(mapApiProductToTabletCard)
  }, [products])

  const brandOptions = useMemo(() => {
    const dynamicBrands = [...new Set(tabletProducts.map((item) => item.brand).filter(Boolean))]
    return ["Tất cả", ...dynamicBrands]
  }, [tabletProducts])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return tabletProducts.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.feature.toLowerCase().includes(normalizedQuery) ||
        item.chipset.toLowerCase().includes(normalizedQuery)

      const matchesBrand = brand === "Tất cả" || item.brand === brand
      return matchesQuery && matchesBrand
    }).sort(sorters[sortBy] || sorters.popular)
  }, [brand, query, sortBy, tabletProducts])

  return (
    <>
      <main style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <span style={styles.kicker}>Tablet chính hãng</span>
            <h1 style={styles.title}>Trang Tablet riêng để bạn test giao diện và luồng mua sắm.</h1>
            <p style={styles.subtitle}>{loading ? "Đang đồng bộ dữ liệu tablet từ API..." : "Chọn nhanh theo hãng, tìm kiếm theo nhu cầu và thêm vào giỏ trực tiếp."}</p>
            <div style={styles.searchWrap}>
              <FiSearch size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm iPad, Galaxy Tab, Xiaomi Pad..."
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterRow}>
              {brandOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  style={{ ...styles.filterChip, ...(brand === item ? styles.filterChipActive : {}) }}
                  onClick={() => setBrand(item)}
                >
                  {item}
                </button>
              ))}
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={styles.sortSelect}>
                <option value="popular">Phổ biến</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
              </select>
            </div>
          </div>

          <div style={styles.heroMedia}>
            <img
              src="https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=80"
              alt="Tablet hero"
              style={styles.heroImage}
              loading="lazy"
            />
            <div style={styles.heroBadge}>
              <FiTablet size={15} /> Tablet Collection
            </div>
          </div>
        </section>

        <LaptopFilterSection sectionTitle="Máy tính bảng" deviceType="TABLET" includeUnassigned />

        <section style={styles.grid}>
          {!loading && filtered.length === 0 ? (
            <article style={{ ...styles.card, padding: 24, justifyContent: "center", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Chưa có sản phẩm Tablet</h3>
              <p style={{ margin: "8px 0 0", color: "#64748b" }}>Hãy đăng nhập admin tablet để thêm sản phẩm mới.</p>
            </article>
          ) : null}
          {filtered.map((product) => {
            const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
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
                  <div style={styles.cardTop}>
                    <span style={styles.brand}>{product.brand}</span>
                    <span style={styles.rating}>{product.rating}★</span>
                  </div>
                  <h3 style={styles.cardTitle}>{product.name}</h3>
                  <p style={styles.feature}>{product.feature}</p>

                  <div style={styles.specGrid}>
                    <span style={styles.specItem}>
                      <FiCpu size={13} /> {product.chipset}
                    </span>
                    <span style={styles.specItem}>
                      <FiCamera size={13} /> {product.camera}
                    </span>
                    <span style={styles.specItem}>
                      <FiBatteryCharging size={13} /> {product.battery}
                    </span>
                    <span style={styles.specItem}>{product.display}</span>
                  </div>

                  <div style={styles.meta}>
                    <span>{product.storage}</span>
                    <span>Đã bán {product.sold}</span>
                  </div>

                  <div style={styles.priceRow}>
                    <strong style={styles.price}>{formatCurrency(product.price)}</strong>
                    <span style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</span>
                    <span style={styles.discount}>-{discount}%</span>
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
                            specs: `${product.chipset} | ${product.display}`,
                            config: product.storage,
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
                      Xem chi tiết <FiChevronRight />
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
    maxWidth: 1400,
    margin: "0 auto",
    padding: "22px 18px 46px",
    display: "grid",
    gap: 18,
    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 32%, #f8fafc 100%)",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 16,
    borderRadius: 24,
    padding: 18,
    background: "linear-gradient(135deg, #0f172a 0%, #1e40af 58%, #0284c7 100%)",
    color: "#fff",
  },
  heroCopy: { display: "grid", gap: 10 },
  kicker: {
    width: "fit-content",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
  },
  title: {
    margin: 0,
    fontSize: "clamp(25px, 3.2vw, 42px)",
    lineHeight: 1.06,
  },
  subtitle: {
    margin: 0,
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  searchInput: {
    border: 0,
    outline: 0,
    background: "transparent",
    width: "100%",
    color: "#fff",
    fontSize: 14,
  },
  filterRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterChip: {
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  filterChipActive: {
    background: "#fff",
    color: "#0f172a",
  },
  sortSelect: {
    marginLeft: "auto",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "7px 10px",
    fontSize: 13,
  },
  heroMedia: {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    minHeight: 240,
    border: "1px solid rgba(255,255,255,0.2)",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  heroBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.7)",
    color: "#fff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  cardImage: {
    width: "100%",
    aspectRatio: "16 / 10",
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 10,
    flex: 1,
  },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#e0ecff",
    borderRadius: 999,
    padding: "5px 9px",
  },
  rating: { fontSize: 12, fontWeight: 700, color: "#334155" },
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
  feature: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.3,
    color: "#475569",
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
  meta: {
    display: "flex",
    justifyContent: "space-between",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 12,
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  price: { fontSize: 16, color: "#0f172a", lineHeight: 1, fontWeight: 800 },
  oldPrice: { textDecoration: "line-through", color: "#94a3b8", fontSize: 12 },
  discount: {
    borderRadius: 999,
    padding: "4px 8px",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: 11,
    fontWeight: 700,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: "auto",
  },
  cartBtn: {
    border: 0,
    borderRadius: 8,
    padding: "8px 7px",
    background: "#db001b",
    color: "#fff",
    fontWeight: 700,
    fontSize: 11,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    cursor: "pointer",
  },
  detailBtn: {
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "8px 7px",
    background: "#fff",
    color: "#1e293b",
    fontWeight: 700,
    fontSize: 11,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    cursor: "pointer",
  },
}
