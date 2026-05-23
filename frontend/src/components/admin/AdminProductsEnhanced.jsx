import { useState, useRef } from "react"
import { FiEdit, FiLayers, FiInfo, FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi"

const toCurrency = (value) => `${Number(value).toLocaleString("vi-VN")}đ`

const DEVICE_TYPE_META = {
  LAPTOP: {
    label: "Laptop",
    commonHint: "Hiển thị bộ trường laptop quen thuộc, phù hợp với cấu hình truyền thống.",
    infoFields: ["cpu", "cpuBenchmarkScore", "gpu", "ram", "ramType", "storage", "screenSize", "weightKg", "os"],
    variantFields: ["cpu", "cpuBenchmarkScore", "gpu", "ram", "ramType", "storage"],
  },
  PHONE: {
    label: "Điện thoại",
    commonHint: "Chỉ hiện các trường đúng ngữ cảnh điện thoại như pin, màn hình, kết nối và cảm biến.",
    infoFields: ["screenSize", "batteryCapacityMah", "refreshRateHz", "chargingPort", "connectivity", "waterResistance", "sensors", "os"],
    variantFields: ["cpu", "cpuBenchmarkScore", "gpu", "ram", "ramType", "storage"],
  },
  TABLET: {
    label: "Tablet",
    commonHint: "Hiển thị thông số tablet, ưu tiên màn hình, pin và bộ nhớ.",
    infoFields: ["screenSize", "batteryCapacityMah", "refreshRateHz", "chargingPort", "connectivity", "waterResistance", "sensors", "os", "ram", "storage"],
    variantFields: ["cpu", "cpuBenchmarkScore", "gpu", "ram", "ramType", "storage"],
  },
  WATCH: {
    label: "Đồng hồ",
    commonHint: "Rút gọn form cho đồng hồ thông minh: pin, cảm biến, kháng nước và kết nối.",
    infoFields: ["batteryCapacityMah", "chargingPort", "connectivity", "waterResistance", "sensors", "screenSize", "os"],
    variantFields: ["cpu", "ram", "storage"],
  },
  AUDIO: {
    label: "Thiết bị âm thanh",
    commonHint: "Chỉ giữ các trường liên quan đến âm thanh, kết nối và pin.",
    infoFields: ["connectivity", "speakerType", "batteryCapacityMah", "chargingPort", "waterResistance", "os"],
    variantFields: ["gpu", "ram", "storage"],
  },
  ACCESSORY: {
    label: "Phụ kiện",
    commonHint: "Dùng bộ trường rút gọn cho phụ kiện để form dễ nhập hơn.",
    infoFields: ["connectivity", "chargingPort", "waterResistance", "os"],
    variantFields: ["storage", "ram"],
  },
  OTHER: {
    label: "Khác",
    commonHint: "Dành cho sản phẩm không thuộc các nhóm cố định.",
    infoFields: ["screenSize", "batteryCapacityMah", "connectivity", "chargingPort", "waterResistance", "os"],
    variantFields: ["cpu", "ram", "storage"],
  },
}

const VARIANT_FIELD_META = {
  cpu: { label: "CPU / Chipset", placeholder: "VD: Intel Core i7-13620H" },
  cpuBenchmarkScore: { label: "CPU Benchmark Score", placeholder: "VD: 12345" },
  gpu: { label: "GPU", placeholder: "VD: RTX 4060 8GB" },
  ram: { label: "RAM (GB) *", placeholder: "VD: 16" },
  ramType: { label: "Loại RAM", type: "select", options: ["DDR4", "DDR5", "LPDDR4X", "LPDDR5", "LPDDR5X"] },
  storage: { label: "Bộ nhớ / Ổ cứng *", placeholder: "VD: 512" },
}

const getDeviceMeta = (deviceType) => DEVICE_TYPE_META[deviceType] || DEVICE_TYPE_META.LAPTOP

const getStatusMeta = (status, stock) => {
  if (status === "DISCONTINUED") {
    return { tone: "danger", text: "Ngừng kinh doanh" }
  }

  if (status === "COMING_SOON") {
    return { tone: "warn", text: "Sắp mở bán" }
  }

  if (status === "OUT_OF_STOCK" || Number(stock) === 0) {
    return { tone: "danger", text: "Hết hàng" }
  }

  if (Number(stock) <= 10) {
    return { tone: "warn", text: "Sắp hết" }
  }

  return { tone: "ok", text: "Còn hàng" }
}

export default function AdminProducts({ 
  isScopedAdmin = false,
  scopedDeviceType = null,
  scopedLabel = "",
  filteredProducts, 
  searchTerm, 
  setSearchTerm,
  productForm, 
  setProductForm, 
  editingProductId, 
  handleProductSubmit,
  handleEditProduct,
  handleDeleteProduct,
  productNotice,
  clearProductNotice,
  brands,
  categories,
  loadingBrands,
  loadingCategories,
  productVariants,
  editingVariantIndex,
  setEditingVariantIndex,
  variantForm,
  setVariantForm,
  handleAddVariant,
  handleEditVariant,
  handleDeleteVariant,
}) {
  const [activeTab, setActiveTab] = useState("info")
  const variantFormRef = useRef(null)
  const deviceType = productForm.deviceType || "LAPTOP"
  const deviceMeta = getDeviceMeta(deviceType)
  const visibleInfoFields = new Set(deviceMeta.infoFields)
  const visibleVariantFields = deviceMeta.variantFields

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const previewUrls = files.map((file) => URL.createObjectURL(file))
    setProductForm((prev) => ({ 
      ...prev, 
      imageFiles: files,
      imagePreviews: previewUrls,
      image: previewUrls[0] || prev.image
    }))
  }

  const handleVariantImageUpload = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const previewUrls = files.map((file) => URL.createObjectURL(file))
    setVariantForm((prev) => ({
      ...prev,
      imageFiles: files,
      imagePreviews: previewUrls,
    }))
  }

  const handleEditVariantAndScroll = (index) => {
    setActiveTab("variants")
    handleEditVariant(index)
    setTimeout(() => {
      variantFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  const emptyVariantFormLocal = {
    sku: "", cpu: "", cpuBenchmarkScore: "", gpu: "", ram: "", ramType: "", storage: "",
    color: "", originalPrice: "", discountPrice: "", stock: "",
    status: "IN_STOCK",
    imageFiles: [], imagePreviews: [],
  }

  const cancelEditVariant = () => {
    setEditingVariantIndex(-1)
    setVariantForm(emptyVariantFormLocal)
  }

  const seedVariantDraftFromProductForm = () => {
    if (editingProductId) return

    const normalizedSku = String(productForm.sku || '').trim()
    if (normalizedSku && !String(variantForm.sku || '').trim()) {
      setVariantForm((prev) => ({
        ...prev,
        sku: normalizedSku,
      }))
    }

    const normalizedColor = String(productForm.color || '').trim()
    if (normalizedColor && !String(variantForm.color || '').trim()) {
      setVariantForm((prev) => ({
        ...prev,
        color: normalizedColor,
      }))
    }
  }

  const handleInfoStepSubmit = (event) => {
    // Nếu đã nhập đủ thông tin ở tab sản phẩm, cho phép hoàn tất ngay.
    handleProductSubmit(event)
  }

  const openVariantTab = () => {
    seedVariantDraftFromProductForm()
    setActiveTab("variants")
  }

  return (
    <div className="adm-split">
      {/* ===== LEFT: Form card with tabs ===== */}
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>{editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
          <span className="adm-pill">{editingProductId ? "Edit" : "New"}</span>
        </div>

        {productNotice ? (
          <div className={`adm-alert adm-alert-${productNotice.type === "success" ? "success" : "error"} adm-alert-floating`} role="status" aria-live="polite">
            <span>{productNotice.message}</span>
            <button type="button" className="adm-alert-close" onClick={clearProductNotice}>×</button>
          </div>
        ) : null}

        {/* Tab bar */}
        <div className="adm-tabs">
          <button
            type="button"
            className={`adm-tab ${activeTab === "info" ? "adm-tab-active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <FiInfo /> Thông tin sản phẩm
          </button>
          <button
            type="button"
            className={`adm-tab ${activeTab === "variants" ? "adm-tab-active" : ""}`}
            onClick={openVariantTab}
          >
            <FiLayers />
            Quản lý phiên bản
            {productVariants.length > 0 && (
              <span className="adm-tab-badge">{productVariants.length}</span>
            )}
          </button>
        </div>

        {/* ===== TAB 1: Product info ===== */}
        {activeTab === "info" && (
          <form className="adm-form" onSubmit={handleInfoStepSubmit}>
            <div className="adm-form-row adm-span2">
              <label>Tên sản phẩm *</label>
              <input
                placeholder="VD: ASUS TUF Gaming F15"
                value={productForm.name}
                onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="adm-form-row">
              <label>Tên phiên bản {editingProductId ? "" : "*"}</label>
              <input
                placeholder="VD: ASUS-TUF-F15-DEFAULT"
                value={productForm.sku}
                onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                required={!editingProductId}
              />
            </div>

            <div className="adm-form-row">
              <label>Màu</label>
              <input
                placeholder="VD: Đen"
                value={productForm.color}
                onChange={(e) => setProductForm((prev) => ({ ...prev, color: e.target.value }))}
              />
            </div>

            <div className="adm-form-row">
              <label>Thương hiệu *</label>
              <select
                value={productForm.brand_id}
                onChange={(e) => {
                  const selectedBrand = brands.find(b => b.brand_id === parseInt(e.target.value))
                  setProductForm((prev) => ({ 
                    ...prev, 
                    brand_id: e.target.value,
                    brand: selectedBrand?.brand_name || ''
                  }))
                }}
                required
                disabled={loadingBrands}
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map(brand => (
                  <option key={brand.brand_id} value={brand.brand_id}>{brand.brand_name}</option>
                ))}
              </select>
            </div>

            <div className="adm-form-row">
              <label>Danh mục *</label>
              <select
                value={productForm.category_id}
                onChange={(e) => {
                  const selectedCategory = categories.find(c => c.category_id === parseInt(e.target.value))
                  setProductForm((prev) => ({ 
                    ...prev, 
                    category_id: e.target.value,
                    series: selectedCategory?.category_name || ''
                  }))
                }}
                required
                disabled={loadingCategories}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(category => (
                  <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
                ))}
              </select>
            </div>

            <div className="adm-form-row">
              <label>Loại thiết bị *</label>
              <select
                value={productForm.deviceType}
                onChange={(e) => setProductForm((prev) => ({ ...prev, deviceType: e.target.value }))}
                required
                disabled={isScopedAdmin}
              >
                {isScopedAdmin && scopedDeviceType ? (
                  <option value={scopedDeviceType}>{scopedLabel || scopedDeviceType}</option>
                ) : (
                  <>
                    <option value="LAPTOP">Laptop</option>
                    <option value="PHONE">Điện thoại</option>
                    <option value="TABLET">Tablet</option>
                    <option value="WATCH">Đồng hồ</option>
                    <option value="AUDIO">Thiết bị âm thanh</option>
                    <option value="ACCESSORY">Phụ kiện</option>
                    <option value="OTHER">Khác</option>
                  </>
                )}
              </select>
            </div>

            <div className="adm-form-row adm-span2">
              <label>Điểm nổi bật</label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Màn hình 165Hz, tản nhiệt tốt, bàn phím RGB"
                value={productForm.highlightFeatures}
                onChange={(e) => setProductForm((prev) => ({ ...prev, highlightFeatures: e.target.value, features: e.target.value.split(/\r?\n|,|•/).map((item) => item.trim()).filter(Boolean) }))}
              />
            </div>

            <div className="adm-form-row adm-span2">
              <label>Mô tả sản phẩm (HTML hoặc văn bản)</label>
              <textarea
                rows={5}
                placeholder="<p>Laptop gaming hiệu năng cao...</p>"
                value={productForm.description}
                onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="adm-form-row adm-span2">
              <small style={{ color: "#8a6d3b", fontWeight: 600 }}>
                {deviceMeta.commonHint}
              </small>
            </div>

            <div className="adm-form-row">
              <label>Giá bán *</label>
              <input type="number" placeholder="Tự lấy từ phiên bản đầu tiên" value={productForm.price} onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))} />
            </div>

            <div className="adm-form-row">
              <label>Giá cũ</label>
              <input type="number" placeholder="24490000" value={productForm.oldPrice} onChange={(e) => setProductForm((prev) => ({ ...prev, oldPrice: e.target.value }))} />
            </div>

            {visibleInfoFields.has("cpu") && (
              <div className="adm-form-row">
                <label>{deviceType === "PHONE" || deviceType === "TABLET" ? "Chipset / CPU" : "CPU"}</label>
                <input placeholder="Ưu tiên lấy từ phiên bản" value={productForm.cpu} onChange={(e) => setProductForm((prev) => ({ ...prev, cpu: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("cpuBenchmarkScore") && (
              <div className="adm-form-row">
                <label>CPU Benchmark Score</label>
                <input placeholder="Ưu tiên lấy từ phiên bản" value={productForm.cpuBenchmarkScore} onChange={(e) => setProductForm((prev) => ({ ...prev, cpuBenchmarkScore: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("gpu") && (
              <div className="adm-form-row">
                <label>{deviceType === "PHONE" ? "GPU / Bộ xử lý đồ họa" : "GPU"}</label>
                <input placeholder="Ưu tiên lấy từ phiên bản" value={productForm.graphics} onChange={(e) => setProductForm((prev) => ({ ...prev, graphics: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("ram") && (
              <div className="adm-form-row">
                <label>RAM</label>
                <input type="text" placeholder="Ưu tiên lấy từ phiên bản" value={productForm.ram} onChange={(e) => setProductForm((prev) => ({ ...prev, ram: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("ramType") && (
              <div className="adm-form-row">
                <label>Loại RAM</label>
                <input type="text" placeholder="Ưu tiên lấy từ phiên bản" value={productForm.ramType} onChange={(e) => setProductForm((prev) => ({ ...prev, ramType: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("storage") && (
              <div className="adm-form-row">
                <label>{deviceType === "PHONE" || deviceType === "TABLET" ? "Bộ nhớ trong" : "Ổ cứng"}</label>
                <input type="text" placeholder="Ưu tiên lấy từ phiên bản" value={productForm.storage} onChange={(e) => setProductForm((prev) => ({ ...prev, storage: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("screenSize") && (
              <div className="adm-form-row">
                <label>Màn hình</label>
                <input type="text" placeholder={deviceType === "PHONE" ? "6.7 inch AMOLED 120Hz" : "15.6 inch FHD IPS 144Hz"} value={productForm.screenSize} onChange={(e) => setProductForm((prev) => ({ ...prev, screenSize: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("weightKg") && (
              <div className="adm-form-row">
                <label>Trọng lượng (kg)</label>
                <input type="number" step="0.1" min="0.1" placeholder="VD: 1.8" value={productForm.weightKg} onChange={(e) => setProductForm((prev) => ({ ...prev, weightKg: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("os") && (
              <div className="adm-form-row">
                <label>Hệ điều hành</label>
                <input placeholder={deviceType === "PHONE" ? "Android 15" : "Windows 11 Home"} value={productForm.os} onChange={(e) => setProductForm((prev) => ({ ...prev, os: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("batteryCapacityMah") && (
              <div className="adm-form-row">
                <label>Pin (mAh)</label>
                <input type="number" placeholder="VD: 5000" value={productForm.batteryCapacityMah} onChange={(e) => setProductForm((prev) => ({ ...prev, batteryCapacityMah: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("refreshRateHz") && (
              <div className="adm-form-row">
                <label>Tần số quét (Hz)</label>
                <input type="number" placeholder="VD: 120" value={productForm.refreshRateHz} onChange={(e) => setProductForm((prev) => ({ ...prev, refreshRateHz: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("chargingPort") && (
              <div className="adm-form-row">
                <label>Cổng sạc/Kết nối</label>
                <input placeholder="VD: USB-C" value={productForm.chargingPort} onChange={(e) => setProductForm((prev) => ({ ...prev, chargingPort: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("connectivity") && (
              <div className="adm-form-row">
                <label>Kết nối</label>
                <input placeholder={deviceType === "PHONE" ? "5G, Wi-Fi 6E, BT 5.3" : "Wi-Fi 6, BT 5.3"} value={productForm.connectivity} onChange={(e) => setProductForm((prev) => ({ ...prev, connectivity: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("waterResistance") && (
              <div className="adm-form-row">
                <label>Kháng nước</label>
                <input placeholder="VD: IP68" value={productForm.waterResistance} onChange={(e) => setProductForm((prev) => ({ ...prev, waterResistance: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("sensors") && (
              <div className="adm-form-row">
                <label>Cảm biến</label>
                <input placeholder={deviceType === "WATCH" ? "Gia tốc, nhịp tim, SpO2" : "Gia tốc, nhịp tim"} value={productForm.sensors} onChange={(e) => setProductForm((prev) => ({ ...prev, sensors: e.target.value }))} />
              </div>
            )}

            {visibleInfoFields.has("speakerType") && (
              <div className="adm-form-row">
                <label>Loại loa</label>
                <input placeholder="VD: Stereo" value={productForm.speakerType} onChange={(e) => setProductForm((prev) => ({ ...prev, speakerType: e.target.value }))} />
              </div>
            )}

            <div className="adm-form-row adm-span2">
              <label>Thông số riêng theo loại thiết bị (JSON object)</label>
              <textarea
                rows={4}
                placeholder={
                  deviceType === "PHONE"
                    ? '{"chipset":"Snapdragon 8 Gen 3","network_support":"5G"}'
                    : deviceType === "WATCH"
                      ? '{"case_material":"Titan","strap_material":"Silicone"}'
                      : '{"feature":"Giá trị tùy chỉnh"}'
                }
                value={productForm.deviceSpecificSpecsText}
                onChange={(e) => setProductForm((prev) => ({ ...prev, deviceSpecificSpecsText: e.target.value }))}
              />
            </div>

            <div className="adm-form-row-3col">
              <div className="adm-form-item">
                <label>Số lượng kho</label>
                <input type="number" placeholder="Ưu tiên từ phiên bản" value={productForm.stock} onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))} />
              </div>
              <label className="adm-check-item">
                <input type="checkbox" checked={productForm.hasAI} onChange={(e) => setProductForm((prev) => ({ ...prev, hasAI: e.target.checked }))} />
                <span>Công nghệ AI</span>
              </label>
              <label className="adm-check-item">
                <input type="checkbox" checked={productForm.newArrival} onChange={(e) => setProductForm((prev) => ({ ...prev, newArrival: e.target.checked }))} />
                <span>Hàng mới về</span>
              </label>
            </div>

            <div className="adm-form-row adm-span2">
              <label>Upload hình ảnh sản phẩm *</label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} required={!editingProductId} />
              {productForm.imagePreviews?.length ? (
                <div className="adm-image-preview-grid">
                  {productForm.imagePreviews.map((preview, index) => (
                    <div key={`${preview}-${index}`} className="adm-image-preview">
                      <img src={preview} alt={`Ảnh sản phẩm ${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="adm-form-actions adm-span2">
              {editingProductId && (
                <button
                  type="button"
                  className="adm-btn adm-btn-light"
                  style={{ marginRight: 8 }}
                  onClick={openVariantTab}
                >
                  <FiLayers /> Quản lý phiên bản ({productVariants.length})
                </button>
              )}
              {!editingProductId && (
                <button
                  type="button"
                  className="adm-btn adm-btn-light"
                  style={{ marginRight: 8 }}
                  onClick={openVariantTab}
                >
                  <FiLayers /> Thêm nhiều phiên bản
                </button>
              )}
              <button className="adm-btn adm-btn-primary" type="submit">
                {editingProductId ? <FiSave /> : <FiPlus />}
                {editingProductId ? "Cập nhật sản phẩm" : "Hoàn tất thêm sản phẩm"}
              </button>
            </div>
          </form>
        )}

        {/* ===== TAB 2: Variant management ===== */}
        {activeTab === "variants" && (
          <div className="adm-variant-tab-layout">

            {/* -- Variant form -- */}
            <div className="adm-variant-form-section" ref={variantFormRef}>
              <h4 className="adm-variant-section-title">
                {editingVariantIndex >= 0
                  ? `✏️ Đang sửa phiên bản: ${productVariants[editingVariantIndex]?.sku || "#" + (editingVariantIndex + 1)}`
                  : " Thêm phiên bản mới"}
              </h4>

              <div className="adm-variant-grid">
                <div>
                  <label>Tên phiên bản </label>
                  <input type="text" placeholder={deviceType === "PHONE" ? "VD: IPHONE-15-PRO-256" : "VD: ASUS-TUF-F15-BLK-16-512"} value={variantForm.sku} onChange={(e) => setVariantForm((prev) => ({ ...prev, sku: e.target.value }))} />
                </div>
                <div>
                  <label>Màu (color_name) *</label>
                  <input type="text" placeholder="VD: Đen" value={variantForm.color} onChange={(e) => setVariantForm((prev) => ({ ...prev, color: e.target.value }))} />
                </div>
                {visibleVariantFields.includes("cpu") && (
                  <div>
                    <label>{deviceType === "PHONE" || deviceType === "TABLET" ? "Chipset / CPU" : "CPU"}</label>
                    <input type="text" placeholder={deviceType === "PHONE" ? "VD: Snapdragon 8 Gen 3" : "VD: Intel Core i7-13620H"} value={variantForm.cpu} onChange={(e) => setVariantForm((prev) => ({ ...prev, cpu: e.target.value }))} />
                  </div>
                )}
                {visibleVariantFields.includes("cpuBenchmarkScore") && (
                  <div>
                    <label>CPU Benchmark Score</label>
                    <input type="text" placeholder="VD: 12345" value={variantForm.cpuBenchmarkScore} onChange={(e) => setVariantForm((prev) => ({ ...prev, cpuBenchmarkScore: e.target.value }))} />
                  </div>
                )}
                {visibleVariantFields.includes("gpu") && (
                  <div>
                    <label>{deviceType === "PHONE" ? "GPU / Bộ xử lý đồ họa" : "GPU"}</label>
                    <input type="text" placeholder={deviceType === "PHONE" ? "VD: Adreno 750" : "VD: RTX 4060 8GB"} value={variantForm.gpu} onChange={(e) => setVariantForm((prev) => ({ ...prev, gpu: e.target.value }))} />
                  </div>
                )}
                {visibleVariantFields.includes("ram") && (
                  <div>
                    <label>RAM (GB) *</label>
                    <input type="text" placeholder={deviceType === "WATCH" ? "VD: 2" : "VD: 16"} value={variantForm.ram} onChange={(e) => setVariantForm((prev) => ({ ...prev, ram: e.target.value }))} />
                  </div>
                )}
                {visibleVariantFields.includes("ramType") && (
                  <div>
                    <label>Loại RAM</label>
                    <select value={variantForm.ramType} onChange={(e) => setVariantForm((prev) => ({ ...prev, ramType: e.target.value }))}>
                      <option value="">-- Chọn loại RAM --</option>
                      <option value="DDR4">DDR4</option>
                      <option value="DDR5">DDR5</option>
                      <option value="LPDDR4X">LPDDR4X</option>
                      <option value="LPDDR5">LPDDR5</option>
                      <option value="LPDDR5X">LPDDR5X</option>
                    </select>
                  </div>
                )}
                {visibleVariantFields.includes("storage") && (
                  <div>
                    <label>{deviceType === "PHONE" || deviceType === "TABLET" ? "Bộ nhớ trong (GB) *" : "Ổ cứng (GB) *"}</label>
                    <input type="text" placeholder={deviceType === "PHONE" ? "VD: 256" : "VD: 512"} value={variantForm.storage} onChange={(e) => setVariantForm((prev) => ({ ...prev, storage: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label>Tồn kho *</label>
                  <input type="number" placeholder="VD: 10" value={variantForm.stock} onChange={(e) => setVariantForm((prev) => ({ ...prev, stock: e.target.value }))} />
                </div>
                <div>
                  <label>Trạng thái *</label>
                  <select value={variantForm.status} onChange={(e) => setVariantForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="IN_STOCK">Còn hàng</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                    <option value="COMING_SOON">Sắp mở bán</option>
                    <option value="DISCONTINUED">Ngừng kinh doanh</option>
                  </select>
                </div>
                <div>
                  <label>Giá gốc *</label>
                  <input type="number" placeholder="VD: 25000000" value={variantForm.originalPrice} onChange={(e) => setVariantForm((prev) => ({ ...prev, originalPrice: e.target.value }))} />
                </div>
                <div>
                  <label>Giá khuyến mãi</label>
                  <input type="number" placeholder="VD: 22990000" value={variantForm.discountPrice} onChange={(e) => setVariantForm((prev) => ({ ...prev, discountPrice: e.target.value }))} />
                </div>
                <div className="adm-span2">
                  <label>Thông số mở rộng phiên bản (JSON object)</label>
                  <textarea
                    rows={3}
                    placeholder={
                      deviceType === "PHONE"
                        ? '{"camera_main":"50MP","battery_mah":5000}'
                        : deviceType === "WATCH"
                          ? '{"case_material":"Titan","strap_material":"Silicone"}'
                          : '{"case_material":"Titan"}'
                    }
                    value={variantForm.extraSpecsJsonText || ""}
                    onChange={(e) => setVariantForm((prev) => ({ ...prev, extraSpecsJsonText: e.target.value }))}
                  />
                </div>
                <div className="adm-span2">
                  <label>Ảnh phiên bản * (tối thiểu 1 ảnh)</label>
                  <input type="file" accept="image/*" multiple onChange={handleVariantImageUpload} />
                  {variantForm.imagePreviews?.length ? (
                    <div className="adm-image-preview-grid">
                      {variantForm.imagePreviews.map((preview, index) => (
                        <div key={`${preview}-${index}`} className="adm-image-preview">
                          <img src={preview} alt={`Ảnh phiên bản ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <small style={{ color: "#b91c1c", fontWeight: 600 }}>Vui lòng thêm ít nhất 1 ảnh cho phiên bản này.</small>
                  )}
                </div>
              </div>

              <div className="adm-variant-actions">
                <button type="button" className="adm-btn adm-btn-primary" onClick={handleAddVariant}>
                  <FiSave /> {editingVariantIndex >= 0 ? "Lưu chỉnh sửa" : "Thêm phiên bản"}
                </button>
                {editingVariantIndex >= 0 && (
                  <button type="button" className="adm-btn" onClick={cancelEditVariant}>
                    <FiX /> Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </div>

            {/* -- Variant list -- */}
            <div className="adm-variant-list-section">
              <h4 className="adm-variant-section-title">
                Danh sách phiên bản
                {productVariants.length > 0 && <span className="adm-tab-badge" style={{ marginLeft: 8 }}>{productVariants.length}</span>}
              </h4>
              {productVariants.length === 0 ? (
                <div className="adm-empty-state">Chưa có phiên bản nào. Điền form trên để thêm.</div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table2">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Màu</th>
                        <th>CPU</th>
                        <th>RAM</th>
                        <th>SSD</th>
                        <th>Giá gốc</th>
                        <th>Giá KM</th>
                        <th>Kho</th>
                        <th>Trạng thái</th>
                        <th>Ảnh</th>
                        <th>Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productVariants.map((variant, index) => (
                        <tr
                          key={index}
                          className={editingVariantIndex === index ? "adm-row-editing" : ""}
                        >
                          <td><span className="adm-chip">{variant.sku || "-"}</span></td>
                          <td><strong>{variant.color}</strong></td>
                          <td className="adm-ellipsis" style={{ maxWidth: 140 }}>{variant.cpu}</td>
                          <td>{variant.ram}{variant.ramType ? ` ${variant.ramType}` : ""}</td>
                          <td>{variant.storage}</td>
                          <td className="adm-money">{toCurrency(variant.originalPrice)}</td>
                          <td className="adm-money">{variant.discountPrice ? toCurrency(variant.discountPrice) : "-"}</td>
                          <td>{variant.stock}</td>
                          <td><span className={`adm-status2 ${getStatusMeta(variant.status, variant.stock).tone}`}>{getStatusMeta(variant.status, variant.stock).text}</span></td>
                          <td>{variant.imageFiles?.length || variant.imagePreviews?.length || 0}</td>
                          <td>
                            <div className="adm-row-actions adm-row-actions-compact">
                              <button
                                type="button"
                                className={`adm-btn ${editingVariantIndex === index ? "adm-btn-primary" : "adm-btn-light"}`}
                                onClick={() => handleEditVariantAndScroll(index)}
                              >
                                <FiEdit /> Sửa
                              </button>
                              <button type="button" className="adm-btn adm-btn-danger" onClick={() => handleDeleteVariant(index)}>
                                <FiTrash2 /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="adm-form-actions" style={{ marginTop: 16 }}>
                {!editingProductId && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-light"
                    onClick={() => setActiveTab("info")}
                  >
                    <FiInfo /> Quay lại thông tin sản phẩm
                  </button>
                )}
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={() => handleProductSubmit()}
                >
                  <FiSave /> {editingProductId ? "Lưu cập nhật sản phẩm" : "Hoàn tất thêm sản phẩm"}
                </button>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* ===== RIGHT: Product list ===== */}
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>Danh sách sản phẩm</h3>
          <span className="adm-pill adm-pill-muted">{filteredProducts.length} items</span>
        </div>

        <div className="adm-search-box">
          <input 
            type="text" 
            placeholder="🔍 Tìm kiếm theo tên, thương hiệu, dòng sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="adm-search-input"
          />
        </div>

        <div className="adm-table-wrap adm-product-list-scroll">
          <table className="adm-table2">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hình</th>
                <th>Tên</th>
                <th>Hãng</th>
                <th>Dòng</th>
                <th>Giá</th>
                <th>Kho</th>
                <th>Trạng thái</th>
                <th>Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const statusMeta = getStatusMeta(product.status, product.stock)
                return (
                  <tr key={product.id}>
                    <td><strong>#{product.id}</strong></td>
                    <td><img src={product.image} alt={product.name} className="adm-product-img" /></td>
                    <td className="adm-ellipsis">{product.name}</td>
                    <td>{product.brand}</td>
                    <td><span className="adm-chip">{product.series}</span></td>
                    <td className="adm-money">{toCurrency(product.price)}</td>
                    <td>{product.stock}</td>
                    <td><span className={`adm-status2 ${statusMeta.tone}`}>{statusMeta.text}</span></td>
                    <td>
                      <div className="adm-row-actions">
                        <button className="adm-btn adm-btn-light" onClick={() => { handleEditProduct(product); setActiveTab("info") }}><FiEdit /> Sửa</button>
                        <button className="adm-btn adm-btn-danger" onClick={() => handleDeleteProduct(product.id)}><FiTrash2 /> {product.status === "DISCONTINUED" ? "Đã ngừng" : "Ngừng bán"}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
