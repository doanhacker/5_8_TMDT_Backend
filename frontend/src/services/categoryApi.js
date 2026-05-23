import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/product-categories')

/**
 * Get all product categories
 */
export const getAllCategories = async () => {
  try {
    const response = await fetch(API_BASE)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

/**
 * Get a single category by ID
 */
export const getCategoryById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error)
    throw error
  }
}

/**
 * Create a new product category
 */
export const createCategory = async (payload) => {
  try {
    const token = getAuthToken()
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

/**
 * Update a product category by ID
 */
export const updateCategory = async (id, payload) => {
  try {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error(`Error updating category ${id}:`, error)
    throw error
  }
}

/**
 * Delete a product category by ID
 */
export const deleteCategory = async (id) => {
  try {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = await response.json()

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error)
    throw error
  }
}
