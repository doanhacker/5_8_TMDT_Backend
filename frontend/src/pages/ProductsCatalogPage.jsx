import { useMemo } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { FiChevronRight, FiTag } from "react-icons/fi"
import Footer from "../components/Footer"

const CATEGORY_META = {
  accessory: {
    title: "Phụ kiện công nghệ",
    subtitle: "Tai nghe, sạc nhanh, cáp, pin dự phòng và nhiều phụ kiện chính hãng.",
  },
  smartwatch: {
    title: "Smartwatch",
    subtitle: "Đồng hồ thông minh theo dõi sức khỏe và luyện tập thể thao.",
  },
  tablet: {
    title: "Máy tính bảng",
    subtitle: "Tablet học tập, giải trí và làm việc linh hoạt cho mọi nhu cầu.",
  },
  monitor: {
    title: "Màn hình, Máy in",
    subtitle: "Thiết bị hiển thị và in ấn cho học tập, văn phòng và gaming.",
  },
  phone: {
    title: "Điện thoại",
    subtitle: "Smartphone chính hãng, nhiều phân khúc và ưu đãi hấp dẫn.",
  },
  watch: {
    title: "Đồng hồ",
    subtitle: "Đồng hồ thông minh và phụ kiện đeo tay công nghệ mới nhất.",
  },
  headphone: {
    title: "Tai nghe",
    subtitle: "Tai nghe không dây, chống ồn và âm thanh chất lượng cao.",
  },
}

const RECOMMENDED_BLOCKS = [
  {
    id: "phone",
    label: "Điện thoại",
    desc: "Xem các mẫu smartphone nổi bật",
    cta: "Mở trang Điện thoại",
    path: "/phone",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "laptop",
    label: "Laptop",
    desc: "Laptop học tập, văn phòng và gaming",
    cta: "Mở trang Laptop",
    path: "/laptop",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "watch",
    label: "Đồng hồ",
    desc: "Smartwatch theo dõi sức khỏe",
    cta: "Mở trang Đồng hồ",
    path: "/dong-ho",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  },
]

export default function ProductsCatalogPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const category = String(searchParams.get("category") || "").toLowerCase()
  const used = searchParams.get("used") === "true"

  if (used) {
    return <Navigate to="/may-cu-thu-cu" replace />
  }

  const pageMeta = useMemo(() => {
    return CATEGORY_META[category] || {
      title: "Danh mục sản phẩm",
      subtitle: "Khám phá thêm các nhóm sản phẩm công nghệ tại TechMart.",
    }
  }, [category])

  return (
    <>
      <main style={styles.page}>
        <section style={styles.hero}>
          <span style={styles.kicker}>
            <FiTag size={14} /> Danh mục
          </span>
          <h1 style={styles.title}>{pageMeta.title}</h1>
          <p style={styles.subtitle}>{pageMeta.subtitle}</p>
        </section>

        <section style={styles.grid}>
          {RECOMMENDED_BLOCKS.map((item) => (
            <article key={item.id} style={styles.card}>
              <img src={item.image} alt={item.label} style={styles.cardImage} loading="lazy" />
              <div style={styles.cardBody}>
                <h2 style={styles.cardTitle}>{item.label}</h2>
                <p style={styles.cardDesc}>{item.desc}</p>
                <button type="button" style={styles.cardButton} onClick={() => navigate(item.path)}>
                  {item.cta} <FiChevronRight />
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  )
}

const styles = {
  page: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "20px 18px 44px",
    display: "grid",
    gap: 20,
  },
  hero: {
    borderRadius: 18,
    padding: "20px 22px",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "#fff",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.14)",
  },
  kicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.9,
  },
  title: {
    margin: "8px 0 6px",
    fontSize: "clamp(24px, 3vw, 36px)",
    lineHeight: 1.08,
  },
  subtitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.9)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
  },
  cardImage: {
    width: "100%",
    aspectRatio: "16 / 9",
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    padding: 12,
    display: "grid",
    gap: 8,
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
  },
  cardDesc: {
    margin: 0,
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.45,
  },
  cardButton: {
    width: "fit-content",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    border: 0,
    padding: "8px 10px",
    borderRadius: 10,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 700,
    cursor: "pointer",
  },
}
