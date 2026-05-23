import { useMemo, useState, useEffect } from "react"
import { FiEdit, FiPlus, FiRefreshCcw, FiSave, FiTrash2, FiX } from "react-icons/fi"
import { buildApiUrl } from "../../config/api"
import { getAuthToken } from "../../lib/authToken"

export default function AdminBrand() {
  const [brands, setBrands] = useState([])
  const [brandName, setBrandName] = useState("")
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const API_BASE = buildApiUrl("/api/brands")
  const BRAND_MEDIA_API = buildApiUrl("/api/brand-media/upload-logo")
  const isEditing = editId !== null

  const brandStats = useMemo(() => {
    return {
      total: brands.length,
      withLogo: brands.filter((brand) => Boolean(brand.logo_url)).length,
      withoutLogo: brands.filter((brand) => !brand.logo_url).length,
    }
  }, [brands])  

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch(API_BASE)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải danh sách thương hiệu")
      }

      setBrands(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      console.error("Error fetching brands:", error)
      alert(`Lỗi tải thương hiệu: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setBrandName("")
    setLogoFile(null)
    setLogoPreview("")
    setEditId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const token = getAuthToken()
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      let uploadedLogoUrl = logoPreview || ""
      if (logoFile) {
        const uploadForm = new FormData()
        uploadForm.append("logo", logoFile)

        const uploadResponse = await fetch(BRAND_MEDIA_API, {
          method: "POST",
          headers,
          body: uploadForm,
        })

        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.message || "Upload logo thất bại")
        }

        uploadedLogoUrl = uploadData?.data?.logo_url || ""
      }

      const payload = {
        brand_name: brandName.trim(),
      }
      if (uploadedLogoUrl) {
        payload.logo_url = uploadedLogoUrl
      }

      const response = await fetch(editId ? `${API_BASE}/${editId}` : API_BASE, {
        method: editId ? "PUT" : "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lưu thương hiệu thất bại")
      }

      resetForm()
      fetchBrands()
    } catch (error) {
      console.error("Error saving brand:", error)
      alert(`Lỗi: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (brand) => {
    setBrandName(brand.brand_name || "")
    setLogoFile(null)
    setLogoPreview(brand.logo_url || "")
    setEditId(brand.brand_id)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa?")) {
      try {
        const token = getAuthToken()
        const headers = {}
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers,
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Xóa thương hiệu thất bại")
        }

        fetchBrands()
      } catch (error) {
        console.error("Error deleting brand:", error)
        alert(`Lỗi: ${error.message}`)
      }
    }
  }

  return (
    <div className="adm-split">
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>{isEditing ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}</h3>
          <span className="adm-pill">{isEditing ? "Edit" : "New"}</span>
        </div>

        <form className="adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-row adm-span2">
            <label>Tên thương hiệu *</label>
            <input
              type="text"
              placeholder="Ví dụ: ASUS, Lenovo, MSI"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
            />
          </div>

          <div className="adm-form-row adm-span2">
            <label>Logo thương hiệu (upload ảnh)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setLogoFile(file)
                setLogoPreview(file ? URL.createObjectURL(file) : "")
              }}
            />
          </div>

          {logoPreview ? (
            <div className="adm-branch-logo-preview adm-span2">
              <img src={logoPreview} alt="Logo preview" onError={(e) => { e.currentTarget.style.display = "none" }} />
              <span>Xem trước logo</span>
            </div>
          ) : null}

          <div className="adm-form-actions adm-span2">
            {isEditing ? (
              <button type="button" className="adm-btn" onClick={resetForm}>
                <FiX /> Hủy sửa
              </button>
            ) : null}
            <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
              {isEditing ? <FiSave /> : <FiPlus />}
              {submitting ? "Đang lưu..." : isEditing ? "Cập nhật thương hiệu" : "Thêm thương hiệu"}
            </button>
          </div>
        </form>

        <div className="adm-branch-stats">
          <div className="adm-kpi"><span>Tổng thương hiệu</span><strong>{brandStats.total}</strong></div>
          <div className="adm-kpi"><span>Có logo</span><strong>{brandStats.withLogo}</strong></div>
          <div className="adm-kpi"><span>Chưa có logo</span><strong>{brandStats.withoutLogo}</strong></div>
        </div>
      </section>

      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>Danh sách thương hiệu</h3>
          <div className="adm-row-actions">
            <span className="adm-pill adm-pill-muted">{brands.length} items</span>
            <button type="button" className="adm-btn adm-btn-light" onClick={fetchBrands} disabled={loading}>
              <FiRefreshCcw /> {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        <div className="adm-table-wrap adm-product-list-scroll">
          <table className="adm-table2">
            <thead>
              <tr>
                <th>ID</th>
                <th>Logo</th>
                <th>Tên thương hiệu</th>
                <th>Logo URL</th>
                <th>Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && brands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="adm-branch-empty-cell">Chưa có thương hiệu nào.</td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.brand_id}>
                    <td><strong>#{brand.brand_id}</strong></td>
                    <td>
                      {brand.logo_url ? (
                        <img className="adm-branch-logo" src={brand.logo_url} alt={brand.brand_name} />
                      ) : (
                        <span className="adm-chip">No Logo</span>
                      )}
                    </td>
                    <td className="adm-ellipsis">{brand.brand_name}</td>
                    <td className="adm-branch-url">{brand.logo_url || "-"}</td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-btn adm-btn-light" onClick={() => handleEdit(brand)}>
                          <FiEdit /> Sửa
                        </button>
                        <button type="button" className="adm-btn adm-btn-danger" onClick={() => handleDelete(brand.brand_id)}>
                          <FiTrash2 /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}