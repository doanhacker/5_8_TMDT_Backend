import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi'
import { updateOrderByIdAnyScope } from '../lib/orderStorage'
import '../styles/PaymentStatus.css'

const updateLocalOrderPayment = (orderId, updater) => {
  updateOrderByIdAnyScope(orderId, updater)
}

export default function PaymentFailed() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const message = searchParams.get('message') || 'Giao dịch không thành công hoặc đã bị hủy.'

  useEffect(() => {
    if (!orderId) return
    updateLocalOrderPayment(orderId, (order) => ({
      ...order,
      paymentStatus: 'UNPAID',
      paymentFailedMessage: message,
    }))
  }, [message, orderId])

  return (
    <div className='pay-status-page pay-status-failed'>
      <div className='pay-status-card'>
        <FiAlertCircle className='pay-status-icon' />
        <h1>Thanh toán chưa hoàn tất</h1>
        <p>Đơn hàng #{orderId || '---'} chưa được thanh toán thành công.</p>
        <div className='pay-status-meta'>
          <div><strong>Lý do:</strong> {message}</div>
        </div>
        <div className='pay-status-actions'>
          <button className='pay-status-btn pay-status-btn-primary' onClick={() => navigate('/order-tracking')}>
            Xem đơn hàng
          </button>
          <button className='pay-status-btn' onClick={() => navigate('/cart')}>
            <FiArrowLeft /> Quay lại giỏ hàng
          </button>
        </div>
      </div>
    </div>
  )
}
