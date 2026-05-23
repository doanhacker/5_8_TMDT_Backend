import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useProducts } from "../context/ProductContext"
import * as productApi from "../services/productApi"
import { getImageUrl } from "../config/api"
import {
  FiCheckCircle,
  FiChevronRight,
  FiCpu,
  FiHardDrive,
  FiHeart,
  FiMessageSquare,
  FiMinus,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiShare2,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
  FiX,
} from "react-icons/fi"
import "../styles/ProductDetail.css"
import Breadcrumb from "../components/Breadcrumb"

const FALLBACK_IMAGE = "https://via.placeholder.com/600x400?text=Laptop"
const MAX_COMPARE_ITEMS = 3
const defaultPromotions = [
  "Tặng balo laptop cao cấp trị giá 490.000đ",
  "Giảm thêm 500.000đ cho học sinh, sinh viên",
  "Trả góp 0% qua thẻ tín dụng",
]

const toText = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
const toNumber = (value) => Number(value || 0)
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`
const extractNumber = (value, fallback = 0) => {
  const matched = String(value || "").match(/\d+/)
  return matched ? Number(matched[0]) : fallback
}
const formatDate = (value) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("vi-VN")
}

const isPurchasableVariant = (variant) => {
  if (!variant) return false
  return variant.status !== "DISCONTINUED"
}

const getPrimaryImage = (productDetail, variant, imageOverride) => {
  if (imageOverride) return imageOverride
  return getImageUrl(
    variant?.images?.[0]?.image_url
    || productDetail?.images?.[0]?.image_url
    || FALLBACK_IMAGE,
  )
}

const getCompareSpecs = (productDetail, variant) => [
  { label: "Loại card đồ họa", value: variant?.gpu || "Đang cập nhật" },
  { label: "Dung lượng RAM", value: variant ? `${variant.ram_gb || 0}GB ${variant.ram_type || ""}`.trim() : "Đang cập nhật" },
  { label: "Ổ cứng", value: variant?.storage_gb ? `${variant.storage_gb}GB` : "Đang cập nhật" },
  { label: "Kích thước màn hình", value: productDetail?.screen_size ? `${productDetail.screen_size} inches` : "Đang cập nhật" },
  { label: "CPU", value: variant?.cpu_name || "Đang cập nhật" },
  { label: "Hệ điều hành", value: productDetail?.os || "Đang cập nhật" },
  { label: "Phiên bản (SKU)", value: variant?.sku || "Đang cập nhật" },
  { label: "Màu sắc", value: variant?.color_name || "Đang cập nhật" },
  { label: "Tồn kho", value: `${variant?.stock_quantity ?? 0}` },
]

const buildCompareEntry = (productDetail, variantIndex = 0, imageOverride = "") => {
  if (!productDetail) return null

  const variants = productDetail.variants || []
  const safeIndex = variants[variantIndex] ? variantIndex : 0
  const variant = variants[safeIndex] || null
  const price = toNumber(variant?.discount_price || variant?.original_price)
  const oldPrice = toNumber(variant?.original_price || variant?.discount_price)
  const displayLabel = variant
    ? variant.sku || "SKU chưa cập nhật"
    : "Đang cập nhật cấu hình"

  return {
    productId: String(productDetail.product_id),
    variantId: variant?.variant_id || null,
    name: productDetail.product_name,
    brandName: productDetail.brand_name || "Laptop",
    image: getPrimaryImage(productDetail, variant, imageOverride),
    price,
    oldPrice,
    tradeInPrice: Math.max(0, price - 3000000),
    subtitle: [variant?.cpu_name, variant?.gpu].filter(Boolean).join(" | ") || "Đang cập nhật",
    config: displayLabel,
    specs: getCompareSpecs(productDetail, variant),
  }
}

const normalizeMockProductDetail = (mock) => {
  if (!mock || !mock.id) return null

  const basePrice = toNumber(mock.price)
  const fallbackOldPrice = basePrice > 0 ? basePrice : 0
  const oldPrice = toNumber(mock.oldPrice || fallbackOldPrice)
  const image = mock.image || FALLBACK_IMAGE

  return {
    product_id: mock.id,
    product_name: mock.name || "Sản phẩm",
    brand_name: mock.brand || "TechMart",
    screen_size: extractNumber(mock.display, 11),
    os: mock.os || "Đang cập nhật",
    weight_kg: 0,
    highlight_features: mock.feature || "Thiết kế đẹp, hiệu năng ổn định",
    images: [{ image_url: image }],
    reviews: [],
    variants: [
      {
        variant_id: `mock-${mock.id}`,
        discount_price: basePrice,
        original_price: oldPrice || basePrice,
        status: "ACTIVE",
        stock_quantity: 99,
        cpu_name: mock.chipset || mock.cpu || "Đang cập nhật",
        gpu: mock.camera || "Đang cập nhật",
        ram_gb: extractNumber(mock.ram, 8),
        ram_type: "",
        storage_gb: extractNumber(mock.storage, 128),
        sku: `MOCK-${mock.id}`,
        color_name: "Mặc định",
        images: [{ image_url: image }],
      },
    ],
  }
}

export default function ProductDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { products } = useProducts()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState(FALLBACK_IMAGE)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("overview")
  const [isFavorite, setIsFavorite] = useState(false)
  const [addMessage, setAddMessage] = useState("")
  const [compareSelections, setCompareSelections] = useState([null, null])
  const [compareMessage, setCompareMessage] = useState("")
  const [compareQuery, setCompareQuery] = useState("")
  const [showCompareResults, setShowCompareResults] = useState(false)
  const [isComparePickerOpen, setIsComparePickerOpen] = useState(false)
  const [isCompareDockCollapsed, setIsCompareDockCollapsed] = useState(false)
  const [activeCompareSlot, setActiveCompareSlot] = useState(0)
  const [compareLoadingSlot, setCompareLoadingSlot] = useState(null)
  const [selectedColor, setSelectedColor] = useState("")
  const mockProductFromState = useMemo(
    () => normalizeMockProductDetail(location.state?.mockProduct),
    [location.state],
  )
  const currentProductSummary = useMemo(
    () => products.find((item) => String(item.id) === String(id)) || null,
    [id, products],
  )

  useEffect(() => {
    const fetchDetail = async () => {
      const applyMockState = () => {
        if (!mockProductFromState || String(mockProductFromState.product_id) !== String(id)) {
          return false
        }

        setProduct(mockProductFromState)
        setSelectedVariantIndex(0)
        setQuantity(1)
        setActiveTab("overview")
        setAddMessage("")
        setCompareSelections([null, null])
        setCompareMessage("")
        setCompareQuery("")
        setShowCompareResults(false)
        setIsComparePickerOpen(false)
        setIsCompareDockCollapsed(false)
        setSelectedColor(mockProductFromState.variants?.[0]?.color_name || "")
        setSelectedImage(getPrimaryImage(mockProductFromState, mockProductFromState.variants?.[0], FALLBACK_IMAGE))
        setError("")
        setLoading(false)
        return true
      }

      if (applyMockState()) return

      try {
        setLoading(true)
        setError("")
        const response = await productApi.getProductById(id)
        if (!response?.success || !response?.data) {
          throw new Error("Không tìm thấy dữ liệu sản phẩm")
        }

        const detail = response.data
        const activeVariants = Array.isArray(detail.variants)
          ? detail.variants.filter((variant) => isPurchasableVariant(variant))
          : []
        const normalizedDetail = {
          ...detail,
          variants: activeVariants.length > 0 ? activeVariants : detail.variants || [],
        }
        setProduct(normalizedDetail)
        setSelectedVariantIndex(0)
        setQuantity(1)
        setActiveTab("overview")
        setAddMessage("")
        setCompareSelections([null, null])
        setCompareMessage("")
        setCompareQuery("")
        setShowCompareResults(false)
        setIsComparePickerOpen(false)
        setIsCompareDockCollapsed(false)
        setSelectedColor(normalizedDetail.variants?.[0]?.color_name || "")

        const firstVariantImage = normalizedDetail.variants?.[0]?.images?.[0]?.image_url
        const firstProductImage = normalizedDetail.images?.[0]?.image_url
        setSelectedImage(getImageUrl(firstVariantImage || firstProductImage || FALLBACK_IMAGE))
      } catch (err) {
        if (applyMockState()) return
        console.error("Error fetching product detail:", err)
        setError(err.message || "Không thể tải chi tiết sản phẩm")
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id, mockProductFromState])

  const variants = product?.variants || []
  const selectedVariant = variants[selectedVariantIndex] || null

  const colorOptions = useMemo(() => {
    const colorMap = new Map()

    variants.forEach((variant, index) => {
      const colorLabel = (variant.color_name || "").trim()
      if (!colorLabel) return

      const key = colorLabel.toLowerCase()
      if (colorMap.has(key)) return

      colorMap.set(key, {
        key,
        label: colorLabel,
        originalIndex: index,
        image: getPrimaryImage(product, variant),
        price: toNumber(variant.discount_price || variant.original_price),
      })
    })

    return Array.from(colorMap.values())
  }, [product, variants])

  const visibleVariants = useMemo(() => {
    const normalizedColor = selectedColor.trim().toLowerCase()
    return variants
      .map((variant, index) => ({ ...variant, originalIndex: index }))
      .filter((variant) => {
        if (!normalizedColor) return true
        return String(variant.color_name || "").trim().toLowerCase() === normalizedColor
      })
  }, [selectedColor, variants])

  const currentImages = useMemo(() => {
    const variantImages = (selectedVariant?.images || []).map((img) => getImageUrl(img.image_url))
    const productImages = (product?.images || []).map((img) => getImageUrl(img.image_url))
    const merged = [...variantImages, ...productImages].filter(Boolean)
    return merged.length > 0 ? [...new Set(merged)] : [FALLBACK_IMAGE]
  }, [selectedVariant, product])

  useEffect(() => {
    if (!currentImages.includes(selectedImage)) {
      setSelectedImage(currentImages[0])
    }
  }, [currentImages, selectedImage])

  useEffect(() => {
    const currentColor = selectedVariant?.color_name || ""
    if (currentColor && currentColor !== selectedColor) {
      setSelectedColor(currentColor)
    }
  }, [selectedVariant, selectedColor])

  const finalPrice = selectedVariant
    ? toNumber(selectedVariant.discount_price || selectedVariant.original_price)
    : 0
  const oldPrice = selectedVariant
    ? toNumber(selectedVariant.original_price || selectedVariant.discount_price)
    : 0
  const saving = Math.max(0, oldPrice - finalPrice)
  const tradeInPrice = Math.max(0, finalPrice - 3000000)

  const highlights = (product?.highlight_features || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  const fullSpecs = selectedVariant
    ? `${selectedVariant.cpu_name || "CPU"} | ${selectedVariant.gpu || "GPU"} | ${selectedVariant.ram_gb || 0}GB ${selectedVariant.ram_type || ""} | ${selectedVariant.storage_gb || 0}GB`
    : "Đang cập nhật cấu hình"

  const specTable = [
    { label: "CPU", value: selectedVariant?.cpu_name || "Đang cập nhật" },
    { label: "GPU", value: selectedVariant?.gpu || "Đang cập nhật" },
    { label: "RAM", value: selectedVariant ? `${selectedVariant.ram_gb}GB ${selectedVariant.ram_type || ""}` : "Đang cập nhật" },
    { label: "Ổ cứng", value: selectedVariant ? `${selectedVariant.storage_gb}GB` : "Đang cập nhật" },
    { label: "Phiên bản (SKU)", value: selectedVariant?.sku || "Đang cập nhật" },
    { label: "Màu sắc", value: selectedVariant?.color_name || "Đang cập nhật" },
    { label: "Màn hình", value: product?.screen_size ? `${product.screen_size} inch` : "Đang cập nhật" },
    { label: "Khối lượng", value: product?.weight_kg ? `${product.weight_kg} kg` : "Đang cập nhật" },
    { label: "Hệ điều hành", value: product?.os || "Đang cập nhật" },
  ]

  const reviewCount = product?.reviews?.length || 0
  const avgRating = reviewCount > 0
    ? (product.reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewCount).toFixed(1)
    : "0.0"

  const relatedProducts = products
    .filter((item) => String(item.id) !== String(id))
    .slice(0, 4)

  const compareCandidates = useMemo(() => {
    const others = products.filter((item) => String(item.id) !== String(id))
    const prioritized = others.filter(
      (item) => item.brand_id === String(currentProductSummary?.brand_id || "") || item.category_id === String(currentProductSummary?.category_id || ""),
    )
    const fallback = others.filter(
      (item) => item.brand_id !== String(currentProductSummary?.brand_id || "") && item.category_id !== String(currentProductSummary?.category_id || ""),
    )
    const merged = [...prioritized, ...fallback]
    const normalizedQuery = compareQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return merged.slice(0, 12)
    }

    return merged.filter((item) => {
      const searchable = `${item.name} ${item.brand} ${item.config} ${item.cpu} ${item.graphics}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    }).slice(0, 12)
  }, [compareQuery, currentProductSummary, id, products])

  const primaryCompareItem = useMemo(
    () => buildCompareEntry(product, selectedVariantIndex, selectedImage),
    [product, selectedImage, selectedVariantIndex],
  )

  const compareSlots = [primaryCompareItem, ...compareSelections]
  const compareItems = compareSlots.filter(Boolean)
  const selectedCompareCount = compareItems.length
  const canCompare = selectedCompareCount >= 2

  useEffect(() => {
    if (!isComparePickerOpen && !showCompareResults) return undefined

    const previousBodyOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return

      if (isComparePickerOpen) {
        setIsComparePickerOpen(false)
      } else if (showCompareResults) {
        setShowCompareResults(false)
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isComparePickerOpen, showCompareResults])

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    // { label: "Laptop", path: "/" },
    { label: product?.brand_name || "Sản phẩm", path: "/" },
    { label: product?.product_name || "Chi tiết" },
  ]

  const handleDecrease = () => setQuantity((prev) => Math.max(1, prev - 1))
  const handleIncrease = () => setQuantity((prev) => prev + 1)

  const handleSelectColor = (color) => {
    setSelectedColor(color)
    const normalizedColor = String(color || "").trim().toLowerCase()
    const matchedIndex = variants.findIndex(
      (variant) => String(variant.color_name || "").trim().toLowerCase() === normalizedColor,
    )
    if (matchedIndex >= 0) {
      setSelectedVariantIndex(matchedIndex)
    }
  }

  const handleOpenComparePicker = (slotIndex) => {
    setCompareMessage("")
    setActiveCompareSlot(slotIndex)
    setCompareQuery("")
    setIsCompareDockCollapsed(false)
    setIsComparePickerOpen(true)
  }

  const handleRemoveCompareProduct = (slotIndex) => {
    setCompareSelections((prev) => prev.map((item, index) => (index === slotIndex ? null : item)))
    setCompareMessage("")
    if (selectedCompareCount <= 2) {
      setShowCompareResults(false)
    }
  }

  const handleSelectCompareProduct = async (candidateId) => {
    try {
      setCompareLoadingSlot(activeCompareSlot)
      setCompareMessage("")
      const response = await productApi.getProductById(candidateId)
      if (!response?.success || !response?.data) {
        throw new Error("Không tải được sản phẩm để so sánh")
      }

      const nextEntry = buildCompareEntry(response.data)
      setCompareSelections((prev) => prev.map((item, index) => (index === activeCompareSlot ? nextEntry : item)))
      setIsComparePickerOpen(false)
    } catch (err) {
      console.error("Error selecting compare product:", err)
      setCompareMessage(err.message || "Không thể thêm sản phẩm vào danh sách so sánh")
    } finally {
      setCompareLoadingSlot(null)
    }
  }

  const handleCompareNow = () => {
    if (!canCompare) {
      setCompareMessage("Vui lòng chọn thêm ít nhất 1 sản phẩm để so sánh")
      return
    }

    setCompareMessage("")
    setShowCompareResults(true)
    setIsCompareDockCollapsed(false)
  }

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setAddMessage("Sản phẩm chưa có phiên bản khả dụng")
      return
    }

    if (selectedVariant.status === "COMING_SOON") {
      setAddMessage("Phiên bản này chưa mở bán")
      return
    }

    if (selectedVariant.status === "OUT_OF_STOCK" || Number(selectedVariant.stock_quantity || 0) <= 0) {
      setAddMessage("Phiên bản này đang hết hàng")
      return
    }

    const payload = {
      id: `${product.product_id}-${selectedVariant.variant_id}`,
      name: product.product_name,
      config: `${selectedVariant.ram_gb}GB ${selectedVariant.ram_type || ""} | ${selectedVariant.storage_gb}GB | ${selectedVariant.gpu || ""}`,
      color: selectedVariant.color_name || "Default",
      price: finalPrice,
      image: selectedImage,
      variantId: selectedVariant.variant_id,
      productId: product.product_id,
    }

    addToCart(payload, quantity)
    setAddMessage("Đã thêm vào giỏ hàng thành công!")
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate("/cart")
  }

  const subtotal = finalPrice * quantity

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="pd-card" style={{ padding: "20px" }}>Đang tải chi tiết sản phẩm...</div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="pd-card" style={{ padding: "20px" }}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{error || "Không tìm thấy sản phẩm"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <div className="pd-page">
        <div className="pd-container pd-container-with-compare">
          <section className="pd-main">
            <div className="pd-card pd-gallery">
              <div className="pd-main-image-wrap">
                <img src={selectedImage} alt={product.product_name} className="pd-main-image" />
              </div>

              <div className="pd-thumbs">
                {currentImages.map((image, index) => (
                  <button
                    key={`${product.product_id}-thumb-${index}`}
                    className={`pd-thumb ${selectedImage === image ? "active" : ""}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img src={image} alt={`${product.product_name} - ${index + 1}`} />
                  </button>
                ))}
              </div>

              <div className="pd-highlight-box">
                <h3>Tính năng nổi bật</h3>
                <ul>
                  {(highlights.length > 0 ? highlights : ["Hiệu năng mạnh mẽ", "Thiết kế bền bỉ", "Phù hợp học tập và làm việc"]).map((feature) => (
                    <li key={feature}>
                      <FiCheckCircle />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pd-summary">
              <div className="pd-title-row">
                <div>
                  <h1>{product.product_name}</h1>
                  <p>{fullSpecs}</p>
                </div>
                <div className="pd-top-actions">
                  <button className={`pd-chip ${isFavorite ? "active" : ""}`} onClick={() => setIsFavorite((prev) => !prev)}>
                    <FiHeart /> {isFavorite ? "Đã yêu thích" : "Yêu thích"}
                  </button>
                  <button className="pd-chip" onClick={() => handleOpenComparePicker(0)}>
                    <FiPlus /> So sánh
                  </button>
                  <button className="pd-chip">
                    <FiShare2 /> Chia sẻ
                  </button>
                  <button className="pd-chip" onClick={() => setActiveTab("reviews")}>
                    <FiMessageSquare /> Hỏi đáp
                  </button>
                </div>
              </div>

              <div className="pd-rating-row">
                <div className="pd-stars">
                  <FiStar /> <FiStar /> <FiStar /> <FiStar /> <FiStar />
                </div>
                <span>{avgRating}/5</span>
                <span>({reviewCount} đánh giá)</span>
                <span>Tồn kho: {selectedVariant?.stock_quantity ?? 0}</span>
              </div>

              <div className="pd-card pd-price-box">
                <div className="pd-price-current">{formatCurrency(finalPrice)}</div>
                <div className="pd-price-old">{formatCurrency(oldPrice)}</div>
                <div className="pd-price-save">Tiết kiệm {formatCurrency(saving)}</div>
                <div className="pd-tradein">Thu cũ lên đời từ {formatCurrency(tradeInPrice)}</div>
              </div>

              <div className="pd-card pd-color-card">
                <div className="pd-block-head">
                  <h3>Màu sắc</h3>
                  <p>Chọn màu sắc riêng trước khi chọn phiên bản cấu hình.</p>
                </div>

                {colorOptions.length > 0 ? (
                  <div className="pd-color-picker">
                    <div className="pd-color-grid">
                      {colorOptions.map((colorOption) => (
                        <button
                          key={`color-${colorOption.key}`}
                          className={`pd-color-option ${selectedColor === colorOption.label ? "active" : ""}`}
                          onClick={() => handleSelectColor(colorOption.label)}
                        >
                          <img src={colorOption.image} alt={colorOption.label} className="pd-color-thumb" />
                          <div className="pd-color-meta">
                            <span className="pd-color-name">{colorOption.label}</span>
                            <span className="pd-color-price">{formatCurrency(colorOption.price)}</span>
                          </div>
                          <span className="pd-color-check">✓</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="pd-empty-note">Chưa có dữ liệu màu sắc cho sản phẩm này.</p>
                )}
              </div>

              <div className="pd-card pd-version-card">
                <div className="pd-compare-entry-head">
                  <div>
                    <h3>Phiên bản / Cấu hình</h3>
                    <p>Chọn phiên bản hiện tại để dùng làm mốc khi so sánh với sản phẩm khác.</p>
                  </div>
                  <button className="pd-inline-compare-btn" onClick={() => handleOpenComparePicker(0)}>
                    Thêm sản phẩm so sánh
                  </button>
                </div>

                <div className="pd-config-grid">
                  {visibleVariants.map((variant) => {
                    const price = toNumber(variant.discount_price || variant.original_price)
                    const label = variant.sku || "SKU chưa cập nhật"
                    const index = variant.originalIndex
                    const unavailable = variant.status === "COMING_SOON" || variant.status === "OUT_OF_STOCK"

                    return (
                      <button
                        key={variant.variant_id}
                        className={`pd-config-item ${index === selectedVariantIndex ? "active" : ""}`}
                        onClick={() => setSelectedVariantIndex(index)}
                        disabled={variant.status === "DISCONTINUED"}
                      >
                        <strong>{label}</strong>
                        <span><FiCpu /> {variant.cpu_name || "Đang cập nhật"}</span>
                        <span><FiHardDrive /> {variant.gpu || "Đang cập nhật"}</span>
                        <span>{variant.status === "COMING_SOON" ? "Sắp mở bán" : `Tồn kho: ${variant.stock_quantity}`}</span>
                        <em>{formatCurrency(price)}</em>
                        {unavailable && <small>{variant.status === "COMING_SOON" ? "Chưa thể mua ngay" : "Tạm hết hàng"}</small>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pd-card">
                <h3>Ưu đãi đi kèm</h3>
                <ul className="pd-promo-list">
                  {defaultPromotions.map((promo) => (
                    <li key={promo}>
                      <FiCheckCircle />
                      <span>{promo}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pd-buy-box pd-card">
                <div className="pd-qty-row">
                  <span>Số lượng</span>
                  <div className="pd-qty-control">
                    <button onClick={handleDecrease}><FiMinus /></button>
                    <span>{quantity}</span>
                    <button onClick={handleIncrease}><FiPlus /></button>
                  </div>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>

                <div className="pd-buy-actions">
                  <button className="pd-outline-btn" onClick={handleAddToCart}>
                    <FiShoppingCart /> Thêm vào giỏ
                  </button>
                  <button className="pd-primary-btn" onClick={handleBuyNow}>
                    <FiShoppingCart /> Mua ngay
                  </button>
                </div>

                {addMessage && <p className="pd-add-message">{addMessage}</p>}
              </div>
            </div>
          </section>

          <section className="pd-bottom-grid">
            <div className="pd-card pd-tabs-card">
              <div className="pd-tab-header">
                <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Mô tả</button>
                <button className={activeTab === "specs" ? "active" : ""} onClick={() => setActiveTab("specs")}>Thông số</button>
                <button className={activeTab === "reviews" ? "active" : ""} onClick={() => setActiveTab("reviews")}>Đánh giá</button>
              </div>

              {activeTab === "overview" && (
                <div className="pd-tab-content">
                  <p>{toText(product.description_html) || `${product.product_name} là mẫu laptop phù hợp cho học tập, làm việc và giải trí.`}</p>
                  <ul>
                    {(highlights.length > 0 ? highlights : ["Hiệu năng ổn định", "Thiết kế hiện đại", "Dễ dàng nâng cấp"]).map((item) => (
                      <li key={`overview-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "specs" && (
                <div className="pd-tab-content">
                  <div className="pd-spec-table">
                    {specTable.map((spec) => (
                      <div className="pd-spec-row" key={spec.label}>
                        <span>{spec.label}</span>
                        <strong>{spec.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="pd-tab-content">
                  {(product.reviews || []).length === 0 && <p>Chưa có đánh giá nào cho sản phẩm này.</p>}
                  {(product.reviews || []).map((review) => (
                    <article className="pd-review-item" key={review.review_id}>
                      <div className="pd-review-head">
                        <strong>{review.reviewer_name || "Khách hàng"}</strong>
                        <span>{"⭐".repeat(Number(review.rating || 0))}</span>
                        <small>{formatDate(review.created_at)}</small>
                      </div>
                      <p>{review.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="pd-card pd-policy-card">
              <h3>Chính sách bán hàng</h3>
              <ul>
                <li>
                  <FiTruck /> Giao nhanh toàn quốc, miễn phí đơn từ 300K
                </li>
                <li>
                  <FiShield /> Bảo hành chính hãng 24 tháng
                </li>
                <li>
                  <FiRotateCcw /> 1 đổi 1 trong 30 ngày nếu lỗi phần cứng
                </li>
              </ul>
            </aside>
          </section>

          <section className="pd-card pd-related-section">
            <div className="pd-section-title">
              <h3>Sản phẩm liên quan</h3>
              <button className="pd-view-all" onClick={() => navigate("/")}>
                Xem thêm <FiChevronRight />
              </button>
            </div>

            <div className="pd-related-grid">
              {relatedProducts.map((item) => (
                <article className="pd-related-card" key={item.id} onClick={() => navigate(`/product/${item.id}`)}>
                  <img src={item.image || FALLBACK_IMAGE} alt={item.name} />
                  <h4>{item.name}</h4>
                  <p>{item.config || "Đang cập nhật"}</p>
                  <div>
                    <strong>{formatCurrency(item.price)}</strong>
                    <span>{formatCurrency(item.oldPrice || item.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {isComparePickerOpen && (
          <div className="pd-compare-picker-overlay" onClick={() => setIsComparePickerOpen(false)}>
            <div className="pd-compare-picker" onClick={(event) => event.stopPropagation()}>
              <div className="pd-compare-picker-search">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm muốn so sánh"
                  value={compareQuery}
                  onChange={(event) => setCompareQuery(event.target.value)}
                />
                <button onClick={() => setIsComparePickerOpen(false)}>
                  <FiX />
                </button>
              </div>

              <div className="pd-compare-picker-list">
                {compareCandidates.length === 0 && (
                  <p className="pd-compare-empty-text">Không có sản phẩm phù hợp để so sánh.</p>
                )}
                {compareCandidates.map((item) => {
                  const isCurrent = String(item.id) === String(product.product_id)
                  const isAlreadySelected = compareItems.some((entry) => entry?.productId === String(item.id))

                  return (
                    <article className="pd-compare-picker-item" key={`compare-candidate-${item.id}`}>
                      <img src={item.image || FALLBACK_IMAGE} alt={item.name} />
                      <div className="pd-compare-picker-content">
                        <h4>{item.name}</h4>
                        <p>{item.config || item.specs || "Đang cập nhật"}</p>
                        <div>
                          <strong>{formatCurrency(item.price)}</strong>
                          <span>{formatCurrency(item.oldPrice || item.price)}</span>
                        </div>
                      </div>
                      <button
                        className="pd-compare-picker-btn"
                        disabled={isCurrent || isAlreadySelected || compareLoadingSlot === activeCompareSlot}
                        onClick={() => handleSelectCompareProduct(item.id)}
                      >
                        {isCurrent ? "Hiện tại" : isAlreadySelected ? "Đã chọn" : compareLoadingSlot === activeCompareSlot ? "Đang tải..." : "Chọn"}
                      </button>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {showCompareResults && (
          <div className="pd-compare-results-overlay" onClick={() => setShowCompareResults(false)}>
            <section className="pd-card pd-compare-results pd-compare-results-modal" onClick={(event) => event.stopPropagation()}>
              <div className="pd-section-title pd-compare-results-head">
                <h3>So sánh {compareItems.map((item) => item.name).join(" và ")}</h3>
                <div className="pd-compare-results-head-actions">
                  <button className="pd-view-all" onClick={() => setShowCompareResults(false)}>
                    Đóng bảng so sánh
                  </button>
                  <button className="pd-compare-modal-close" onClick={() => setShowCompareResults(false)} aria-label="Đóng so sánh">
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="pd-compare-hero-grid">
                {compareSlots.map((item, slotIndex) => (
                  <article className={`pd-compare-hero-card ${!item ? "is-empty" : ""}`} key={`compare-hero-${slotIndex}`}>
                    {slotIndex > 0 && item && (
                      <button className="pd-compare-remove" onClick={() => handleRemoveCompareProduct(slotIndex - 1)}>
                        <FiX />
                      </button>
                    )}
                    {item ? (
                      <>
                        <img src={item.image} alt={item.name} className="pd-compare-hero-image" />
                        <p className="pd-compare-chip">{item.subtitle}</p>
                        <strong>{item.config}</strong>
                        <h4>{item.name}</h4>
                        <div className="pd-compare-price-line">
                          <span>{formatCurrency(item.price)}</span>
                          <small>{formatCurrency(item.oldPrice || item.price)}</small>
                        </div>
                        <p className="pd-compare-tradein">Giá lên đời: {formatCurrency(item.tradeInPrice)}</p>
                        <button className="pd-compare-buy-btn" onClick={() => navigate(`/product/${item.productId}`)}>
                          Mua ngay
                        </button>
                      </>
                    ) : (
                      <button className="pd-compare-empty-action" onClick={() => handleOpenComparePicker(slotIndex - 1)}>
                        <span>+</span>
                        <strong>Thêm sản phẩm để so sánh</strong>
                      </button>
                    )}
                  </article>
                ))}
              </div>

              <div className="pd-compare-table-wrap">
                <h4>Thông tin cơ bản</h4>
                <div className="pd-compare-table">
                  {primaryCompareItem.specs.map((spec, rowIndex) => (
                    <div className="pd-compare-table-row" key={spec.label}>
                      <div className="pd-compare-label">{spec.label}</div>
                      {compareSlots.map((item, slotIndex) => (
                        <div className="pd-compare-value" key={`${spec.label}-${item?.productId || `empty-${rowIndex}-${slotIndex}`}`}>
                          {item?.specs[rowIndex]?.value || "-"}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        <div className={`pd-compare-dock ${isCompareDockCollapsed ? "is-collapsed" : ""}`}>
          {isCompareDockCollapsed ? (
            <button className="pd-compare-dock-open" onClick={() => setIsCompareDockCollapsed(false)}>
              Mở so sánh ({selectedCompareCount}/{MAX_COMPARE_ITEMS})
            </button>
          ) : (
            <div className="pd-compare-dock-inner">
              <div className="pd-compare-dock-slots">
                {compareSlots.map((item, slotIndex) => (
                  <div className={`pd-compare-dock-slot ${!item ? "is-empty" : ""}`} key={`compare-slot-${slotIndex}`}>
                    {slotIndex > 0 && item && (
                      <button className="pd-compare-remove small" onClick={() => handleRemoveCompareProduct(slotIndex - 1)}>
                        <FiX />
                      </button>
                    )}
                    {item ? (
                      <>
                        <img src={item.image} alt={item.name} />
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.config}</p>
                        </div>
                      </>
                    ) : (
                      <button className="pd-compare-slot-btn" onClick={() => handleOpenComparePicker(slotIndex - 1)}>
                        <span>+</span>
                        <strong>Chọn sản phẩm so sánh</strong>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pd-compare-dock-actions">
                <p>Đã chọn {selectedCompareCount} sản phẩm</p>
                <div>
                  <button className="pd-compare-collapse-btn" onClick={() => setIsCompareDockCollapsed(true)}>
                    Thu gọn
                  </button>
                  <button className="pd-compare-submit-btn" onClick={handleCompareNow}>
                    So sánh
                  </button>
                </div>
              </div>
            </div>
          )}
          {compareMessage && <p className="pd-compare-message">{compareMessage}</p>}
        </div>
      </div>
    </>
  )
}