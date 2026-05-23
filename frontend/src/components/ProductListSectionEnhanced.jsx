import "../styles/ProductListSection.css"
import { useNavigate } from "react-router-dom"
import { useProducts } from "../context/ProductContext"
import { useCart } from "../context/CartContext"
import { FiShoppingCart } from "react-icons/fi"

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

export default function ProductListSection({ filters, sortBy, selectedCategory = '' }) {
  const navigate = useNavigate()
  const { products, loading } = useProducts()
  const { addToCart } = useCart()

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#666'
      }}>
        <p>Đang tải sản phẩm...</p>
      </div>
    )
  }

  // Lọc sản phẩm
  const filteredProducts = products.filter((product) => {
    if (selectedCategory && product.series !== selectedCategory) return false

    // Lọc theo sẵn hàng
    if (filters?.inStock && !product.inStock) return false
    
    // Lọc theo hàng mới về
    if (filters?.newArrival && !product.newArrival) return false
    
    // Lọc theo khoảng giá
    if (filters?.priceRange) {
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false
      }
    }
    
    // Lọc theo storage
    if (filters?.storage?.length > 0) {
      if (!filters.storage.includes(product.storage)) return false
    }
    
    // Lọc theo RAM
    if (filters?.ram?.length > 0) {
      if (!filters.ram.includes(product.ram)) return false
    }
    
    // Lọc theo CPU
    if (filters?.cpu?.length > 0) {
      const matchCPU = filters.cpu.some(cpu => product.cpu.includes(cpu))
      if (!matchCPU) return false
    }
    
    // Lọc theo kích thước màn hình
    if (filters?.screenSize?.length > 0) {
      if (!filters.screenSize.includes(product.screenSize)) return false
    }
    
    // Lọc theo độ phân giải
    if (filters?.resolution?.length > 0) {
      if (!filters.resolution.includes(product.resolution)) return false
    }
    
    // Lọc theo card đồ họa
    if (filters?.graphics?.length > 0) {
      const matchGraphics = filters.graphics.some(gpu => product.graphics.includes(gpu))
      if (!matchGraphics) return false
    }
    
    // Lọc theo tính năng
    if (filters?.features?.length > 0) {
      const hasFeature = filters.features.some(feature => product.features.includes(feature))
      if (!hasFeature) return false
    }
    
    // Lọc theo AI
    if (filters?.ai?.length > 0 && !product.hasAI) return false
    
    // Lọc theo hãng
    if (filters?.brand?.length > 0) {
      if (!filters.brand.includes(product.brand)) return false
    }
    
    // Lọc theo dòng sản phẩm
    if (filters?.series?.length > 0) {
      if (!filters.series.includes(product.series)) return false
    }
    
    return true
  })

  // Sắp xếp sản phẩm
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return a.price - b.price
      case 'priceDesc':
        return b.price - a.price
      case 'promotion':
        const aDiscount = ((a.oldPrice - a.price) / a.oldPrice) * 100
        const bDiscount = ((b.oldPrice - b.price) / b.oldPrice) * 100
        return bDiscount - aDiscount
      case 'popular':
      default:
        return b.sold - a.sold
    }
  })

  return (
    <div className="product-section">
      {sortedProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <h3>Không tìm thấy sản phẩm phù hợp</h3>
          <p>Vui lòng thử điều chỉnh bộ lọc của bạn</p>
        </div>
      ) : (
        <div className="product-grid">
          {sortedProducts.map((item) => (
            <div className="product-card"
             key={item.id}
             onClick={() => navigate(`/product/${item.id}`)}
             style={{ cursor: "pointer" }}
             >
              {(() => {
                const discountLabel = getDiscountLabel(item)
                return discountLabel ? <div className="badge-left">{discountLabel}</div> : null
              })()}
              {(() => {
                const percent = Math.min(100, Math.round((item.sold / item.stock) * 100))
                const remain = Math.max(0, item.stock - item.sold)
                return (
                  <>
                    {remain <= 8 && <div className="stock-alert">Sắp hết hàng</div>}
                    <div className="stock-wrap">
                      <div className="stock-top">
                        <span>Đã bán {item.sold}</span>
                        <span>Còn {remain} sản phẩm</span>
                      </div>
                      <div className="stock-bar">
                        <div className="stock-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </>
                )
              })()}
              
              {/* Top badges */}
              <div className="badge-right">{item.installment}</div>

              {/* Image */}
              <img src={item.image} alt={item.name} />

              {/* Specs */}
              <p className="specs">{item.specs}</p>
              <p className="config">{item.config}</p>

              {/* Name */}
              <h4 className="product-name">{item.name}</h4>

              {/* Price */}
              <div className="price-box">
                <span className="new-price">{item.price.toLocaleString('vi-VN')}đ</span>
                <span className="old-price">{item.oldPrice.toLocaleString('vi-VN')}đ</span>
              </div>

              {/* Promotion */}
              <div className="promo-box">
                S-Student giảm thêm 500.000đ
              </div>

              <div className="description">
                Giảm thêm 10% cho Pin dự phòng - Camera - Gia dụng...
              </div>

              {/* Footer */}
              <div className="card-footer">
                <span className="rating">⭐ 5</span>
                <span className="favorite">♡ Yêu thích</span>
              </div>

              {/* Add to Cart Button */}
              <button 
                className="btn-add-to-cart"
                onClick={(e) => {
                  e.stopPropagation()
                  addToCart(item, 1)
                  alert(`Đã thêm "${item.name}" vào giỏ hàng!`)
                }}
              >
                <FiShoppingCart /> Thêm vào giỏ hàng
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}