import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const buildAuthHeaders = () => {
  const token = getAuthToken()
  if (!token) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`)
  }
  return data
}

export const getMyProfile = async () => {
  const response = await fetch(buildApiUrl('/api/profile/me'), {
    headers: buildAuthHeaders(),
    cache: 'no-store',
  })
  return parseResponse(response)
}

export const updateMyProfile = async (payload) => {
  const response = await fetch(buildApiUrl('/api/profile/me'), {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const getMyAddresses = async () => {
  const response = await fetch(buildApiUrl('/api/profile/me/addresses'), {
    headers: buildAuthHeaders(),
    cache: 'no-store',
  })
  return parseResponse(response)
}

export const createMyAddress = async (payload) => {
  const response = await fetch(buildApiUrl('/api/profile/me/addresses'), {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const updateMyAddress = async (addressId, payload) => {
  const response = await fetch(buildApiUrl(`/api/profile/me/addresses/${addressId}`), {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const deleteMyAddress = async (addressId) => {
  const response = await fetch(buildApiUrl(`/api/profile/me/addresses/${addressId}`), {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  })
  return parseResponse(response)
}
