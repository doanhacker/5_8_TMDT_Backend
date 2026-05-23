import '../styles/CartModal.css'
import { useNavigate } from 'react-router-dom'

export default function CartModal({ onClose }) {

  const items = [] // dữ liệu demo
  const hasItems = items.length > 0
  const navigate = useNavigate()

  const handleGoToCart = () => {
    onClose()          // đóng modal trước
    navigate('/cart')  // chuyển sang trang cart
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-container" onClick={e => e.stopPropagation()}>
        <button className="cart-close" onClick={onClose}>&times;</button>
        <h2>Giỏ hàng của bạn</h2>

        {hasItems ? (
          <>
            {/* NÚT CHUYỂN SANG /cart */}
            <button 
              className="cart-button"
              onClick={handleGoToCart}
            >
              Giỏ hàng
            </button>

            <label className="cart-selectall">
              <input type="checkbox" /> Chọn tất cả
            </label>

            <div className="cart-items">
              {items.map(item => (
                <div className="cart-item" key={item.id}>
                  <input type="radio" />
                  <img src={item.img} alt={item.name} />
                  <div className="cart-detail">
                    <span className="cart-name">{item.name}</span>
                    <span className="cart-price">{item.price}</span>
                  </div>
                  <div className="cart-qty">
                    <button>-</button>
                    <span>{item.qty}</span>
                    <button>+</button>
                  </div>
                  <button className="cart-delete">🗑</button>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <span>Tạm tính:</span> <strong>0đ</strong>
            </div>

            <button 
              className="cart-checkout"
              onClick={handleGoToCart}
            >
              Mua ngay
            </button>
          </>
        ) : (
          <div className="cart-empty">
            <img
                src="https://via.placeholder.com/200x120?text=TechMart"
              alt="empty cart"
            />
            <p>Giỏ hàng của bạn đang trống.</p>
            <p>Hãy chọn thêm sản phẩm để mua sắm nhé</p>
            <button className="cart-back" onClick={onClose}>
              Quay lại trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
