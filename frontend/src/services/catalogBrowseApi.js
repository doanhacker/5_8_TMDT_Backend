import { buildApiUrl } from "../config/api"

const requestJson = async (path) => {
  const res = await fetch(buildApiUrl(path))
  const data = await res.json().catch(() => ({}))

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Request failed")
  }
  return data
}

export const getBrandDetail = async (brandId) => {
  return requestJson(`/api/brands/${brandId}`)
}

export const getCategoryDetail = async (categoryId) => {
  return requestJson(`/api/product-categories/${categoryId}`)
}

export const getProductsByFilter = async ({ brandId, categoryId, page = 1, limit = 12 }) => {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", String(limit))
  if (brandId) params.set("brandId", String(brandId))
  if (categoryId) params.set("categoryId", String(categoryId))

  return requestJson(`/api/products?${params.toString()}`)
}