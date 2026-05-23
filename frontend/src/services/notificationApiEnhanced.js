import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/notifications')

const buildHeaders = () => {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      ...buildHeaders(),
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

export const getMyNotifications = async (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  const queryString = query.toString()
  return requestJson(`${API_BASE}/my${queryString ? `?${queryString}` : ''}`, { method: 'GET' })
}

export const markNotificationRead = async (id) => {
  return requestJson(`${API_BASE}/${id}/read`, { method: 'PUT', body: '{}' })
}

export const markAllNotificationsRead = async () => {
  return requestJson(`${API_BASE}/read-all`, { method: 'PUT', body: '{}' })
}

export const adminSendNotification = async (payload) => {
  return requestJson(`${API_BASE}/admin/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
