import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import * as productApi from '../services/productApi'
import { getImageUrl } from '../config/api'

const ProductContext = createContext()
const PRODUCT_REALTIME_POLLING_MS = 5000

const formatCapacity = (value) => {
  const numeric = Number(value || 0)
  if (!numeric) return ''
  if (numeric >= 1024 && numeric % 1024 === 0) {
    return `${numeric / 1024}TB`
  }
  return `${numeric}GB`
}

const splitHighlightFeatures = (value) => {
  if (!value) return []

  return String(value)
    .split(/\r?\n|,|•/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const parseOptionalJsonObject = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
  }
  throw new Error('Giá trị JSON phải là object hợp lệ')
}

const extractNumericValue = (value, { integer = false } = {}) => {
  const text = String(value ?? '').trim()
  if (!text) return null

  const normalized = text.replace(/\s+/g, '').replace(/,/g, '.')
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!match) return null

  const parsed = Number(match[0])
  if (!Number.isFinite(parsed)) return null

  return integer ? Math.round(parsed) : parsed
}

const toSafeNumber = (value, fallback = 0, options = {}) => {
  const parsed = extractNumericValue(value, options)
  return parsed === null ? fallback : parsed
}

const normalizeStatusFromStock = (status, stockQuantity) => {
  if (status) return status
  return Number(stockQuantity || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
}

const getRepresentativeVariant = (variants = []) => {
  if (!Array.isArray(variants) || variants.length === 0) return null

  return variants.find((variant) => variant.status === 'IN_STOCK')
    || variants.find((variant) => variant.status === 'COMING_SOON')
    || variants.find((variant) => variant.status !== 'DISCONTINUED')
    || variants[0]
}

const mapApiProductToUi = (product) => {
  const representativeVariant = getRepresentativeVariant(product?.variants)
  const listRepresentativeOriginalPrice = Number(product?.representative_original_price || 0)
  const listRepresentativeDiscountPrice = product?.representative_discount_price != null
    ? Number(product.representative_discount_price)
    : 0
  const totalStock = representativeVariant
    ? Number(representativeVariant.stock_quantity || 0)
    : Number(product?.total_stock_quantity || 0)
  const price = representativeVariant
    ? Number(representativeVariant.discount_price || representativeVariant.original_price || 0)
    : Number(listRepresentativeDiscountPrice || listRepresentativeOriginalPrice || product?.min_price || 0)
  const oldPrice = representativeVariant
    ? Number(representativeVariant.original_price || representativeVariant.discount_price || 0)
    : Number(listRepresentativeOriginalPrice || product?.max_price || price || 0)
  const productImages = Array.isArray(product?.images) ? product.images : []
  const primaryImage = productImages.find((image) => Number(image?.is_primary) === 1) || productImages[0]
  const imageUrl = product?.primary_product_image_url || primaryImage?.image_url || representativeVariant?.images?.[0]?.image_url
  const screenSizeValue = product?.screen_size != null ? String(product.screen_size) : ''
  const ramValue = representativeVariant?.ram_gb ?? product?.representative_ram_gb ?? ''
  const storageValue = representativeVariant?.storage_gb ?? product?.representative_storage_gb ?? ''
  const ramLabel = formatCapacity(ramValue)
  const storageLabel = formatCapacity(storageValue)
  const productStatus = normalizeStatusFromStock(representativeVariant?.status, totalStock)

  return {
    id: String(product?.product_id || ''),
    name: product?.product_name || '',
    deviceType: product?.device_type || 'LAPTOP',
    deviceSpecificSpecs: product?.device_specific_specs || null,
    brand_id: product?.brand_id ? String(product.brand_id) : '',
    category_id: product?.category_id ? String(product.category_id) : '',
    brand: product?.brand_name || 'Unknown',
    series: product?.category_name || '',
    price,
    oldPrice: oldPrice || price,
    storage: storageLabel,
    ram: ramLabel,
    ramType: representativeVariant?.ram_type || '',
    version: representativeVariant?.color_name || '',
    cpu: representativeVariant?.cpu_name || product?.representative_cpu_name || '',
    screenSize: screenSizeValue ? `${screenSizeValue} inch` : '',
    weightKg: product?.weight_kg != null ? String(product.weight_kg) : '',
    os: String(product?.os || '').trim(),
    batteryCapacityMah: product?.battery_capacity_mah != null ? String(product.battery_capacity_mah) : '',
    refreshRateHz: product?.refresh_rate_hz != null ? String(product.refresh_rate_hz) : '',
    chargingPort: product?.charging_port || '',
    connectivity: product?.connectivity || '',
    waterResistance: product?.water_resistance || '',
    sensors: product?.sensors || '',
    speakerType: product?.speaker_type || '',
    graphics: representativeVariant?.gpu || product?.representative_gpu || '',
    stock: totalStock,
    inStock: productStatus === 'IN_STOCK',
    status: productStatus,
    image: getImageUrl(imageUrl),
    imageIds: productImages.map((image) => image?.image_id).filter(Boolean),
    imageUrls: productImages.map((image) => getImageUrl(image?.image_url)).filter(Boolean),
    specs: representativeVariant?.cpu_name || product?.representative_cpu_name || representativeVariant?.gpu || product?.representative_gpu
      ? `${representativeVariant?.cpu_name || product?.representative_cpu_name || 'Đang cập nhật'} | ${representativeVariant?.gpu || product?.representative_gpu || 'Đang cập nhật'}`
      : 'Đang cập nhật',
    config: ramLabel && storageLabel && screenSizeValue
      ? `${ramLabel}${representativeVariant?.ram_type ? ` ${representativeVariant.ram_type}` : ''} | ${storageLabel} | ${screenSizeValue} inch`
      : 'Đang cập nhật',
    discount: oldPrice > price && price > 0
      ? `Giảm ${Math.round(((oldPrice - price) / oldPrice) * 100)}%`
      : '',
    installment: 'Trả góp 0%',
    sold: 0,
    newArrival: false,
    hasAI: false,
    descriptionHtml: product?.description_html || '',
    highlightFeatures: product?.highlight_features || '',
    features: splitHighlightFeatures(product?.highlight_features),
  }
}

const mapVariantInputToApi = (variantInput) => {
  const stockQuantity = toSafeNumber(variantInput.stock ?? variantInput.stock_quantity, 0, { integer: true })
  const rawBenchmark = variantInput.cpu_benchmark_score ?? variantInput.cpuBenchmarkScore
  const parsedBenchmark =
    rawBenchmark === '' || rawBenchmark === null || rawBenchmark === undefined
      ? undefined
      : toSafeNumber(rawBenchmark, NaN, { integer: true })
  const benchmarkValue = Number.isFinite(parsedBenchmark) && parsedBenchmark > 0
    ? parsedBenchmark
    : undefined

  const rawDiscountPrice = variantInput.discount_price ?? variantInput.discountPrice
  const parsedDiscountPrice =
    rawDiscountPrice === '' || rawDiscountPrice === null || rawDiscountPrice === undefined
      ? undefined
      : toSafeNumber(rawDiscountPrice, NaN)
  const discountPriceValue = Number.isFinite(parsedDiscountPrice) ? parsedDiscountPrice : undefined

  const parsedExtraSpecs = parseOptionalJsonObject(
    variantInput.extra_specs_json ?? variantInput.extraSpecsJson ?? variantInput.extraSpecsJsonText
  )

  return {
    sku: String(variantInput.sku || '').trim(),
    cpu_name: variantInput.cpu_name || variantInput.cpu || null,
    cpu_benchmark_score: benchmarkValue,
    gpu: variantInput.gpu || null,
    ram_gb: toSafeNumber(variantInput.ram_gb ?? variantInput.ram, 0, { integer: true }),
    ram_type: variantInput.ram_type || variantInput.ramType || null,
    storage_gb: toSafeNumber(variantInput.storage_gb ?? variantInput.storage, 0, { integer: true }),
    color_name: String(variantInput.color_name || variantInput.color || '').trim(),
    original_price: toSafeNumber(variantInput.original_price ?? variantInput.originalPrice, 0),
    discount_price: discountPriceValue,
    stock_quantity: stockQuantity,
    status: normalizeStatusFromStock(variantInput.status, stockQuantity),
    extra_specs_json: parsedExtraSpecs,
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const inFlightRefreshRef = useRef(false)
  const productSyncChannelRef = useRef(null)

  const broadcastProductSync = useCallback((action) => {
    if (!productSyncChannelRef.current) return
    try {
      productSyncChannelRef.current.postMessage({
        type: 'PRODUCTS_UPDATED',
        action,
        at: Date.now(),
      })
    } catch {
      // Ignore browser compatibility/runtime issues for optional cross-tab sync.
    }
  }, [])

  const refreshProducts = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRefreshRef.current) {
      return
    }

    inFlightRefreshRef.current = true

    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      const response = await productApi.getAllProducts({ limit: 100 })
      const productList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : []

      setProducts(productList.map(mapApiProductToUi))
    } catch (err) {
      console.error('Error fetching products:', err)
      if (!silent) {
        setError(err.message)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
      inFlightRefreshRef.current = false
    }
  }, [])

  useEffect(() => {
    refreshProducts()
  }, [refreshProducts])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshProducts({ silent: true })
    }, PRODUCT_REALTIME_POLLING_MS)

    const handleFocus = () => {
      refreshProducts({ silent: true })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshProducts({ silent: true })
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshProducts])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
      return undefined
    }

    const channel = new window.BroadcastChannel('products-sync')
    productSyncChannelRef.current = channel

    channel.onmessage = (event) => {
      if (event?.data?.type === 'PRODUCTS_UPDATED') {
        refreshProducts({ silent: true })
      }
    }

    return () => {
      channel.close()
      if (productSyncChannelRef.current === channel) {
        productSyncChannelRef.current = null
      }
    }
  }, [refreshProducts])

  const addProduct = async (productData) => {
    try {
      setLoading(true)
      setError(null)

      // Validate required fields
      if (!productData.name?.trim()) {
        throw new Error('Tên sản phẩm không được để trống')
      }
      if (!productData.brand_id || productData.brand_id === '') {
        throw new Error('Vui lòng chọn thương hiệu')
      }
      if (!productData.category_id || productData.category_id === '') {
        throw new Error('Vui lòng chọn danh mục')
      }
      if (!productData.productImages || productData.productImages.length === 0) {
        throw new Error('Vui lòng upload hình ảnh sản phẩm')
      }
      let variants = []

      if (Array.isArray(productData.productVariants) && productData.productVariants.length > 0) {
        variants = productData.productVariants.map((v, index) => {
          // Validate các trường bắt buộc trước khi map
          if (!v.sku || !v.color || v.ram === undefined || v.storage === undefined || v.originalPrice === undefined) {
            throw new Error(`Phiên bản #${index + 1} chưa hợp lệ. Vui lòng kiểm tra lại thông tin.`)
          }

          const ramValue = toSafeNumber(v.ram, 0, { integer: true })
          const storageValue = toSafeNumber(v.storage, 0, { integer: true })
          const originalPriceValue = toSafeNumber(v.originalPrice, 0)
          const discountPriceValue = v.discountPrice !== undefined && v.discountPrice !== null && v.discountPrice !== ''
            ? toSafeNumber(v.discountPrice, NaN)
            : null

          if (!Number.isFinite(ramValue) || ramValue <= 0) {
            throw new Error(`Phiên bản #${index + 1}: RAM phải là số dương.`)
          }
          if (!Number.isFinite(storageValue) || storageValue <= 0) {
            throw new Error(`Phiên bản #${index + 1}: Bộ nhớ phải là số dương.`)
          }
          if (!Number.isFinite(originalPriceValue) || originalPriceValue <= 0) {
            throw new Error(`Phiên bản #${index + 1}: Giá gốc phải lớn hơn 0.`)
          }
          if (discountPriceValue !== null) {
            if (!Number.isFinite(discountPriceValue) || discountPriceValue < 0) {
              throw new Error(`Phiên bản #${index + 1}: Giá khuyến mãi không hợp lệ.`)
            }
            if (discountPriceValue >= originalPriceValue) {
              throw new Error(`Phiên bản #${index + 1}: Giá khuyến mãi phải nhỏ hơn giá gốc.`)
            }
          }

          if (!Array.isArray(v.imageFiles) || v.imageFiles.length === 0) {
            throw new Error(`Phiên bản #${index + 1} cần tối thiểu 1 ảnh.`)
          }
          // Sử dụng mapVariantInputToApi để map đầy đủ các trường
          return mapVariantInputToApi(v)
        })
      } else {
        if (!productData.ram) {
          throw new Error('Vui lòng chọn RAM')
        }
        if (!productData.storage) {
          throw new Error('Vui lòng chọn dung lượng ổ cứng')
        }
        if (!productData.price || toSafeNumber(productData.price, 0) <= 0) {
          throw new Error('Vui lòng nhập giá sản phẩm hợp lệ')
        }

        const ramValue = toSafeNumber(productData.ram, 0, { integer: true })
        const storageValue = toSafeNumber(productData.storage, 0, { integer: true })

        if (isNaN(ramValue) || ramValue <= 0) {
          throw new Error('RAM không hợp lệ')
        }
        if (isNaN(storageValue) || storageValue <= 0) {
          throw new Error('Dung lượng ổ cứng không hợp lệ')
        }

        const variant = {
          sku: `${productData.brand || 'LAPTOP'}-${Date.now()}`,
          ram_gb: ramValue,
          ram_type: productData.ramType || 'DDR4',
          storage_gb: storageValue,
          cpu_name: productData.cpu || 'Intel Core i5',
          gpu: productData.graphics || 'Integrated',
          color_name: productData.version?.trim() || 'Default',
          original_price: toSafeNumber(productData.oldPrice || productData.price, 0),
          stock_quantity: toSafeNumber(productData.stock, 0, { integer: true }),
          status: toSafeNumber(productData.stock, 0, { integer: true }) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
        }

        if (productData.oldPrice && toSafeNumber(productData.oldPrice, 0) > toSafeNumber(productData.price, 0)) {
          variant.discount_price = toSafeNumber(productData.price, 0)
        }

        variants = [variant]
      }
      
      const apiData = {
        product_name: productData.name,
        brand_id: parseInt(productData.brand_id),
        category_id: parseInt(productData.category_id),
        device_type: productData.deviceType || 'LAPTOP',
        description_html: productData.description || '<p>Laptop chất lượng cao</p>',
        highlight_features: productData.features?.join(', ') || 'Hiệu năng mạnh mẽ',
        screen_size: extractNumericValue(productData.screenSize) ?? undefined,
        weight_kg: extractNumericValue(productData.weightKg) ?? undefined,
        os: productData.os || 'Windows 11',
        battery_capacity_mah: productData.batteryCapacityMah ? toSafeNumber(productData.batteryCapacityMah, 0, { integer: true }) : undefined,
        refresh_rate_hz: productData.refreshRateHz ? toSafeNumber(productData.refreshRateHz, 0, { integer: true }) : undefined,
        charging_port: productData.chargingPort || undefined,
        connectivity: productData.connectivity || undefined,
        water_resistance: productData.waterResistance || undefined,
        sensors: productData.sensors || undefined,
        speaker_type: productData.speakerType || undefined,
        device_specific_specs: productData.deviceSpecificSpecs || undefined,
        variants,
        productImages: productData.productImages,
        variantImages: productData.productVariants?.map((variant) => variant.imageFiles || []) || []
      }

      console.log('🔍 Sending product data to API:', {
        ...apiData,
        productImages: apiData.productImages?.length ? `${apiData.productImages.length} files` : 'No file',
        variantImages: apiData.variantImages.length > 0 ? `${apiData.variantImages.length} files` : 'No files'
      })

      const response = await productApi.createProduct(apiData)

      if (response.success && response.data?.product_id) {
        const detailResponse = await productApi.getProductById(response.data.product_id)
        const newProduct = mapApiProductToUi(detailResponse?.data || {})
        setProducts((prev) => [newProduct, ...prev.filter((item) => item.id !== newProduct.id)])
        refreshProducts({ silent: true })
        broadcastProductSync('CREATE_PRODUCT')
        return newProduct
      }

      await refreshProducts()
      return response
    } catch (err) {
      console.error('Error adding product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (id, updates) => {
    try {
      setLoading(true)
      setError(null)

      const variantsToUpdate = []
      const variantsToCreate = []
      const variantImagesToUpdate = []
      const variantImagesToCreate = []

      if (Array.isArray(updates.productVariants)) {
        updates.productVariants.forEach((variant) => {
          const mappedVariant = mapVariantInputToApi(variant)

          if (variant.variant_id) {
            variantsToUpdate.push({
              variant_id: Number(variant.variant_id),
              data: mappedVariant,
            })
            variantImagesToUpdate.push(Array.isArray(variant.imageFiles) ? variant.imageFiles : [])
          } else {
            variantsToCreate.push(mappedVariant)
            variantImagesToCreate.push(Array.isArray(variant.imageFiles) ? variant.imageFiles : [])
          }
        })
      }

      const apiData = {
        product_name: updates.product_name || updates.name,
        brand_id: updates.brand_id ? parseInt(updates.brand_id, 10) : undefined,
        category_id: updates.category_id ? parseInt(updates.category_id, 10) : undefined,
        device_type: updates.device_type || updates.deviceType,
        description_html: updates.description_html ?? updates.description,
        highlight_features: updates.highlight_features ?? updates.highlightFeatures ?? updates.features?.join(', '),
        screen_size: updates.screen_size ?? (updates.screenSize ? extractNumericValue(updates.screenSize) : undefined),
        weight_kg: updates.weight_kg ?? (updates.weightKg ? extractNumericValue(updates.weightKg) : undefined),
        os: updates.os,
        battery_capacity_mah: updates.battery_capacity_mah ?? (updates.batteryCapacityMah ? toSafeNumber(updates.batteryCapacityMah, 0, { integer: true }) : undefined),
        refresh_rate_hz: updates.refresh_rate_hz ?? (updates.refreshRateHz ? toSafeNumber(updates.refreshRateHz, 0, { integer: true }) : undefined),
        charging_port: updates.charging_port ?? updates.chargingPort,
        connectivity: updates.connectivity,
        water_resistance: updates.water_resistance ?? updates.waterResistance,
        sensors: updates.sensors,
        speaker_type: updates.speaker_type ?? updates.speakerType,
        device_specific_specs: updates.device_specific_specs ?? updates.deviceSpecificSpecs,
        variants_to_update: variantsToUpdate,
        variants_to_create: variantsToCreate,
        variantImagesToUpdate,
        variantImagesToCreate,
        newProductImages: updates.newProductImages || updates.productImages,
      }

      const response = await productApi.updateProduct(id, apiData)

      const hasNewProductImages = Array.isArray(updates.newProductImages || updates.productImages)
        && (updates.newProductImages || updates.productImages).length > 0
      const hasExplicitPrimaryImage = updates.primary_product_image_id != null

      if (response.success) {
        let detailResponse = await productApi.getProductById(id)

        // Backend adds new product images as secondary by default. Promote latest uploaded image to primary
        // so storefront immediately shows the newly added image.
        if (hasNewProductImages && !hasExplicitPrimaryImage) {
          const productImages = Array.isArray(detailResponse?.data?.images) ? detailResponse.data.images : []
          const newestImage = productImages.reduce((latest, image) => {
            if (!image?.image_id) return latest
            if (!latest || Number(image.image_id) > Number(latest.image_id)) {
              return image
            }
            return latest
          }, null)

          if (newestImage?.image_id) {
            await productApi.updateProduct(id, {
              primary_product_image_id: Number(newestImage.image_id),
            })
            detailResponse = await productApi.getProductById(id)
          }
        }

        const updatedProduct = mapApiProductToUi(detailResponse?.data || {})
        setProducts((prev) => prev.map((product) => (product.id === String(id) ? updatedProduct : product)))
        refreshProducts({ silent: true })
        broadcastProductSync('UPDATE_PRODUCT')
      }

      return response
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id) => {
    try {
      setLoading(true)
      setError(null)

      const response = await productApi.deleteProduct(id)

      if (response.success) {
        setProducts((prev) => prev.map((product) => (
          product.id === String(id)
            ? { ...product, status: 'DISCONTINUED', inStock: false }
            : product
        )))
        refreshProducts({ silent: true })
        broadcastProductSync('DISCONTINUE_PRODUCT')
      }

      return response
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const addVariantToProduct = async (productId, variantInput, variantImages = []) => {
    try {
      setLoading(true)
      setError(null)

      const normalizedVariant = mapVariantInputToApi(variantInput)
      const ramValue = normalizedVariant.ram_gb
      const storageValue = normalizedVariant.storage_gb
      const originalPrice = normalizedVariant.original_price
      const discountPrice = normalizedVariant.discount_price ?? null
      const stockQuantity = normalizedVariant.stock_quantity
      const normalizedSku = normalizedVariant.sku
      const cpuBenchmarkScore = normalizedVariant.cpu_benchmark_score

      if (!normalizedSku || !normalizedVariant.color_name || !normalizedVariant.cpu_name || !normalizedVariant.gpu || cpuBenchmarkScore === undefined || isNaN(ramValue) || isNaN(storageValue) || isNaN(originalPrice)) {
        throw new Error('Thông tin phiên bản chưa đầy đủ hoặc không hợp lệ')
      }
      if (cpuBenchmarkScore <= 0 || ramValue <= 0 || storageValue <= 0 || originalPrice <= 0) {
        throw new Error('RAM, ổ cứng và giá gốc phải lớn hơn 0')
      }
      if (discountPrice !== null && discountPrice >= originalPrice) {
        throw new Error('Giá khuyến mãi phải nhỏ hơn giá gốc')
      }
      if (!Array.isArray(variantImages) || variantImages.length === 0) {
        throw new Error('Phiên bản cần tối thiểu 1 ảnh')
      }

      const variantData = normalizedVariant

      const response = await productApi.addVariantToProduct(productId, variantData, variantImages)

      if (response?.success) {
        // Refresh minimal product state in list with newest stock aggregate when needed.
        setProducts((prev) => prev.map((p) => {
          if (String(p.id) !== String(productId)) return p

          const updatedPrice = discountPrice || originalPrice
          return {
            ...p,
            price: p.price > 0 ? Math.min(p.price, updatedPrice) : updatedPrice,
            oldPrice: p.oldPrice > 0 ? Math.max(p.oldPrice, originalPrice) : originalPrice,
            stock: Number(p.stock || 0) + stockQuantity,
            inStock: true,
          }
        }))
        refreshProducts({ silent: true })
        broadcastProductSync('CREATE_VARIANT')
      }

      return response
    } catch (err) {
      console.error('Error adding variant to product:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateVariantInProduct = async (productId, variantInput, variantImages = []) => {
    try {
      setLoading(true)
      setError(null)

      const variantId = parseInt(variantInput.variant_id)
      const normalizedVariant = mapVariantInputToApi(variantInput)
      const ramValue = normalizedVariant.ram_gb
      const storageValue = normalizedVariant.storage_gb
      const originalPrice = normalizedVariant.original_price
      const discountPrice = normalizedVariant.discount_price ?? null
      const stockQuantity = normalizedVariant.stock_quantity
      const normalizedSku = normalizedVariant.sku
      const cpuBenchmarkScore = normalizedVariant.cpu_benchmark_score

      if (!variantId || !normalizedSku || !normalizedVariant.color_name || isNaN(ramValue) || isNaN(storageValue) || isNaN(originalPrice)) {
        throw new Error('Thông tin phiên bản chưa đầy đủ hoặc không hợp lệ')
      }
      if (ramValue <= 0 || storageValue <= 0 || originalPrice <= 0) {
        throw new Error('RAM, ổ cứng và giá gốc phải lớn hơn 0')
      }
      if (discountPrice !== null && discountPrice >= originalPrice) {
        throw new Error('Giá khuyến mãi phải nhỏ hơn giá gốc')
      }

      const variantData = normalizedVariant

      const response = await productApi.updateProductVariant(productId, variantId, variantData, variantImages)
      if (response?.success) {
        refreshProducts({ silent: true })
        broadcastProductSync('UPDATE_VARIANT')
      }
      return response
    } catch (err) {
      console.error('Error updating product variant:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeVariantFromProduct = async (productId, variantId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await productApi.deleteVariantFromProduct(productId, variantId)
      if (response?.success) {
        refreshProducts({ silent: true })
        broadcastProductSync('DELETE_VARIANT')
      }
      return response
    } catch (err) {
      console.error('Error deleting product variant:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getProductById = (id) => {
    return products.find(p => p.id === id)
  }

  const value = {
    products,
    loading,
    error,
    addProduct,
    addVariantToProduct,
    updateVariantInProduct,
    removeVariantFromProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    refreshProducts,
  }

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider')
  }
  return context
}
