import { buildApiUrl } from '../config/api'

const API_BASE = buildApiUrl('/api/inventory')

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

export const getLowStockProducts = async (threshold = 10) => {
  return requestJson(`${API_BASE}/low-stock?threshold=${threshold}`, { method: 'GET' })
}

export const createImportReceipt = async (payload) => {
  return requestJson(`${API_BASE}/receipts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const getImportReceipts = async (params = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()
  return requestJson(`${API_BASE}/receipts${query ? `?${query}` : ''}`, { method: 'GET' })
}
