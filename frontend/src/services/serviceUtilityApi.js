import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const SERVICE_UTILITY_API_BASE = buildApiUrl('/api/service-utilities')

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

export const getServiceUtilities = async (params = {}) => {
  const query = toQueryString(params)
  const response = await fetch(`${SERVICE_UTILITY_API_BASE}${query ? `?${query}` : ''}`, {
    headers: {
      ...authHeaders(),
    },
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể tải danh sách dịch vụ')
  }

  return {
    data: Array.isArray(data.data) ? data.data : [],
    pagination: data.pagination || null,
  }
}

export const getServiceUtilityById = async (id) => {
  const response = await fetch(`${SERVICE_UTILITY_API_BASE}/${id}`, {
    headers: {
      ...authHeaders(),
    },
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể tải chi tiết dịch vụ')
  }

  return data.data
}

export const createServiceUtility = async (payload) => {
  const response = await fetch(SERVICE_UTILITY_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể tạo dịch vụ')
  }

  return data.data
}

export const updateServiceUtility = async (id, payload) => {
  const response = await fetch(`${SERVICE_UTILITY_API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể cập nhật dịch vụ')
  }

  return data.data
}

export const deleteServiceUtility = async (id) => {
  const response = await fetch(`${SERVICE_UTILITY_API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không thể xóa dịch vụ')
  }

  return true
}
