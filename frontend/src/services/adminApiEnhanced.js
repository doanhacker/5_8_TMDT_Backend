import { buildApiUrl } from '../config/api'
import { getAuthToken, notifyUnauthorized } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/auth/admin')
const ANALYTICS_BASE = buildApiUrl('/api/admin/analytics')

const requestJson = async (path, options = {}, baseUrl = API_BASE) => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Thiếu token xác thực. Vui lòng đăng nhập lại.')
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (response.status === 401) {
    notifyUnauthorized()
    throw new Error(data.message || 'Token không hợp lệ hoặc đã hết hạn')
  }
  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`)
  }

  return data
}

export const getCustomers = async () => requestJson('/customers', { method: 'GET' })

export const updateCustomerStatus = async (id, status) => {
  return requestJson(`/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export const getProductReviews = async () => requestJson('/reviews', { method: 'GET' })

export const deleteProductReview = async (id) => {
  return requestJson(`/reviews/${id}`, { method: 'DELETE' })
}

export const getProductRevenueByDay = async ({ product_id, date_from, date_to }) => {
  const params = new URLSearchParams({
    product_id: String(product_id),
    date_from,
    date_to,
  })
  return requestJson(`/product-revenue-by-day?${params}`, { method: 'GET' }, ANALYTICS_BASE)
}
