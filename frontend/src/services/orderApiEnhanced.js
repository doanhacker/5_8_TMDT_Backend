import { buildApiUrl } from '../config/api'

const API_BASE = buildApiUrl('/api/orders')

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
    const detail = Array.isArray(data?.errors) && data.errors.length > 0
      ? `: ${data.errors.join(', ')}`
      : ''
    throw new Error((data.message || data.error || `HTTP ${response.status}`) + detail)
  }

  return data
}

export const createOrder = async (payload) => {
  return requestJson(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const getOrderById = async (id) => {
  return requestJson(`${API_BASE}/${id}`, { method: 'GET' })
}

export const getOrders = async (params = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })
  const query = searchParams.toString()
  return requestJson(`${API_BASE}${query ? `?${query}` : ''}`, { method: 'GET' })
}

export const updateOrderStatus = async (id, status) => {
  return requestJson(`${API_BASE}/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export const updateOrderAddress = async (id, payload) => {
  return requestJson(`${API_BASE}/${id}/address`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
