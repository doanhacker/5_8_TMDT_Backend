import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'
import { getOrCreateAiSessionId } from '../lib/aiChatSession'

const AI_API_BASE = buildApiUrl('/api/ai')

export const chatWithLaptopShopAI = async ({ message, history = [] }) => {
  const token = getAuthToken()
  const sessionId = getOrCreateAiSessionId()

  const response = await fetch(`${AI_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      history,
      session_id: sessionId,
    }),
  })

  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không gọi được AI service')
  }

  return data.data
}

export const getLaptopShopAiHistory = async () => {
  const token = getAuthToken()
  const sessionId = getOrCreateAiSessionId()
  const query = new URLSearchParams({ session_id: sessionId })

  const response = await fetch(`${AI_API_BASE}/history?${query.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Không lấy được lịch sử AI chat')
  }

  return data.data?.messages || []
}
