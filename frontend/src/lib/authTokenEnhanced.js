const TOKEN_COOKIE_NAME = "auth_token"
const TOKEN_KEYS = ["auth_token", "token", "jwt"]
const isBrowser = typeof document !== "undefined"

const parseCookies = () => {
  if (!isBrowser) return {}
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separatorIndex = pair.indexOf("=")
      const key = separatorIndex >= 0 ? pair.slice(0, separatorIndex) : pair
      const value = separatorIndex >= 0 ? pair.slice(separatorIndex + 1) : ""
      acc[key] = decodeURIComponent(value)
      return acc
    }, {})
}

export const getAuthToken = () => {
  for (const key of TOKEN_KEYS) {
    const token = localStorage.getItem(key) || parseCookies()[key]
    if (token) return token
  }
  return null
}

export const setAuthToken = (token) => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem("token", token)

  if (isBrowser) {
    document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`
  }
}

export const clearAuthToken = () => {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key))

  if (isBrowser) {
    // xóa cookie chắc chắn (nhiều biến thể)
    document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
    document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  }
}