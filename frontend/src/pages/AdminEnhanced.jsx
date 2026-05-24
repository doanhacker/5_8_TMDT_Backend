import { useMemo, useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useProducts } from "../context/ProductContext"
import * as brandApi from "../services/brandApi"
import * as categoryApi from "../services/categoryApi"
import * as productApi from "../services/productApi"
import * as orderApi from "../services/orderApi"
import * as inventoryApi from "../services/inventoryApi"
import * as adminApi from "../services/adminApi"
import { buildApiUrl, getImageUrl } from "../config/api"
import { getAuthToken } from "../lib/authToken"
import { getRealtimeClient } from "../lib/realtimeClient"
import {
  FiBarChart2,
  FiBox,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiHeadphones,
  FiLayers,
  FiList,
  FiPackage,
  FiSettings,
  FiUsers,
  FiBookOpen,
  FiImage,
  FiGift,
  FiBell,
  FiMessageSquare,
  FiTool,
  FiRefreshCw,
} from "react-icons/fi"
import "../styles/Admin.css"

// Import admin component modules
import AdminDashboard from "../components/admin/AdminDashboard"
import AdminProducts from "../components/admin/AdminProducts"
import AdminInventory from "../components/admin/AdminInventory"
import AdminOrders from "../components/admin/AdminOrders"
import AdminCustomers from "../components/admin/AdminCustomers"
import AdminContent from "../components/admin/AdminContent"
import AdminRecommendation from "../components/admin/AdminRecommendation"
import AdminAssistant from "../components/admin/AdminAssistant"
import AdminStaff from "../components/admin/AdminStaff"
import OrderDetailModal from "../components/admin/OrderDetailModal"
import AdminNews from "../components/admin/AdminNewsAPI"
import AdminSliderAPI from "../components/admin/AdminSliderAPI"
import AdminBranch from "../components/admin/AdminBranch"
import AdminVouchers from "../components/admin/AdminVouchers"
import AdminNotifications from "../components/admin/AdminNotifications"
import AdminCategories from "../components/admin/AdminCategories"
import AdminCommunityQa from "../components/admin/AdminCommunityQa"
import AdminServiceUtilities from "../components/admin/AdminServiceUtilities"
import AdminUsedTradeIn from "../components/admin/AdminUsedTradeIn"
import {
  ADMIN_SCOPE_RULES,
  getAdminScopeByEmail,
  isProductInScope,
} from "../utils/adminScope"

const moduleItems = [
  { id: "dashboard", label: "Dashboard", icon: FiBarChart2 },
  { id: "products", label: "Sản phẩm", icon: FiPackage },
  { id: "branch", label: "Quản lý thương hiệu", icon: FiList },
  { id: "categories", label: "Quản lý danh mục sản phẩm", icon: FiLayers },
  { id: "inventory", label: "Tồn kho", icon: FiBox },
  { id: "orders", label: "Đơn hàng", icon: FiClipboard },
  { id: "vouchers", label: "Voucher", icon: FiGift },
  { id: "customers", label: "Khách hàng", icon: FiUsers },
  { id: "content", label: "Nội dung & đánh giá", icon: FiFileText },
  { id: "documentation", label: "Quản lý tin tức", icon: FiBookOpen },
  { id: "communityQa", label: "Hỏi đáp người dùng", icon: FiMessageSquare },
  { id: "serviceUtilities", label: "Dịch vụ tiện ích", icon: FiTool },
  { id: "usedTradeIn", label: "Máy cũ, Thu cũ", icon: FiRefreshCw },
  { id: "sliders", label: "Quản lý Banner", icon: FiImage },
  { id: "notifications", label: "Thông báo", icon: FiBell },
  { id: "recommendation", label: "Gợi ý sản phẩm", icon: FiCpu },
  { id: "assistant", label: "Trợ lý AI", icon: FiHeadphones },
  { id: "staff", label: "Người dùng hệ thống", icon: FiSettings },
]

const initialAiLogs = [
  { id: "AI01", topic: "Hỏi về laptop gaming", conversions: 4, interactions: 35 },
  { id: "AI02", topic: "So sánh RAM 16GB và 32GB", conversions: 2, interactions: 22 },
]

const initialStaff = [
  { id: "S001", name: "Admin Tổng", role: "admin", email: "admin@laptopshop.vn" },
  { id: "S002", name: "Nhân viên hệ thống", role: "staff", email: "staff@laptopshop.vn" },
]

const createEmptyProductForm = () => ({
  name: "",
  deviceType: "LAPTOP",
  sku: "",
  color: "",
  brand: "",
  brand_id: "",
  price: "",
  oldPrice: "",
  storage: "",
  ram: "",
  ramType: "",
  cpu: "",
  cpuBenchmarkScore: "",
  screenSize: "",
  weightKg: "",
  os: "",
  batteryCapacityMah: "",
  refreshRateHz: "",
  chargingPort: "",
  connectivity: "",
  waterResistance: "",
  sensors: "",
  speakerType: "",
  deviceSpecificSpecsText: "",
  graphics: "",
  features: [],
  description: "",
  highlightFeatures: "",
  hasAI: false,
  series: "",
  category_id: "",
  stock: "",
  image: "",
  imageFiles: [],
  imagePreviews: [],
  discount: "",
  installment: "Trả góp 0%",
  newArrival: false,
})

const createEmptyVariantForm = () => ({
  sku: "",
  cpu: "",
  cpuBenchmarkScore: "",
  gpu: "",
  ram: "",
  ramType: "",
  storage: "",
  color: "",
  originalPrice: "",
  discountPrice: "",
  stock: "",
  status: "IN_STOCK",
  extraSpecsJsonText: "",
  imageFiles: [],
  imagePreviews: [],
})

const parseOptionalJsonObject = (value) => {
  const normalized = String(value || "").trim()
  if (!normalized) return undefined

  const parsed = JSON.parse(normalized)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON object expected")
  }

  return parsed
}

const extractNumericValue = (value, { integer = false } = {}) => {
  const text = String(value ?? "").trim()
  if (!text) return null

  const normalized = text.replace(/\s+/g, "").replace(/,/g, ".")
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

const splitFeatures = (value) => {
  if (!value) return []
  return String(value)
    .split(/\r?\n|,|•/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const getVariantStatus = (stock, currentStatus) => {
  if (currentStatus) return currentStatus
  return toSafeNumber(stock, 0, { integer: true }) > 0 ? "IN_STOCK" : "OUT_OF_STOCK"
}

const getPreferredVariant = (variants = []) => {
  if (!Array.isArray(variants) || variants.length === 0) return null
  return variants.find((variant) => variant.status !== "DISCONTINUED") || variants[0]
}

export default function Admin() {
  const { user, loading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const adminScope = getAdminScopeByEmail(user?.email)
  const isScopedAdmin = Boolean(adminScope)
  const scopedRule = adminScope ? ADMIN_SCOPE_RULES[adminScope] : null
  const scopedDeviceType = scopedRule?.preferredDeviceType || null

  const [activeModule, setActiveModule] = useState("dashboard")

  const { products, addProduct, addVariantToProduct, updateVariantInProduct, removeVariantFromProduct, updateProduct, deleteProduct } = useProducts()

  const [selectedOrder, setSelectedOrder] = useState(null)


  const [productForm, setProductForm] = useState(createEmptyProductForm())
  const [editingProductId, setEditingProductId] = useState("")
  const [productVariants, setProductVariants] = useState([])
  const [editingVariantIndex, setEditingVariantIndex] = useState(-1)
  const [variantForm, setVariantForm] = useState(createEmptyVariantForm())
  const [productNotice, setProductNotice] = useState(null)

  const emptyVariantForm = createEmptyVariantForm()

  const [inventory, setInventory] = useState([])
  const [stockForm, setStockForm] = useState({ variantId: "", supplierName: "", quantity: "", unitImportPrice: "" })

  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [comments, setComments] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  const [recommendationStrategy, setRecommendationStrategy] = useState("hanh-vi")
  const [aiLogs] = useState(initialAiLogs)
  const [aiTrainingNote, setAiTrainingNote] = useState("Bổ sung dữ liệu khuyến mãi tháng 3")

  const [staffUsers, setStaffUsers] = useState(initialStaff)
  const [newStaff, setNewStaff] = useState({ name: "", email: "", phone: "", password: "", role: "staff" })
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Brands and Categories for product form
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const activeDeviceTypeRef = useRef(productForm.deviceType)

  useEffect(() => {
    activeDeviceTypeRef.current = productForm.deviceType
  }, [productForm.deviceType])

  // Fetch staff users từ API khi vào module "staff"
  useEffect(() => {
    if (activeModule === "staff") {
      fetchStaffUsers()
    }
  }, [activeModule])

  // Fetch brands and categories whenever product device type changes.
  useEffect(() => {
    fetchBrandsAndCategories(productForm.deviceType)
  }, [productForm.deviceType])

  useEffect(() => {
    if (!productNotice) return undefined

    const timeoutId = window.setTimeout(() => {
      setProductNotice(null)
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [productNotice])

  useEffect(() => {
    if (!isScopedAdmin || !scopedDeviceType) return
    setProductForm((prev) => ({
      ...prev,
      deviceType: scopedDeviceType,
    }))
  }, [isScopedAdmin, scopedDeviceType])

  const showProductNotice = (type, message) => {
    setProductNotice({ type, message })
  }

  const loadCategories = async (deviceType = productForm.deviceType) => {
    try {
      setLoadingCategories(true)
      const categoriesResponse = await categoryApi.getAllCategories({ deviceType })
      if (categoriesResponse.success && categoriesResponse.data) {
        const source = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []
        setCategories(source)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      throw error
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadBrands = async (deviceType = productForm.deviceType) => {
    // Fetch brands
    try {
      setLoadingBrands(true)
      const brandsResponse = await brandApi.getAllBrands({ deviceType })
      if (brandsResponse.success && brandsResponse.data) {
        setBrands(brandsResponse.data)
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    } finally {
      setLoadingBrands(false)
    }
  }

  const fetchBrandsAndCategories = async (deviceType = productForm.deviceType) => {
    await loadBrands(deviceType)
    await loadCategories(deviceType)
  }

  useEffect(() => {
    const socket = getRealtimeClient()
    const handleCatalogChanged = (event) => {
      if (!event || !event.resource) return
      if (["brand", "category", "product"].includes(event.resource)) {
        fetchBrandsAndCategories(activeDeviceTypeRef.current || "LAPTOP")
      }
    }

    socket.on("catalog:changed", handleCatalogChanged)
    return () => {
      socket.off("catalog:changed", handleCatalogChanged)
    }
  }, [])

  const createCategory = async (payload) => {
    const response = await categoryApi.createCategory({
      ...payload,
      device_type: payload.device_type || productForm.deviceType,
    })
    await loadCategories(payload.device_type || productForm.deviceType)
    return response
  }

  const updateCategory = async (categoryId, payload) => {
    const response = await categoryApi.updateCategory(categoryId, payload)
    await loadCategories(payload.device_type || productForm.deviceType)
    return response
  }

  const deleteCategory = async (categoryId) => {
    const response = await categoryApi.deleteCategory(categoryId)
    await loadCategories(productForm.deviceType)
    return response
  }

  useEffect(() => {
    if (productForm.brand_id && !brands.some((brand) => String(brand.brand_id) === String(productForm.brand_id))) {
      setProductForm((prev) => ({ ...prev, brand_id: "", brand: "" }))
    }

    if (productForm.category_id && !categories.some((category) => String(category.category_id) === String(productForm.category_id))) {
      setProductForm((prev) => ({ ...prev, category_id: "", series: "" }))
    }
  }, [brands, categories, productForm.brand_id, productForm.category_id])

  const fetchStaffUsers = async () => {
    setLoadingStaff(true)
    try {
      const token = getAuthToken()
      const response = await fetch(buildApiUrl("/api/auth/admin/users"), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setStaffUsers(data.data)
          console.log("✅ Đã tải danh sách nhân viên:", data.data)
        }
      } else {
        console.error("Lỗi:", response.statusText)
        // Giữ dữ liệu initial nếu lỗi
      }
    } catch (error) {
      console.error("Error fetching staff users:", error)
    } finally {
      setLoadingStaff(false)
    }
  }

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const response = await orderApi.getOrders({ limit: 100 })
      const list = Array.isArray(response?.data) ? response.data : []
      const mapped = list.map((order) => ({
        id: order.order_id,
        customer: order.customer_name,
        type: order.order_type === "PRE_ORDER" ? "Pre-order" : "Thường",
        total: Number(order.total_amount || 0),
        status: order.status,
        date: order.order_date ? new Date(order.order_date).toLocaleDateString("vi-VN") : "",
        preOrder: order.order_type === "PRE_ORDER",
      }))
      setOrders(mapped)
    } catch (error) {
      console.error("Error loading orders:", error)
      alert(`Không thể tải đơn hàng: ${error.message}`)
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadInventory = async () => {
    setLoadingInventory(true)
    try {
      const response = await inventoryApi.getLowStockProducts(10)
      setInventory(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error("Error loading inventory:", error)
      alert(`Không thể tải tồn kho: ${error.message}`)
    } finally {
      setLoadingInventory(false)
    }
  }

  const loadCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const response = await adminApi.getCustomers()
      const list = Array.isArray(response?.data) ? response.data : []
      const mapped = list.map((item) => {
        const orderCount = Number(item.total_orders || 0)
        const spent = Number(item.total_spent || 0)
        let segment = "Mới"
        if (orderCount >= 10 || spent >= 100000000) segment = "VIP"
        else if (orderCount >= 3 || spent >= 30000000) segment = "Thân thiết"

        return {
          id: item.user_id,
          name: item.full_name,
          segment,
          orders: orderCount,
          totalSpent: spent,
          status: String(item.status || "ACTIVE").toLowerCase() === "locked" ? "locked" : "active",
        }
      })
      setCustomers(mapped)
    } catch (error) {
      console.error("Error loading customers:", error)
      alert(`Không thể tải khách hàng: ${error.message}`)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const response = await adminApi.getProductReviews()
      const list = Array.isArray(response?.data) ? response.data : []
      const mapped = list.map((item) => ({
        id: item.review_id,
        user: item.reviewer_name,
        product: item.product_name,
        text: item.content || "",
        rating: Number(item.rating || 0),
      }))
      setComments(mapped)
    } catch (error) {
      console.error("Error loading reviews:", error)
      alert(`Không thể tải đánh giá: ${error.message}`)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    if (activeModule === "orders" || activeModule === "dashboard") {
      loadOrders()
    }
    if (activeModule === "inventory" || activeModule === "dashboard") {
      loadInventory()
    }
    if (activeModule === "customers" || activeModule === "dashboard") {
      loadCustomers()
    }
    if (activeModule === "content" || activeModule === "dashboard") {
      loadComments()
    }
  }, [activeModule])

  const lowStockItems = useMemo(() => inventory, [inventory])

  const filteredProducts = useMemo(() => {
    const sourceProducts = isScopedAdmin
      ? products.filter((product) => isProductInScope(product, adminScope))
      : products

    if (!searchTerm.trim()) return sourceProducts
    return sourceProducts.filter((product) =>
      String(product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.series || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.id || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [products, searchTerm, isScopedAdmin, adminScope])

  const revenueSummary = useMemo(() => {
    const completed = orders.filter((order) => order.status === "COMPLETED")
    const processing = orders.filter((order) => order.status !== "CANCELLED")
    return {
      day: 125000000,
      month: 2480000000,
      year: 19800000000,
      brandAsus: 62,
      priceSegmentMid: 47,
      avgOrder: processing.length ? processing.reduce((sum, order) => sum + order.total, 0) / processing.length : 0,
      cancelRate: orders.length ? Math.round((orders.filter((order) => order.status === "CANCELLED").length / orders.length) * 100) : 0,
      returnRate: 36,
      completedOrders: completed.length,
      preOrders: orders.filter((order) => order.preOrder).length,
      preOrderCancelRate: 20,
      waitingAverageDays: 4,
    }
  }, [orders])

  const recommendationStats = {
    topSuggested: ["ASUS TUF Gaming F16", "ASUS Vivobook 16X", "ASUS ROG Strix G16"],
    clickRate: 18.5,
    purchaseRate: 5.2,
  }

  const aiStats = useMemo(() => {
    const interactions = aiLogs.reduce((sum, item) => sum + item.interactions, 0)
    const conversions = aiLogs.reduce((sum, item) => sum + item.conversions, 0)
    const conversionRate = interactions ? ((conversions / interactions) * 100).toFixed(1) : 0
    return { interactions, conversions, conversionRate }
  }, [aiLogs])

  const handleProductSubmit = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    // Validate brand and category selection
    if (!productForm.brand_id || productForm.brand_id === '') {
      showProductNotice('error', 'Vui lòng chọn thương hiệu')
      return
    }
    if (!productForm.category_id || productForm.category_id === '') {
      showProductNotice('error', 'Vui lòng chọn danh mục')
      return
    }
    if (!editingProductId && (!productForm.imageFiles || productForm.imageFiles.length === 0)) {
      showProductNotice('error', 'Vui lòng upload hình ảnh sản phẩm')
      return
    }

    let workingVariants = [...productVariants]

    if (!editingProductId && workingVariants.length === 0) {
      const normalizedSku = String(productForm.sku || '').trim()
      if (!normalizedSku) {
        showProductNotice('error', 'Vui lòng nhập SKU cho sản phẩm mới')
        return
      }

      const originalPriceValue = toSafeNumber(productForm.oldPrice || productForm.price, 0)
      const discountPriceValue = productForm.price ? toSafeNumber(productForm.price, 0) : null
      const hasValidDiscount = discountPriceValue && discountPriceValue > 0 && originalPriceValue > discountPriceValue

      workingVariants = [
        {
          sku: normalizedSku,
          color: String(productForm.color || '').trim() || 'Mặc định',
          cpu: productForm.cpu || 'Đang cập nhật',
          cpuBenchmarkScore: productForm.cpuBenchmarkScore || "",
          gpu: productForm.graphics || 'Đang cập nhật',
          ram: productForm.ram || '8',
          ramType: productForm.ramType || 'DDR4',
          storage: productForm.storage || '256',
          originalPrice: originalPriceValue,
          discountPrice: hasValidDiscount ? discountPriceValue : null,
          stock: toSafeNumber(productForm.stock, 0, { integer: true }),
          status: getVariantStatus(productForm.stock),
          imageFiles: Array.isArray(productForm.imageFiles) ? productForm.imageFiles : [],
          imagePreviews: Array.isArray(productForm.imagePreviews) ? productForm.imagePreviews : [],
        },
      ]
    }

    if (!editingProductId && workingVariants.some((variant) => !variant.imageFiles || variant.imageFiles.length === 0)) {
      showProductNotice('error', 'Mỗi phiên bản sản phẩm phải có tối thiểu 1 ảnh')
      return
    }

    const representativeVariantIndex = workingVariants.findIndex((variant) => variant.status !== "DISCONTINUED")
    const firstVariant = representativeVariantIndex >= 0 ? workingVariants[representativeVariantIndex] : workingVariants[0]
    const basePrice = firstVariant
      ? toSafeNumber(firstVariant.discountPrice || firstVariant.originalPrice, 0)
      : toSafeNumber(productForm.price, 0)
    const baseOldPrice = firstVariant
      ? toSafeNumber(firstVariant.originalPrice || firstVariant.discountPrice, 0)
      : toSafeNumber(productForm.oldPrice || productForm.price, 0)
    const baseRam = firstVariant?.ram || productForm.ram
    const baseRamType = firstVariant?.ramType || productForm.ramType
    const baseStorage = firstVariant?.storage || productForm.storage
    const baseCpu = firstVariant?.cpu || productForm.cpu
    const baseCpuBenchmarkScore = firstVariant?.cpuBenchmarkScore || productForm.cpuBenchmarkScore
    const baseGraphics = firstVariant?.gpu || productForm.graphics
    const baseStock = firstVariant
      ? toSafeNumber(firstVariant.stock, 0, { integer: true })
      : toSafeNumber(productForm.stock, 0, { integer: true })

    const autoConfig = `${baseRam}${baseRamType ? ` ${baseRamType}` : ""} | ${baseStorage} | ${productForm.screenSize}`
    const autoSpecs = `${baseCpu} | ${baseGraphics} | ${productForm.os}${productForm.weightKg ? ` | ${productForm.weightKg} kg` : ""}`

    const normalizedVariants = workingVariants.map((variant, index) => {
      let parsedVariantExtraSpecs
      try {
        parsedVariantExtraSpecs = parseOptionalJsonObject(variant.extraSpecsJsonText)
      } catch {
        throw new Error(`JSON thông số mở rộng của phiên bản ${variant.sku || `#${index + 1}`} không hợp lệ`)
      }

      if (index !== (representativeVariantIndex >= 0 ? representativeVariantIndex : 0)) {
        return {
          ...variant,
          status: getVariantStatus(variant.stock, variant.status),
          extraSpecsJson: parsedVariantExtraSpecs,
        }
      }

      return {
        ...variant,
        cpu: productForm.cpu || variant.cpu,
        cpuBenchmarkScore: productForm.cpuBenchmarkScore || variant.cpuBenchmarkScore,
        gpu: productForm.graphics || variant.gpu,
        color: productForm.color || variant.color,
        ram: productForm.ram || variant.ram,
        ramType: productForm.ramType || variant.ramType,
        storage: productForm.storage || variant.storage,
        originalPrice: toSafeNumber(productForm.oldPrice || variant.originalPrice, variant.originalPrice || 0),
        discountPrice: productForm.price ? toSafeNumber(productForm.price, variant.discountPrice || 0) : variant.discountPrice,
        stock: productForm.stock !== ""
          ? toSafeNumber(productForm.stock, 0, { integer: true })
          : toSafeNumber(variant.stock, 0, { integer: true }),
        status: getVariantStatus(
          productForm.stock !== ""
            ? toSafeNumber(productForm.stock, 0, { integer: true })
            : toSafeNumber(variant.stock, 0, { integer: true }),
          variant.status
        ),
        extraSpecsJson: parsedVariantExtraSpecs,
      }
    })

    let parsedDeviceSpecificSpecs
    try {
      parsedDeviceSpecificSpecs = parseOptionalJsonObject(productForm.deviceSpecificSpecsText)
    } catch {
      showProductNotice('error', 'JSON thông số riêng theo loại thiết bị không hợp lệ')
      return
    }

    const payload = {
      name: productForm.name,
      deviceType: productForm.deviceType,
      sku: productForm.sku,
      color: productForm.color,
      brand: productForm.brand,
      brand_id: productForm.brand_id, // Pass brand_id for API
      category_id: productForm.category_id, // Pass category_id for API
      description: productForm.description,
      highlightFeatures: productForm.highlightFeatures,
      price: basePrice,
      oldPrice: baseOldPrice,
      storage: baseStorage,
      ram: baseRam,
      ramType: baseRamType,
      cpu: baseCpu,
      cpuBenchmarkScore: baseCpuBenchmarkScore,
      screenSize: productForm.screenSize,
      weightKg: productForm.weightKg,
      os: productForm.os,
      batteryCapacityMah: productForm.batteryCapacityMah,
      refreshRateHz: productForm.refreshRateHz,
      chargingPort: productForm.chargingPort,
      connectivity: productForm.connectivity,
      waterResistance: productForm.waterResistance,
      sensors: productForm.sensors,
      speakerType: productForm.speakerType,
      deviceSpecificSpecs: parsedDeviceSpecificSpecs,
      graphics: baseGraphics,
      features: productForm.features,
      hasAI: productForm.hasAI,
      series: productForm.series,
      stock: baseStock,
      config: autoConfig,
      specs: autoSpecs,
      image: productForm.image || "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_10__5_117.png",
      discount:
        productForm.discount ||
        (baseOldPrice > basePrice ? `Giảm ${Math.round(((baseOldPrice - basePrice) / baseOldPrice) * 100)}%` : ""),
      installment: productForm.installment,
      newArrival: productForm.newArrival,
      productImages: productForm.imageFiles,
      variantImages: normalizedVariants.map((variant) => variant.imageFiles || []),
      productVariants: normalizedVariants,
    }

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload)
        showProductNotice('success', 'Cập nhật sản phẩm thành công')
      } else {
        await addProduct(payload)
        showProductNotice('success', 'Thêm sản phẩm thành công')
      }

      // Clear form on success
      setProductForm(createEmptyProductForm())
      setProductVariants([])
      setEditingVariantIndex(-1)
      setVariantForm(createEmptyVariantForm())
      setEditingProductId("")
    } catch (error) {
      console.error('Error submitting product:', error)
      showProductNotice('error', error.message || 'Không thể lưu sản phẩm')
    }
  }

  const handleAddVariant = async () => {
    if (!variantForm.sku || !variantForm.color || !variantForm.ram || !variantForm.storage || !variantForm.originalPrice) {
      showProductNotice('error', 'Vui lòng điền SKU, màu, RAM, ổ cứng và giá gốc cho phiên bản')
      return
    }
    const previewCount = variantForm.imagePreviews?.length || 0
    if ((!variantForm.imageFiles || variantForm.imageFiles.length === 0) && previewCount === 0) {
      showProductNotice('error', 'Mỗi phiên bản cần tối thiểu 1 ảnh')
      return
    }

    const newVariant = {
      ...variantForm,
      originalPrice: toSafeNumber(variantForm.originalPrice, 0),
      discountPrice: variantForm.discountPrice ? toSafeNumber(variantForm.discountPrice, 0) : null,
      stock: toSafeNumber(variantForm.stock, 0, { integer: true }),
      status: getVariantStatus(variantForm.stock, variantForm.status),
      extraSpecsJson: (() => {
        try {
          return parseOptionalJsonObject(variantForm.extraSpecsJsonText)
        } catch {
          return undefined
        }
      })(),
    }

    if (variantForm.extraSpecsJsonText && newVariant.extraSpecsJson === undefined) {
      showProductNotice('error', 'JSON thông số mở rộng của phiên bản không hợp lệ')
      return
    }

    if (editingVariantIndex >= 0) {
      const existingVariant = productVariants[editingVariantIndex]
      if (editingProductId && existingVariant?.variant_id) {
        try {
          await updateVariantInProduct(editingProductId, {
            ...newVariant,
            variant_id: existingVariant.variant_id,
          }, newVariant.imageFiles || [])
          showProductNotice('success', 'Đã cập nhật phiên bản thành công')
        } catch (error) {
          showProductNotice('error', `Không thể cập nhật phiên bản: ${error.message}`)
          return
        }
      }

      const updated = [...productVariants]
      updated[editingVariantIndex] = {
        ...existingVariant,
        ...newVariant,
        imagePreviews: newVariant.imagePreviews?.length
          ? newVariant.imagePreviews
          : (existingVariant?.imagePreviews || []),
      }
      setProductVariants(updated)
      setEditingVariantIndex(-1)
    } else {
      if (editingProductId) {
        try {
          await addVariantToProduct(editingProductId, newVariant, newVariant.imageFiles || [])
          showProductNotice('success', 'Đã thêm phiên bản thành công')
        } catch (error) {
          showProductNotice('error', `Không thể thêm phiên bản: ${error.message}`)
          return
        }
      }
      setProductVariants((prev) => [...prev, newVariant])
      if (!editingProductId) {
        showProductNotice('success', 'Đã thêm phiên bản vào danh sách')
      }
    }

    setVariantForm(createEmptyVariantForm())
  }

  const handleEditVariant = (index) => {
    setEditingVariantIndex(index)
    setVariantForm({
      ...createEmptyVariantForm(),
      ...productVariants[index],
    })
  }

  const handleDeleteVariant = async (index) => {
    const variant = productVariants[index]
    const label = variant.sku || variant.color || `Phiên bản #${index + 1}`
    if (!window.confirm(`Bạn có chắc muốn xóa phiên bản "${label}" không?`)) return

    if (editingProductId && variant?.variant_id) {
      try {
        await removeVariantFromProduct(editingProductId, variant.variant_id)
        showProductNotice('success', `Đã cập nhật trạng thái phiên bản "${label}"`)
      } catch (error) {
        showProductNotice('error', `Không thể xóa phiên bản: ${error.message}`)
        return
      }
    }

    setProductVariants((prev) => prev.filter((_, i) => i !== index))
    if (editingVariantIndex === index) {
      setEditingVariantIndex(-1)
      setVariantForm(createEmptyVariantForm())
    } else if (editingVariantIndex > index) {
      setEditingVariantIndex((prev) => prev - 1)
    }
  }

  const handleEditProduct = async (product) => {
    setEditingProductId(product.id)
    setProductVariants([])
    setEditingVariantIndex(-1)
    setVariantForm(createEmptyVariantForm())

    try {
      const detailResponse = await productApi.getProductById(product.id)
      const productDetail = detailResponse?.data
      const preferredVariant = getPreferredVariant(productDetail?.variants)

      setProductForm({
        ...createEmptyProductForm(),
        name: productDetail?.product_name || product.name,
        deviceType: productDetail?.device_type || "LAPTOP",
        sku: preferredVariant?.sku || "",
        color: preferredVariant?.color_name || "",
        brand_id: product.brand_id || "",
        category_id: product.category_id || "",
        brand: product.brand || productDetail?.brand_name || "",
        price: preferredVariant ? String(Number(preferredVariant.discount_price || preferredVariant.original_price || 0)) : String(product.price || ""),
        oldPrice: preferredVariant ? String(Number(preferredVariant.original_price || preferredVariant.discount_price || 0)) : String(product.oldPrice || product.price || ""),
        storage: preferredVariant?.storage_gb != null ? String(preferredVariant.storage_gb) : product.storage,
        ram: preferredVariant?.ram_gb != null ? String(preferredVariant.ram_gb) : product.ram,
        ramType: preferredVariant?.ram_type || product.ramType || "",
        cpu: preferredVariant?.cpu_name || product.cpu,
        cpuBenchmarkScore: preferredVariant?.cpu_benchmark_score != null ? String(preferredVariant.cpu_benchmark_score) : "",
        screenSize: productDetail?.screen_size != null ? String(productDetail.screen_size) : String(product.screenSize || "").replace(/[^\d.]/g, ""),
        weightKg: productDetail?.weight_kg != null ? String(productDetail.weight_kg) : product.weightKg || "",
        os: String(productDetail?.os || product.os || "").trim(),
        batteryCapacityMah: productDetail?.battery_capacity_mah != null ? String(productDetail.battery_capacity_mah) : "",
        refreshRateHz: productDetail?.refresh_rate_hz != null ? String(productDetail.refresh_rate_hz) : "",
        chargingPort: productDetail?.charging_port || "",
        connectivity: productDetail?.connectivity || "",
        waterResistance: productDetail?.water_resistance || "",
        sensors: productDetail?.sensors || "",
        speakerType: productDetail?.speaker_type || "",
        deviceSpecificSpecsText: productDetail?.device_specific_specs
          ? JSON.stringify(productDetail.device_specific_specs, null, 2)
          : "",
        graphics: preferredVariant?.gpu || product.graphics,
        features: splitFeatures(productDetail?.highlight_features),
        description: productDetail?.description_html || "",
        highlightFeatures: productDetail?.highlight_features || "",
        hasAI: product.hasAI || false,
        series: product.series || productDetail?.category_name || "",
        stock: preferredVariant ? String(Number(preferredVariant.stock_quantity || 0)) : String(product.stock || ""),
        image: product.image,
        imageFiles: [],
        imagePreviews: Array.isArray(productDetail?.images)
          ? productDetail.images.map((image) => getImageUrl(image.image_url)).filter(Boolean)
          : (product.image ? [product.image] : []),
        discount: product.discount,
        installment: product.installment || "Trả góp 0%",
        newArrival: product.newArrival || false,
      })

      if (Array.isArray(productDetail?.variants)) {
        const mappedVariants = productDetail.variants.map((variant) => ({
          variant_id: variant.variant_id,
          sku: variant.sku || "",
          cpu: variant.cpu_name || "",
          cpuBenchmarkScore: variant.cpu_benchmark_score != null ? String(variant.cpu_benchmark_score) : "",
          gpu: variant.gpu || "",
          ram: variant.ram_gb != null ? String(variant.ram_gb) : "",
          ramType: variant.ram_type || preferredVariant?.ram_type || product.ramType || "",
          storage: variant.storage_gb != null ? String(variant.storage_gb) : "",
          color: variant.color_name || "",
          originalPrice: Number(variant.original_price || 0),
          discountPrice: variant.discount_price != null ? Number(variant.discount_price) : null,
          stock: Number(variant.stock_quantity || 0),
          status: variant.status || getVariantStatus(variant.stock_quantity),
          extraSpecsJsonText: variant.extra_specs_json
            ? JSON.stringify(variant.extra_specs_json, null, 2)
            : "",
          imageFiles: [],
          imagePreviews: Array.isArray(variant.images)
            ? variant.images.map((img) => getImageUrl(img.image_url)).filter(Boolean)
            : [],
        }))
        setProductVariants(mappedVariants)
      }
    } catch (error) {
      console.error('Error loading product detail variants:', error)
      setProductForm({
        ...createEmptyProductForm(),
        name: product.name,
        sku: "",
        color: "",
        brand_id: product.brand_id || "",
        category_id: product.category_id || "",
        brand: product.brand,
        price: String(product.price || ""),
        oldPrice: String(product.oldPrice || product.price || ""),
        storage: product.storage,
        ram: product.ram,
        ramType: product.ramType || "",
        cpu: product.cpu,
        cpuBenchmarkScore: "",
        screenSize: String(product.screenSize || "").replace(/[^\d.]/g, ""),
        weightKg: product.weightKg || "",
        os: product.os || "",
        graphics: product.graphics,
        features: product.features || [],
        description: product.descriptionHtml || "",
        highlightFeatures: product.highlightFeatures || "",
        hasAI: product.hasAI || false,
        series: product.series,
        stock: String(product.stock || ""),
        image: product.image,
        imageFiles: [],
        imagePreviews: product.image ? [product.image] : [],
        discount: product.discount,
        installment: product.installment || "Trả góp 0%",
        newArrival: product.newArrival || false,
      })
      showProductNotice('error', 'Không thể tải đầy đủ danh sách phiên bản, nhưng bạn vẫn có thể sửa thông tin cơ bản.')
    }

    setActiveModule("products")
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc muốn ngừng kinh doanh sản phẩm này?")) return

    try {
      await deleteProduct(id)
      setInventory((prev) => prev.filter((item) => String(item.productId) !== String(id)))
      alert("Đã cập nhật trạng thái sản phẩm sang ngừng kinh doanh")
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(`Không thể cập nhật trạng thái sản phẩm: ${error.message}`)
    }
  }

  const handleStockImport = async (event) => {
    event.preventDefault()
    try {
      const variantId = Number(stockForm.variantId)
      const quantity = Number(stockForm.quantity)
      const unitImportPrice = Number(stockForm.unitImportPrice)

      if (!variantId || !quantity || !unitImportPrice) {
        alert("Vui lòng điền đầy đủ variant ID, số lượng và giá nhập")
        return
      }

      await inventoryApi.createImportReceipt({
        supplier_name: stockForm.supplierName,
        details: [
          {
            variant_id: variantId,
            import_quantity: quantity,
            unit_import_price: unitImportPrice,
          },
        ],
      })

      alert("Tạo phiếu nhập thành công")
      setStockForm({ variantId: "", supplierName: "", quantity: "", unitImportPrice: "" })
      await loadInventory()
    } catch (error) {
      console.error("Error creating import receipt:", error)
      alert(`Không thể tạo phiếu nhập: ${error.message}`)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderApi.updateOrderStatus(orderId, status)
      await loadOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      alert(`Không thể cập nhật trạng thái đơn hàng: ${error.message}`)
    }
  }

  const openOrderDetail = async (orderId) => {
    try {
      const response = await orderApi.getOrderById(orderId)
      const order = response?.data
      if (!order) return

      setSelectedOrder({
        id: order.order_id,
        customer: order.customer_name,
        phone: order.receiver_phone,
        address: [order.specific_address, order.ward, order.district, order.province].filter(Boolean).join(", "),
        type: order.order_type === "PRE_ORDER" ? "Pre-order" : "Thường",
        status: order.status,
        total: Number(order.total_amount || 0),
        date: order.order_date ? new Date(order.order_date).toLocaleDateString("vi-VN") : "",
        items: Array.isArray(order.details)
          ? order.details.map((item) => ({
            id: item.order_detail_id,
            name: `${item.product_name} ${item.color_name ? `- ${item.color_name}` : ""}`,
            quantity: Number(item.quantity || 0),
            price: Number(item.price_at_purchase || 0),
          }))
          : [],
      })
    } catch (error) {
      console.error("Error loading order detail:", error)
      alert(`Không thể tải chi tiết đơn hàng: ${error.message}`)
    }
  }

  const renderOrderDetailModal = () => (
    <OrderDetailModal selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
  )

  const toggleCustomerLock = async (customerId) => {
    try {
      const current = customers.find((customer) => customer.id === customerId)
      if (!current) return
      const nextStatus = current.status === "locked" ? "ACTIVE" : "LOCKED"
      await adminApi.updateCustomerStatus(customerId, nextStatus)
      await loadCustomers()
    } catch (error) {
      console.error("Error toggling customer lock:", error)
      alert(`Không thể cập nhật trạng thái khách hàng: ${error.message}`)
    }
  }

  const removeComment = async (commentId) => {
    try {
      await adminApi.deleteProductReview(commentId)
      await loadComments()
    } catch (error) {
      console.error("Error deleting review:", error)
      alert(`Không thể xóa đánh giá: ${error.message}`)
    }
  }

  const createStaff = async (event) => {
    event.preventDefault()
    if (!newStaff.name || !newStaff.email || !newStaff.phone || !newStaff.password) {
      alert("Vui lòng cung cấp đầy đủ thông tin")
      return
    }

    const normalizedEmail = newStaff.email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      alert("Email không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ: user@example.com")
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch(buildApiUrl("/api/auth/admin/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newStaff.name,
          email: normalizedEmail,
          phone: newStaff.phone,
          password: newStaff.password,
          role: newStaff.role
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Reload danh sách nhân viên từ API
        await fetchStaffUsers()
        // Reset form
        setNewStaff({ name: "", email: "", phone: "", password: "", role: "staff" })
        alert("✅ Tạo tài khoản nhân viên thành công")
        console.log("✅ Nhân viên mới:", data.data)
      } else {
        alert("❌ " + (data.message || "Lỗi khi tạo tài khoản"))
        console.error("Error:", data.message)
      }
    } catch (error) {
      alert("❌ Lỗi kết nối: " + error.message)
      console.error("Error createStaff:", error)
    }
  }

  // ===== RENDER MODULES =====
  const renderModule = () => {
    if (activeModule === "dashboard") return (
      <AdminDashboard
        revenueSummary={revenueSummary}
        orders={orders}
        products={products}
        customers={customers}
        lowStockItems={lowStockItems}
        comments={comments}
        onNavigate={setActiveModule}
      />
    )
    if (activeModule === "products") return (
      <AdminProducts
        isScopedAdmin={isScopedAdmin}
        scopedDeviceType={scopedDeviceType}
        scopedLabel={scopedRule?.label || ""}
        filteredProducts={filteredProducts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        productForm={productForm}
        setProductForm={setProductForm}
        editingProductId={editingProductId}
        handleProductSubmit={handleProductSubmit}
        handleEditProduct={handleEditProduct}
        handleDeleteProduct={handleDeleteProduct}
        productNotice={productNotice}
        clearProductNotice={() => setProductNotice(null)}
        brands={brands}
        categories={categories}
        loadingBrands={loadingBrands}
        loadingCategories={loadingCategories}
        productVariants={productVariants}
        editingVariantIndex={editingVariantIndex}
        setEditingVariantIndex={setEditingVariantIndex}
        variantForm={variantForm}
        setVariantForm={setVariantForm}
        handleAddVariant={handleAddVariant}
        handleEditVariant={handleEditVariant}
        handleDeleteVariant={handleDeleteVariant}
      />
    )
    if (activeModule === "categories") return (
      <AdminCategories
        categories={categories}
        loadingCategories={loadingCategories}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        deviceType={productForm.deviceType}
        onDeviceTypeChange={(nextType) => {
          setProductForm((prev) => ({
            ...prev,
            deviceType: nextType,
            brand_id: "",
            brand: "",
            category_id: "",
            series: "",
          }))
        }}
      />
    )
    if (activeModule === "branch") return <AdminBranch />
    if (activeModule === "inventory") return (
      <AdminInventory
        stockForm={stockForm}
        setStockForm={setStockForm}
        handleStockImport={handleStockImport}
        lowStockItems={lowStockItems}
        loadingInventory={loadingInventory}
      />
    )
    if (activeModule === "orders") return (
      <AdminOrders
        orders={orders}
        updateOrderStatus={updateOrderStatus}
        openOrderDetail={openOrderDetail}
        loadingOrders={loadingOrders}
      />
    )
    if (activeModule === "vouchers") return <AdminVouchers />
    if (activeModule === "customers") return (
      <AdminCustomers
        customers={customers}
        toggleCustomerLock={toggleCustomerLock}
        loadingCustomers={loadingCustomers}
      />
    )

    if (activeModule === "content") return (
      <AdminContent
        comments={comments}
        removeComment={removeComment}
        loadingComments={loadingComments}
      />
    )
    if (activeModule === "documentation") return <AdminNews />
    if (activeModule === "communityQa") return <AdminCommunityQa />
    if (activeModule === "serviceUtilities") return <AdminServiceUtilities />
    if (activeModule === "usedTradeIn") return <AdminUsedTradeIn />
    if (activeModule === "sliders") return <AdminSliderAPI />
    if (activeModule === "notifications") return <AdminNotifications />
    if (activeModule === "recommendation") return (
      <AdminRecommendation
        recommendationStats={recommendationStats}
        recommendationStrategy={recommendationStrategy}
        setRecommendationStrategy={setRecommendationStrategy}
      />
    )
    if (activeModule === "assistant") return (
      <AdminAssistant
        aiLogs={aiLogs}
        aiStats={aiStats}
        aiTrainingNote={aiTrainingNote}
        setAiTrainingNote={setAiTrainingNote}
      />
    )
    if (activeModule === "staff") {
      if (user?.role !== "admin") {
        return (
          <div className="adm-empty-card" style={{ marginTop: 8 }}>
            <h2>Không có quyền truy cập</h2>
            <p>Nhân viên không được phép sử dụng chức năng Người dùng hệ thống.</p>
          </div>
        )
      }

      return (
        <AdminStaff
          staffUsers={staffUsers}
          newStaff={newStaff}
          setNewStaff={setNewStaff}
          createStaff={createStaff}
        />
      )
    }
    return null
  }

  const visibleModuleItems = user?.role === "admin"
      ? moduleItems
      : moduleItems.filter((item) => item.id !== "staff")

  const activeLabel = visibleModuleItems.find((item) => item.id === activeModule)?.label || "Dashboard"

  if (loading) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-card">
          <FiLayers className="adm-empty-icon" />
          <h2>Đang tải phiên đăng nhập...</h2>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-card">
          <FiLayers className="adm-empty-icon" />
          <h2>Yêu cầu đăng nhập</h2>
          <p>Vui lòng đăng nhập để truy cập trang quản trị.</p>
          <button className="adm-btn adm-btn-primary" onClick={() => navigate("/")}>Về trang chủ</button>
        </div>
      </div>
    )
  }

  if (!isAdmin()) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-card">
          <FiLayers className="adm-empty-icon" />
          <h2>Không có quyền truy cập</h2>
          <p>
            Bạn không có quyền truy cập vào trang quản trị.<br />
            Chỉ tài khoản Admin hoặc Nhân viên mới có thể truy cập.
          </p>
          <button className="adm-btn adm-btn-primary" onClick={() => navigate("/")}>Về trang chủ</button>
        </div>
      </div>
    )
  }

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <FiLayers />
          <div>
            <strong>Admin Portal</strong>
            <span>TechMart</span>
          </div>
        </div>

        <nav className="adm-nav">
          {visibleModuleItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`adm-nav-item ${activeModule === item.id ? "active" : ""}`}
                onClick={() => setActiveModule(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="adm-main">
        <header className="adm-topbar">
          <div>
            <h1>{activeLabel}</h1>
            <p>
              {isScopedAdmin
                ? `Bạn đang ở chế độ quản trị ${scopedRule?.label || "theo phạm vi"}: chỉ mục Sản phẩm áp dụng phân quyền phạm vi, các mục admin khác dùng chung.`
                : "Quản trị vận hành, theo dõi hiệu suất và phát triển hệ thống."}
            </p>
          </div>
          <div className="adm-userbox">
            <div className="adm-user-meta">
              <div className="adm-user-name">{user?.name}</div>
              <div className="adm-user-role">
                {user?.role === "admin" ? "Admin" : "Nhân viên"}
              </div>
            </div>
          </div>
        </header>

        {renderModule()}
        {renderOrderDetailModal()}
      </main>
    </div>
  )
}
