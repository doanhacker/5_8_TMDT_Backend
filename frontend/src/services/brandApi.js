import { buildApiUrl } from '../config/api'

const API_BASE = buildApiUrl('/api/brands')

/**
 * Get all brands
 */
export const getAllBrands = async (options = {}) => {
  try {
    const requestUrl = new URL(API_BASE)
    if (options.deviceType) {
      requestUrl.searchParams.set('deviceType', String(options.deviceType).trim().toUpperCase())
    }

    const response = await fetch(requestUrl.toString())
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching brands:', error)
    throw error
  }
}

/**
 * Get a single brand by ID
 */
export const getBrandById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching brand ${id}:`, error)
    throw error
  }
}
