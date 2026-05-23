import { buildApiUrl } from '../config/api'

const API_BASE = buildApiUrl('/api/payments')

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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

export const processPayment = async (payload) => {
  return requestJson(`${API_BASE}/process`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const getPaymentByOrderId = async (orderId) => {
  return requestJson(`${API_BASE}/${orderId}`, { method: 'GET' })
}
