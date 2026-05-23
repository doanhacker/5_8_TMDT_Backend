import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiArrowLeft } from 'react-icons/fi'
import * as paymentApi from '../services/paymentApi'
import { updateOrderByIdAnyScope } from '../lib/orderStorage'
import '../styles/PaymentStatus.css'

const updateLocalOrderPayment = (orderId, updater) => {
  updateOrderByIdAnyScope(orderId, updater)
}

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId')

  useEffect(() => {
    const loadPayment = async () => {
      if (!orderId) {
        setError('Thiếu mã đơn hàng')
        setLoading(false)
        return
      }
      try {
        const response = await paymentApi.getPaymentByOrderId(orderId)
        setPayment(response?.data || null)
        updateLocalOrderPayment(orderId, (order) => ({
          ...order,
          paymentId: response?.data?.payment_id || order.paymentId,
          paymentStatus: response?.data?.payment_status || 'PAID',
          transactionId: response?.data?.transaction_id || order.transactionId,
        }))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPayment()
  }, [orderId])

  return (
    <div className='pay-status-page pay-status-success'>
      <div className='pay-status-card'>
        <FiCheckCircle className='pay-status-icon' />
        <h1>Thanh toán thành công</h1>
        {loading ? <p>Đang xác nhận giao dịch...</p> : null}
        {!loading && error ? <p>{error}</p> : null}
        {!loading && !error ? (
          <>
            <p>Đơn hàng #{orderId} đã được ghi nhận thành công.</p>
            <div className='pay-status-meta'>
              <div><strong>Phương thức:</strong> {payment?.payment_method || 'Thanh toán online'}</div>
              <div><strong>Trạng thái:</strong> {payment?.payment_status || 'PAID'}</div>
              <div><strong>Mã giao dịch:</strong> {payment?.transaction_id || 'Đang cập nhật'}</div>
            </div>
          </>
        ) : null}
        <div className='pay-status-actions'>
          <button className='pay-status-btn pay-status-btn-primary' onClick={() => navigate('/order-tracking')}>
            Xem đơn hàng
          </button>
          <button className='pay-status-btn' onClick={() => navigate('/')}>
            <FiArrowLeft /> Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  )
}
