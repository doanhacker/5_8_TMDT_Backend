import { buildApiUrl } from '../config/api'
import { getAuthToken } from '../lib/authToken'

const API_BASE = buildApiUrl('/api/products')

const appendFiles = (formData, fieldName, files) => {
  if (!files) return

  if (files instanceof FileList) {
    Array.from(files).forEach((file) => {
      if (file instanceof File) {
        formData.append(fieldName, file)
      }
    })
    return
  }

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file instanceof File) {
        formData.append(fieldName, file)
      }
    })
    return
  }

  if (files instanceof File) {
    formData.append(fieldName, files)
  }
}

/**
 * Get all products with pagination
 * @param {Object} params - Query parameters (page, limit, sortBy, order, search, etc.)
 */
export const getAllProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })
    queryParams.append('_ts', Date.now().toString())

    const url = `${API_BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 */
export const getProductById = async (id) => {
  try {
    const url = `${API_BASE}/${id}?_ts=${Date.now()}`
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    throw error
  }
}

/**
 * Create a new product
 * @param {Object} productData - Product data (will be converted to FormData)
 */
export const createProduct = async (productData) => {
  try {
    const formData = new FormData()

    // Add basic product fields
    formData.append('product_name', productData.product_name || productData.name)
    formData.append('brand_id', productData.brand_id || 1) // Default brand
    formData.append('category_id', productData.category_id || 1) // Default category (laptops)
    formData.append('device_type', productData.device_type || 'LAPTOP')
    formData.append('description_html', productData.description_html || '<p>Laptop chất lượng cao</p>')
    formData.append('highlight_features', productData.highlight_features || 'Hiệu năng mạnh mẽ')
    
    if (productData.screen_size !== undefined) {
      formData.append('screen_size', productData.screen_size)
    }
    if (productData.weight_kg !== undefined) {
      formData.append('weight_kg', productData.weight_kg)
    }
    if (productData.os) {
      formData.append('os', productData.os)
    }
    if (productData.battery_capacity_mah !== undefined) {
      formData.append('battery_capacity_mah', productData.battery_capacity_mah)
    }
    if (productData.refresh_rate_hz !== undefined) {
      formData.append('refresh_rate_hz', productData.refresh_rate_hz)
    }
    if (productData.charging_port) {
      formData.append('charging_port', productData.charging_port)
    }
    if (productData.connectivity) {
      formData.append('connectivity', productData.connectivity)
    }
    if (productData.water_resistance) {
      formData.append('water_resistance', productData.water_resistance)
    }
    if (productData.sensors) {
      formData.append('sensors', productData.sensors)
    }
    if (productData.speaker_type) {
      formData.append('speaker_type', productData.speaker_type)
    }
    if (productData.device_specific_specs && typeof productData.device_specific_specs === 'object') {
      formData.append('device_specific_specs', JSON.stringify(productData.device_specific_specs))
    }

    // Add variants as JSON string
    if (productData.variants && Array.isArray(productData.variants)) {
      const variantsJSON = JSON.stringify(productData.variants)
      formData.append('variants', variantsJSON)
      console.log('📦 Variants JSON:', variantsJSON)
    }

    // Add product main images
    appendFiles(formData, 'productImages', productData.productImages)

    // Add variant images
    if (productData.variantImages && Array.isArray(productData.variantImages)) {
      productData.variantImages.forEach((variantImgs, index) => {
        appendFiles(formData, `variant_${index}_images`, variantImgs)
      })
    }

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      const detailErrors = Array.isArray(data?.errors) ? data.errors.filter(Boolean).join(' | ') : ''
      const fallbackMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(detailErrors ? `${fallbackMessage}: ${detailErrors}` : fallbackMessage)
    }

    console.log('✅ Product created:', data)
    return data
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

/**
 * Update a product
 * @param {number} id - Product ID
 * @param {Object} productData - Updated product data
 */
export const updateProduct = async (id, productData) => {
  try {
    const formData = new FormData()

    const simpleFields = [
      'product_name',
      'brand_id',
      'category_id',
      'device_type',
      'description_html',
      'highlight_features',
      'screen_size',
      'weight_kg',
      'os',
      'battery_capacity_mah',
      'refresh_rate_hz',
      'charging_port',
      'connectivity',
      'water_resistance',
      'sensors',
      'speaker_type',
      'primary_product_image_id',
    ]

    simpleFields.forEach((field) => {
      if (productData[field] !== undefined && productData[field] !== null && productData[field] !== '') {
        formData.append(field, productData[field])
      }
    })

    if (Array.isArray(productData.delete_image_ids) && productData.delete_image_ids.length > 0) {
      formData.append('delete_image_ids', JSON.stringify(productData.delete_image_ids))
    }

    if (productData.device_specific_specs && typeof productData.device_specific_specs === 'object') {
      formData.append('device_specific_specs', JSON.stringify(productData.device_specific_specs))
    }

    if (Array.isArray(productData.variants_to_update) && productData.variants_to_update.length > 0) {
      formData.append('variants_to_update', JSON.stringify(productData.variants_to_update))
    }

    if (Array.isArray(productData.variants_to_create) && productData.variants_to_create.length > 0) {
      formData.append('variants_to_create', JSON.stringify(productData.variants_to_create))
    }

    appendFiles(formData, 'newProductImages', productData.newProductImages)

    if (Array.isArray(productData.variantImagesToUpdate)) {
      productData.variantImagesToUpdate.forEach((variantImgs, index) => {
        appendFiles(formData, `newVariant_${index}_images_update`, variantImgs)
      })
    }

    if (Array.isArray(productData.variantImagesToCreate)) {
      productData.variantImagesToCreate.forEach((variantImgs, index) => {
        appendFiles(formData, `newVariant_${index}_images_create`, variantImgs)
      })
    }

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers,
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      const detail = Array.isArray(data?.errors) && data.errors.length > 0
        ? `: ${data.errors.join(', ')}`
        : ''
      throw new Error((data.error || data.message || `HTTP ${response.status}: ${response.statusText}`) + detail)
    }

    return data
  } catch (error) {
    console.error(`Error updating product ${id}:`, error)
    throw error
  }
}

/**
 * Delete a product
 * @param {number} id - Product ID
 */
export const deleteProduct = async (id) => {
  try {
    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error)
    throw error
  }
}

/**
 * Add one variant to an existing product
 * @param {number|string} productId - Product ID
 * @param {Object} variantData - Variant data
 * @param {File[]|FileList} variantImages - Optional images for variant
 */
export const addVariantToProduct = async (productId, variantData, variantImages = []) => {
  try {
    const formData = new FormData()

    // Reuse update product API to create a new variant, avoiding custom backend endpoint.
    formData.append('variants_to_create', JSON.stringify([
      {
        sku: variantData.sku,
        cpu_name: variantData.cpu_name,
        cpu_benchmark_score: variantData.cpu_benchmark_score,
        gpu: variantData.gpu,
        ram_gb: variantData.ram_gb,
        ram_type: variantData.ram_type,
        storage_gb: variantData.storage_gb,
        color_name: variantData.color_name,
        original_price: variantData.original_price,
        discount_price: variantData.discount_price,
        stock_quantity: variantData.stock_quantity,
        status: variantData.status,
      },
    ]))

    appendFiles(formData, 'newVariant_0_images_create', variantImages)

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/${productId}`, {
      method: 'PUT',
      headers,
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      const detail = Array.isArray(data?.errors) && data.errors.length > 0
        ? `: ${data.errors.join(', ')}`
        : ''
      throw new Error((data.error || data.message || `HTTP ${response.status}: ${response.statusText}`) + detail)
    }

    return data
  } catch (error) {
    console.error(`Error adding variant to product ${productId}:`, error)
    throw error
  }
}

/**
 * Update one existing variant of a product
 * @param {number|string} productId - Product ID
 * @param {number|string} variantId - Variant ID
 * @param {Object} variantData - Fields to update for variant
 * @param {File[]|FileList} variantImages - Optional new images for variant
 */
export const updateProductVariant = async (productId, variantId, variantData, variantImages = []) => {
  try {
    const formData = new FormData()

    formData.append('variants_to_update', JSON.stringify([
      {
        variant_id: Number(variantId),
        data: variantData,
      },
    ]))

    appendFiles(formData, 'newVariant_0_images_update', variantImages)

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/${productId}`, {
      method: 'PUT',
      headers,
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      const detail = Array.isArray(data?.errors) && data.errors.length > 0
        ? `: ${data.errors.join(', ')}`
        : ''
      throw new Error((data.error || data.message || `HTTP ${response.status}: ${response.statusText}`) + detail)
    }

    return data
  } catch (error) {
    console.error(`Error updating variant ${variantId} of product ${productId}:`, error)
    throw error
  }
}

/**
 * Soft-delete one variant by setting its status to DISCONTINUED
 * @param {number|string} productId - Product ID
 * @param {number|string} variantId - Variant ID
 */
export const deleteVariantFromProduct = async (productId, variantId) => {
  try {
    const formData = new FormData()
    formData.append('variants_to_update', JSON.stringify([
      {
        variant_id: Number(variantId),
        data: { status: 'DISCONTINUED' },
      },
    ]))

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/${productId}`, {
      method: 'PUT',
      headers,
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error(`Error deleting variant ${variantId} of product ${productId}:`, error)
    throw error
  }
}
