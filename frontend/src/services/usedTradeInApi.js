import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/used-trade-in')

const authHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const toQueryString = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  return query.toString()
}

export const getUsedTradeItems = async (params = {}) => {
  const query = toQueryString(params)
  const response = await fetch(`${API_BASE}/items${query ? `?${query}` : ''}`)
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể tải danh sách máy cũ')
  }

  return Array.isArray(data.data) ? data.data : []
}

export const createUsedTradeItem = async (payload) => {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể tạo máy cũ')
  }

  return data.data
}

export const uploadUsedTradeItemImage = async (file) => {
  if (!(file instanceof File)) {
    throw new Error('File ảnh không hợp lệ')
  }

  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE}/items/upload-image`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể upload ảnh máy cũ')
  }

  return data?.data?.imageUrl || ''
}

export const updateUsedTradeItem = async (id, payload) => {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể cập nhật máy cũ')
  }

  return data.data
}

export const deleteUsedTradeItem = async (id) => {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể xóa máy cũ')
  }

  return true
}

export const createTradeInRequest = async (payload) => {
  const response = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể gửi yêu cầu thu cũ')
  }

  return data.data
}

export const getTradeInRequests = async (params = {}) => {
  const query = toQueryString(params)
  const response = await fetch(`${API_BASE}/requests${query ? `?${query}` : ''}`, {
    headers: {
      ...authHeaders(),
    },
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể tải yêu cầu thu cũ')
  }

  return Array.isArray(data.data) ? data.data : []
}

export const updateTradeInRequestStatus = async (id, status) => {
  const response = await fetch(`${API_BASE}/requests/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  })
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể cập nhật trạng thái yêu cầu')
  }

  return data.data
}
