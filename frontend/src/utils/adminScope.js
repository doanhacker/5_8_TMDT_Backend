export const ADMIN_SCOPE_RULES = {
  PHONE: {
    label: "Điện thoại",
    adminEmails: ["admin.dienthoai@shop.com"],
    preferredDeviceType: "PHONE",
    categoryKeywords: ["dien thoai", "phone"],
  },
  TABLET: {
    label: "Máy tính bảng",
    adminEmails: ["admin.tablet@shop.com"],
    preferredDeviceType: "TABLET",
    categoryKeywords: ["may tinh bang", "tablet", "ipad", "tab"],
  },
  ACCESSORY: {
    label: "Phụ kiện điện tử",
    adminEmails: ["admin.accessory@shop.com"],
    preferredDeviceType: "ACCESSORY",
    categoryKeywords: ["phu kien", "accessory", "tai nghe", "headphone", "earbud", "charger", "cap", "cable"],
  },
  SMARTWATCH: {
    label: "Đồng hồ thông minh",
    adminEmails: ["admin.smartwatch@shop.com"],
    preferredDeviceType: "WATCH",
    categoryKeywords: ["dong ho thong minh", "smartwatch", "watch"],
  },
}

export const normalizeVietnameseText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()

export const getAdminScopeByEmail = (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase()

  return (
    Object.keys(ADMIN_SCOPE_RULES).find((scopeKey) =>
      ADMIN_SCOPE_RULES[scopeKey].adminEmails.includes(normalizedEmail)
    ) || null
  )
}

export const detectScopeByCategoryName = (categoryName) => {
  const normalizedCategoryName = normalizeVietnameseText(categoryName)
  if (!normalizedCategoryName) return null

  return (
    Object.keys(ADMIN_SCOPE_RULES).find((scopeKey) =>
      ADMIN_SCOPE_RULES[scopeKey].categoryKeywords.some((keyword) =>
        normalizedCategoryName.includes(keyword)
      )
    ) || null
  )
}

export const detectScopeByDeviceType = (deviceType) => {
  const normalizedType = String(deviceType || "").trim().toUpperCase()

  if (!normalizedType) return null

  if (normalizedType === "PHONE") return "PHONE"
  if (normalizedType === "TABLET") return "TABLET"
  if (normalizedType === "WATCH" || normalizedType === "SMARTWATCH") return "SMARTWATCH"
  if (normalizedType === "ACCESSORY" || normalizedType === "AUDIO") return "ACCESSORY"

  return null
}

export const detectScopeFromProduct = (product) => {
  return (
    detectScopeByDeviceType(product?.deviceType || product?.device_type) ||
    detectScopeByCategoryName(product?.series || product?.category_name)
  )
}

export const isProductInScope = (product, scopeKey) => {
  if (!scopeKey) return true
  return detectScopeFromProduct(product) === scopeKey
}
