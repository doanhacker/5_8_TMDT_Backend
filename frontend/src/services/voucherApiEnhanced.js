import { buildApiUrl } from '../config/api'

const API_BASE = buildApiUrl('/api/vouchers')

const toQueryString = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

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

export const getAllVouchers = async (params = {}) => {
  return requestJson(`${API_BASE}${toQueryString(params)}`, { method: 'GET' })
}

export const getVoucherById = async (id) => {
  return requestJson(`${API_BASE}/${id}`, { method: 'GET' })
}

export const checkVoucherByCode = async (code) => {
  return requestJson(`${API_BASE}/check/${encodeURIComponent(String(code || '').trim())}`, { method: 'GET' })
}

export const createVoucher = async (payload) => {
  return requestJson(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateVoucher = async (id, payload) => {
  return requestJson(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteVoucher = async (id) => {
  return requestJson(`${API_BASE}/${id}`, { method: 'DELETE' })
}
