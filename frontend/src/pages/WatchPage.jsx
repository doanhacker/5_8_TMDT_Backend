import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { FiShoppingCart } from "react-icons/fi"
import BannerSlider from "../components/BannerSlider"
import WatchFilterSection from "../components/WatchFilterSection"
import FeaturedWatchProducts from "../components/FeaturedWatchProducts"
import WatchFilterBar from "../components/WatchFilterBar"
import HomeArticleSection from "../components/HomeArticleSection"
import QASection from "../components/QASection"
import Footer from "../components/Footer"
import { MOCK_WATCH_PRODUCTS, WATCH_BRANDS, WATCH_CATEGORY_IDS } from "../data/mockWatchProducts"
import { useCart } from "../context/CartContext"
import "../styles/HomeContainer.css"
import "../styles/ProductListSection.css"
import "../styles/TaxonomyProductsPage.css"

export default function WatchPage() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState("popular")

  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = 12

  const categoryParam = searchParams.get("category") || WATCH_CATEGORY_IDS.ALL
  const brandParam = searchParams.get("brand") || ""

  const brandNameFromUrl = useMemo(() => {
    if (!brandParam) return ""
    return WATCH_BRANDS.find((b) => b.id === brandParam)?.name || ""
  }, [brandParam])

  const handleFilterChange = (newFilters, newSortBy) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", "1")
      return next
    })
  }

  const mappedItems = useMemo(
    () =>
      MOCK_WATCH_PRODUCTS.map((product) => {
        const price = Number(product?.min_price || 0)
        const oldPrice = Number(product?.max_price || 0) || price
        const sold = Number(product?.total_sold || 0)
        const baseStock = Number(product?.total_stock || 0)
        const stock = Math.max(baseStock, sold + 10)
        const featuresList = Array.isArray(product?.features) ? product.features : []
        const specs =
          [product?.strap, ...featuresList.slice(0, 3)].filter(Boolean).join(" | ") || "Đồng hồ chính hãng"

        return {
          id: product?.product_id,
          name: product?.product_name || "Đồng hồ",
          image: product?.primary_product_image_url,
          specs,
          config: product?.brand_name || "Bảo hành chính hãng",
          price,
          oldPrice,
          sold,
          stock,
          installment: "Trả góp 0%",
          categorySlug: product?.category_slug || "",
          brandName: product?.brand_name || "",
          strap: product?.strap || "",
          featuresList,
          newArrival: Boolean(product?.new_arrival),
          discount:
            oldPrice > price && price > 0
              ? `Giảm ${Math.round(((oldPrice - price) / oldPrice) * 100)}%`
              : ""
        }
      }),
    []
  )

  const filteredItems = useMemo(() => {
    return mappedItems.filter((item) => {
      if (categoryParam && categoryParam !== WATCH_CATEGORY_IDS.ALL) {
        if (item.categorySlug !== categoryParam) return false
      }

      if (brandNameFromUrl && item.brandName !== brandNameFromUrl) {
        return false
      }

      if (filters?.priceRange) {
        const max = filters.priceRange.max === Infinity ? Number.MAX_SAFE_INTEGER : filters.priceRange.max
        if (item.price < filters.priceRange.min || item.price > max) return false
      }

      if (filters?.brand?.length > 0) {
        if (!filters.brand.includes(item.brandName)) return false
      }

      if (filters?.strap?.length > 0) {
        if (!filters.strap.includes(item.strap)) return false
      }

      if (filters?.features?.length > 0) {
        const ok = filters.features.some((f) => item.featuresList.includes(f))
        if (!ok) return false
      }

      if (filters?.inStock) {
        const remain = Math.max(0, item.stock - item.sold)
        if (remain <= 0) return false
      }

      if (filters?.newArrival && !item.newArrival) return false

      return true
    })
  }, [mappedItems, categoryParam, brandNameFromUrl, filters])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case "priceAsc":
          return a.price - b.price
        case "priceDesc":
          return b.price - a.price
        case "promotion": {
          const aDiscount = a.oldPrice > 0 ? ((a.oldPrice - a.price) / a.oldPrice) * 100 : 0
          const bDiscount = b.oldPrice > 0 ? ((b.oldPrice - b.price) / b.oldPrice) * 100 : 0
          return bDiscount - aDiscount
        }
        case "popular":
        default:
          return b.sold - a.sold
      }
    })
  }, [filteredItems, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / limit))
  const safePage = Math.min(page, totalPages)
  const pagedItems = sortedItems.slice((safePage - 1) * limit, safePage * limit)

  useEffect(() => {
    if (page !== safePage) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", String(safePage))
        return next
      })
    }
  }, [page, safePage, setSearchParams])

  const goToPage = (nextPage) => {
    const p = Math.max(1, Math.min(nextPage, totalPages))
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set("page", String(p))
      return n
    })
  }

  return (
    <>
      <div className="home-page-shell">
        <BannerSlider />
        <WatchFilterSection />
        <FeaturedWatchProducts />
        <WatchFilterBar onFilterChange={handleFilterChange} />

        <div className="product-section">
          {pagedItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
              <h3>Không tìm thấy sản phẩm đồng hồ phù hợp</h3>
              <p>Vui lòng thử điều chỉnh danh mục hoặc bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {pagedItems.map((item) => (
                  <div
                    className="product-card"
                    key={item.id}
                    onClick={() => navigate(`/product/${item.id}`)}
                    style={{ cursor: "pointer" }}
                    role="presentation"
                  >
                    {item.discount ? <div className="badge-left">{item.discount}</div> : null}
                    <div className="badge-right">{item.installment}</div>
                    <img src={item.image} alt={item.name} />
                    <p className="specs">{item.specs}</p>
                    <p className="config">{item.config}</p>
                    <h4 className="product-name">{item.name}</h4>
                    <div className="price-box">
                      <span className="new-price">{item.price.toLocaleString("vi-VN")}đ</span>
                      <span className="old-price">{item.oldPrice.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="promo-box">Ưu đãi đặc biệt cho sản phẩm đồng hồ</div>
                    <div className="description">Bảo hành chính hãng - Hỗ trợ trả góp linh hoạt</div>
                    <div className="card-footer">
                      <span className="rating">⭐ 5</span>
                      <span className="favorite">♡ Yêu thích</span>
                    </div>
                    <button
                      type="button"
                      className="btn-add-to-cart"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(
                          {
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            price: item.price,
                            oldPrice: item.oldPrice,
                            specs: item.specs,
                            config: item.config
                          },
                          1
                        )
                        alert(`Đã thêm "${item.name}" vào giỏ hàng!`)
                      }}
                    >
                      <FiShoppingCart /> Thêm vào giỏ hàng
                    </button>
                  </div>
                ))}
              </div>

              <div className="taxonomy-pagination">
                <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage <= 1}>
                  ← Trước
                </button>
                <span>
                  Trang {safePage}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                >
                  Sau →
                </button>
              </div>
            </>
          )}
        </div>

        <HomeArticleSection />
        <QASection />
      </div>
      <Footer />
    </>
  )
}
