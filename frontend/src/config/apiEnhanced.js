const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`
export const BLOG_API_BASE = `${API_BASE_URL}/api/blog`

/**
 * Helper function to build full image URL from relative path
 * @param {string} imageUrl - Image URL (can be relative or absolute)
 * @returns {string} Full URL with backend base
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/300'
  // If already absolute URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // If relative path, prepend backend base URL
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
}
