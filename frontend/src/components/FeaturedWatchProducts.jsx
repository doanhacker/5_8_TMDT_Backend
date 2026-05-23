import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { MOCK_WATCH_PRODUCTS } from "../data/mockWatchProducts"
import "../styles/FeaturedProducts.css"

const getDiscountLabel = (minPrice, maxPrice) => {
  const current = Number(minPrice || 0)
  const original = Number(maxPrice || 0)
  if (current > 0 && original > current) {
    const percent = Math.round(((original - current) / original) * 100)
    return percent > 0 ? `Giảm ${percent}%` : ""
  }
  return ""
}

export default function FeaturedWatchProducts() {
  const navigate = useNavigate()

  const featuredProducts = useMemo(() => {
    return MOCK_WATCH_PRODUCTS.slice(0, 5).map((p) => {
      const price = Number(p.min_price || 0)
      const oldPrice = Number(p.max_price || p.min_price || 0)
      const stock = Math.max(Number(p.total_stock || 0), 20)
      const sold = Math.min(Number(p.total_sold || 0), stock - 1)
      const spec = [p.strap, ...(p.features || []).slice(0, 2)].filter(Boolean).join(" · ") || "Đồng hồ"
      return {
        id: p.product_id,
        name: p.product_name,
        image: p.primary_product_image_url,
        price,
        oldPrice,
        stock,
        sold: Math.max(0, sold),
        spec,
        config: p.brand_name,
        installment: "Trả góp 0%"
      }
    })
  }, [])

  if (featuredProducts.length === 0) {
    return null
  }

  return (
    <div className="featured-wrapper">
      <h2 className="featured-title">🔥 ĐỒNG HỒ NỔI BẬT</h2>

      <div className="featured-container">
        <div className="product-list">
          {featuredProducts.map((item) => (
            <div
              className="product-card"
              onClick={() => navigate(`/product/${item.id}`)}
              key={item.id}
              role="presentation"
            >
              {(() => {
                const discountLabel = getDiscountLabel(item.price, item.oldPrice)
                return discountLabel ? <span className="discount">{discountLabel}</span> : null
              })()}
              {(() => {
                const percent = Math.min(100, Math.round((item.sold / item.stock) * 100))
                const remain = Math.max(0, item.stock - item.sold)
                return (
                  <>
                    {remain <= 8 && <div className="featured-stock-alert">Sắp hết hàng</div>}
                    <div className="featured-stock-wrap">
                      <div className="featured-stock-top">
                        <span>Đã bán {item.sold}</span>
                        <span>Còn {remain}</span>
                      </div>
                      <div className="featured-stock-bar">
                        <div className="featured-stock-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </>
                )
              })()}
              {item.installment && <span className="installment">{item.installment}</span>}
              <img src={item.image} alt={item.name} />
              <div className="spec">{item.spec}</div>
              <h4 className="prod-name">{item.name}</h4>
              <div className="rating">⭐⭐⭐⭐⭐</div>
              <div className="price">
                <span className="new">{Number(item.price || 0).toLocaleString("vi-VN")}đ</span>
                <span className="old">{Number(item.oldPrice || item.price || 0).toLocaleString("vi-VN")}đ</span>
              </div>
              <button type="button" className="favorite">
                ♡ Yêu thích
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
