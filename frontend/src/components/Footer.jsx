import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Cột 1 */}
        <div className="footer-col">
          <h4>Tổng đài hỗ trợ miễn phí</h4>
          <p>Mua hàng - bảo hành <strong>1800.2097</strong></p>
          <p>Khiếu nại <strong>1800.2063</strong></p>

          <h4>Phương thức thanh toán</h4>
          <div className="payment-logos">
            <span>Apple Pay</span>
            <span>VNPay</span>
            <span>Momo</span>
            <span>ZaloPay</span>
          </div>

          <h4>ĐĂNG KÝ NHẬN TIN KHUYẾN MÃI</h4>
          <div className="subscribe-group">
            <input type="email" placeholder="Nhập email của bạn" />
            
          </div>
          <div className="subscribe-group">
            <input type="text" placeholder="Nhập số điện thoại của bạn" />
          
          </div>
        </div>

        {/* Cột 2 */}
        <div className="footer-col">
          <h4>Thông tin và chính sách</h4>
          <ul>
            <li>Mua hàng và thanh toán Online</li>
            <li>Chính sách giao hàng</li>
            <li>Chính sách đổi trả</li>
            <li>Tra cứu hóa đơn</li>
            <li>VAT Refund</li>
          </ul>
        </div>

        {/* Cột 3 */}
        <div className="footer-col">
          <h4>Dịch vụ và thông tin khác</h4>
          <ul>
            <li>Khách hàng doanh nghiệp (B2B)</li>
            <li>Ưu đãi thanh toán</li>
            <li>Chính sách bảo mật</li>
            <li>Tuyển dụng</li>
          </ul>
        </div>

        {/* Cột 4 */}
        <div className="footer-col">
          <h4>Kết nối với chúng tôi</h4>
          <div className="social-icons">
            <span>Youtube</span>
            <span>Facebook</span>
            <span>Instagram</span>
            <span>TikTok</span>
          </div>

          <h4>Website thành viên</h4>
          <ul>
            <li>dienthoaivui</li>
            <li>careS</li>
            <li>sforum.vn</li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 TechMart. All rights reserved.
      </div>
    </footer>
  )
}
