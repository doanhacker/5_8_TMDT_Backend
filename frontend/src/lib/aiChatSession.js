const AI_SESSION_KEY = 'laptopAiSessionId'

export const getOrCreateAiSessionId = () => {
  if (typeof window === 'undefined') return 'ai-session-server'

  let sessionId = localStorage.getItem(AI_SESSION_KEY)
  if (!sessionId) {
    sessionId = `ai-sess-${Math.random().toString(36).slice(2)}-${Date.now()}`
    localStorage.setItem(AI_SESSION_KEY, sessionId)
  }

  return sessionId
}
