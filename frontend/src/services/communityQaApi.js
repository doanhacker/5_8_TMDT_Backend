import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const COMMUNITY_QA_API_BASE = buildApiUrl('/api/community-qa')

const authHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const getCommunityQuestions = async (limit = 30) => {
  const query = new URLSearchParams({ limit: String(limit) })
  const response = await fetch(`${COMMUNITY_QA_API_BASE}?${query.toString()}`, {
    headers: {
      ...authHeaders(),
    },
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Khong the tai danh sach hoi dap')
  }

  return Array.isArray(data.data) ? data.data : []
}

export const submitCommunityQuestion = async ({ question }) => {
  const response = await fetch(COMMUNITY_QA_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ question }),
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Khong the gui cau hoi')
  }

  return data.data
}

export const answerCommunityQuestion = async ({ id, answer }) => {
  const response = await fetch(`${COMMUNITY_QA_API_BASE}/${id}/answer`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ answer }),
  })

  const data = await response.json()
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Khong the tra loi cau hoi')
  }

  return data.data
}
