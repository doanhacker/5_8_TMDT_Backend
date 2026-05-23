import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/auth/admin')

const requestJson = async (path, options = {}) => {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
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
