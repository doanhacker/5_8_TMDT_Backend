import { buildApiUrl } from '../config/api'
import { getAuthToken, notifyUnauthorized } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/admin/analytics')

const requestJson = async (path, options = {}) => {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Thiếu token xác thực. Vui lòng đăng nhập lại.')
  }

  const response = await fetch(`${API_BASE}${path}`, {
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

export const getAnalyticsOverview = async () => requestJson('/overview', { method: 'GET' })

export const getAnalyticsRevenue = async (params = {}) => {
  const query = new URLSearchParams()
  if (params.period) query.append('period', params.period)
  if (params.year) query.append('year', params.year)
  const queryString = query.toString()
  return requestJson(`/revenue${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
}

export const getAnalyticsTopProducts = async (params = {}) => {
  const query = new URLSearchParams()
  if (params.limit) query.append('limit', params.limit)
  if (params.days) query.append('days', params.days)
  const queryString = query.toString()
  return requestJson(`/top-products${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
}

export const getAnalyticsCancelReasons = async () => requestJson('/cancel-reasons', { method: 'GET' })

export const getAnalyticsReport = async (params = {}) => {
  const query = new URLSearchParams()
  if (params.report_type) query.append('report_type', params.report_type)
  if (params.range) query.append('range', params.range)
  if (params.date_from) query.append('date_from', params.date_from)
  if (params.date_to) query.append('date_to', params.date_to)
  const queryString = query.toString()
  return requestJson(`/report${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
}
