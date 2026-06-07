/** Ẩn tạm catalog testcase thanh toán (seed.sql) — không sửa SQL. */

export const PAYMENT_MOCK_BRAND_NAMES = new Set([
  "Dell Mock",
  "Apple Mock",
  "Asus Mock",
])

export const PAYMENT_MOCK_CATEGORY_NAME = "Laptop Mock"

export function isPaymentMockCatalogItem(item) {
  if (!item) return false

  const brand = String(item.brand_name || item.brand || "").trim()
  if (PAYMENT_MOCK_BRAND_NAMES.has(brand)) return true

  const category = String(item.category_name || item.series || "").trim()
  if (category === PAYMENT_MOCK_CATEGORY_NAME) return true

  return false
}

export function filterPaymentMockProducts(list) {
  if (!Array.isArray(list)) return []
  return list.filter((item) => !isPaymentMockCatalogItem(item))
}

export function filterPaymentMockBrands(list) {
  if (!Array.isArray(list)) return []
  return list.filter((brand) => !PAYMENT_MOCK_BRAND_NAMES.has(String(brand?.brand_name || "").trim()))
}
