import { useMemo } from "react"
import "../styles/FeaturedProducts.css"
import { useNavigate } from "react-router-dom"
import { useProducts } from "../context/ProductContext"

const getDiscountLabel = (item) => {
  if (item?.discount) return item.discount

  const currentPrice = Number(item?.price || 0)
  const originalPrice = Number(item?.oldPrice || 0)
  if (currentPrice > 0 && originalPrice > currentPrice) {
    const percent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    return percent > 0 ? `Giảm ${percent}%` : ''
  }

  return ''
}

export default function FeaturedProducts() {
  const { products, loading } = useProducts()
  const featuredProducts = useMemo(() => {
    return products
      .filter((item) => item.status !== "DISCONTINUED")
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        spec: item.config || item.specs || "Đang cập nhật",
        sold: Math.max(0, Math.min(Number(item.stock || 0), Math.round(Number(item.stock || 0) * (0.35 + index * 0.04)))),
      }))
  }, [products])
  const navigate = useNavigate()

  if (loading) {
    return null
  }

  if (featuredProducts.length === 0) {
    return null
  }

  return (
    <div className="featured-wrapper">
      <h2 className="featured-title">🔥 SẢN PHẨM NỔI BẬT</h2>

      <div className="featured-container">
        <div className="product-list">
          {featuredProducts.map((item) => (
            <div className="product-card"
            onClick={() => navigate(`/product/${item.id}`)}
             key={item.id}>
              {(() => {
                const discountLabel = getDiscountLabel(item)
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
              <button className="favorite">♡ Yêu thích</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}