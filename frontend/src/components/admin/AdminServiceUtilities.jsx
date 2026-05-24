import { useEffect, useMemo, useState } from "react"
import { FiEdit, FiPlus, FiRefreshCcw, FiSave, FiTrash2, FiX } from "react-icons/fi"
import {
  createServiceUtility,
  deleteServiceUtility,
  getServiceUtilities,
  updateServiceUtility,
} from "../../services/serviceUtilityApi"

const createEmptyForm = () => ({
  id: "",
  service_name: "",
  provider_name: "TechMart",
  category_name: "Dịch vụ",
  short_description: "",
  feature_list_text: "",
  price_vnd: "",
  old_price_vnd: "",
  stock_capacity: "",
  sold_count: "0",
  image_url: "",
  is_active: true,
  is_featured: false,
})

const parseFeatureList = (value) =>
  String(value || "")
    .split(/\r?\n|,|\u2022/)
    .map((item) => item.trim())
    .filter(Boolean)

const formatPrice = (value) => Number(value || 0).toLocaleString("vi-VN")

export default function AdminServiceUtilities() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(createEmptyForm())
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const isEditing = Boolean(form.id)

  const loadItems = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await getServiceUtilities({ limit: 200 })
      setItems(Array.isArray(response?.data) ? response.data : [])
    } catch (err) {
      setError(err.message || "Không thể tải danh sách dịch vụ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items

    return items.filter((item) => {
      const source = [item.name, item.provider, item.category, item.description]
        .join(" ")
        .toLowerCase()
      return source.includes(keyword)
    })
  }, [items, search])

  const stats = useMemo(() => {
    const active = items.filter((item) => item.active).length
    const featured = items.filter((item) => item.featured).length
    return {
      total: items.length,
      active,
      inactive: Math.max(items.length - active, 0),
      featured,
    }
  }, [items])

  const resetForm = () => {
    setForm(createEmptyForm())
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage("")
    setError("")

    if (!form.service_name.trim()) {
      setError("Vui lòng nhập tên dịch vụ")
      return
    }

    const priceValue = Number(form.price_vnd)
    const stockValue = Number(form.stock_capacity)

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Giá dịch vụ không hợp lệ")
      return
    }

    if (!Number.isFinite(stockValue) || stockValue < 0) {
      setError("Số lượng khả dụng không hợp lệ")
      return
    }

    const payload = {
      service_name: form.service_name.trim(),
      provider_name: form.provider_name.trim() || "TechMart",
      category_name: form.category_name.trim() || "Dịch vụ",
      short_description: form.short_description.trim(),
      feature_list: parseFeatureList(form.feature_list_text),
      price_vnd: priceValue,
      old_price_vnd: form.old_price_vnd === "" ? null : Number(form.old_price_vnd),
      stock_capacity: stockValue,
      sold_count: form.sold_count === "" ? 0 : Number(form.sold_count),
      image_url: form.image_url.trim(),
      is_active: Boolean(form.is_active),
      is_featured: Boolean(form.is_featured),
    }

    if (payload.old_price_vnd !== null && (!Number.isFinite(payload.old_price_vnd) || payload.old_price_vnd < 0)) {
      setError("Giá cũ không hợp lệ")
      return
    }

    if (!Number.isFinite(payload.sold_count) || payload.sold_count < 0) {
      setError("Số lượt đã bán không hợp lệ")
      return
    }

    try {
      setSubmitting(true)
      if (isEditing) {
        await updateServiceUtility(form.id, payload)
        setMessage("Cập nhật dịch vụ thành công")
      } else {
        await createServiceUtility(payload)
        setMessage("Tạo dịch vụ thành công")
      }

      resetForm()
      await loadItems()
    } catch (err) {
      setError(err.message || "Không thể lưu dịch vụ")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    setMessage("")
    setError("")
    setForm({
      id: item.id,
      service_name: item.name || "",
      provider_name: item.provider || "TechMart",
      category_name: item.category || "Dịch vụ",
      short_description: item.description || "",
      feature_list_text: Array.isArray(item.features) ? item.features.join("\n") : "",
      price_vnd: String(item.price ?? ""),
      old_price_vnd: item.oldPrice != null ? String(item.oldPrice) : "",
      stock_capacity: String(item.stock ?? ""),
      sold_count: String(item.sold ?? 0),
      image_url: item.image || "",
      is_active: Boolean(item.active),
      is_featured: Boolean(item.featured),
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này?")) return

    try {
      setError("")
      setMessage("")
      await deleteServiceUtility(id)
      setMessage("Xóa dịch vụ thành công")
      if (String(form.id) === String(id)) {
        resetForm()
      }
      await loadItems()
    } catch (err) {
      setError(err.message || "Không thể xóa dịch vụ")
    }
  }

  return (
    <div className="adm-split">
      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>{isEditing ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ tiện ích"}</h3>
          <span className="adm-pill">{isEditing ? "Edit" : "New"}</span>
        </div>

        {message ? <p className="adm-muted" style={{ color: "#2f7a4f" }}>{message}</p> : null}
        {error ? <p className="adm-muted" style={{ color: "#dc2626" }}>{error}</p> : null}

        <form className="adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-row adm-span2">
            <label>Tên dịch vụ *</label>
            <input
              type="text"
              value={form.service_name}
              onChange={(event) => setForm((prev) => ({ ...prev, service_name: event.target.value }))}
              required
            />
          </div>

          <div className="adm-form-row">
            <label>Đơn vị cung cấp</label>
            <input
              type="text"
              value={form.provider_name}
              onChange={(event) => setForm((prev) => ({ ...prev, provider_name: event.target.value }))}
            />
          </div>

          <div className="adm-form-row">
            <label>Nhóm dịch vụ</label>
            <input
              type="text"
              value={form.category_name}
              onChange={(event) => setForm((prev) => ({ ...prev, category_name: event.target.value }))}
            />
          </div>

          <div className="adm-form-row">
            <label>Giá bán (VND) *</label>
            <input
              type="number"
              min="0"
              value={form.price_vnd}
              onChange={(event) => setForm((prev) => ({ ...prev, price_vnd: event.target.value }))}
              required
            />
          </div>

          <div className="adm-form-row">
            <label>Giá cũ (VND)</label>
            <input
              type="number"
              min="0"
              value={form.old_price_vnd}
              onChange={(event) => setForm((prev) => ({ ...prev, old_price_vnd: event.target.value }))}
            />
          </div>

          <div className="adm-form-row">
            <label>Số lượng khả dụng *</label>
            <input
              type="number"
              min="0"
              value={form.stock_capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, stock_capacity: event.target.value }))}
              required
            />
          </div>

          <div className="adm-form-row">
            <label>Số lượt đã bán</label>
            <input
              type="number"
              min="0"
              value={form.sold_count}
              onChange={(event) => setForm((prev) => ({ ...prev, sold_count: event.target.value }))}
            />
          </div>

          <div className="adm-form-row adm-span2">
            <label>Mô tả ngắn</label>
            <textarea
              value={form.short_description}
              onChange={(event) => setForm((prev) => ({ ...prev, short_description: event.target.value }))}
            />
          </div>

          <div className="adm-form-row adm-span2">
            <label>Danh sách tính năng (mỗi dòng 1 mục)</label>
            <textarea
              value={form.feature_list_text}
              onChange={(event) => setForm((prev) => ({ ...prev, feature_list_text: event.target.value }))}
            />
          </div>

          <div className="adm-form-row adm-span2">
            <label>Link hình ảnh</label>
            <input
              type="text"
              value={form.image_url}
              onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
            />
          </div>

          <div className="adm-inline">
            <label className="adm-check">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Đang hoạt động
            </label>
            <label className="adm-check">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => setForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
              />
              Nổi bật
            </label>
          </div>

          <div className="adm-form-actions adm-span2">
            {isEditing ? (
              <button type="button" className="adm-btn" onClick={resetForm}>
                <FiX /> Hủy sửa
              </button>
            ) : null}
            <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
              {isEditing ? <FiSave /> : <FiPlus />}
              {submitting ? "Đang lưu..." : isEditing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
            </button>
          </div>
        </form>

        <div className="adm-branch-stats">
          <div className="adm-kpi"><span>Tổng dịch vụ</span><strong>{stats.total}</strong></div>
          <div className="adm-kpi"><span>Đang hoạt động</span><strong>{stats.active}</strong></div>
          <div className="adm-kpi"><span>Nổi bật</span><strong>{stats.featured}</strong></div>
        </div>
      </section>

      <section className="adm-card adm-card-pad">
        <div className="adm-card-title">
          <h3>Danh sách dịch vụ</h3>
          <div className="adm-row-actions">
            <span className="adm-pill adm-pill-muted">{filteredItems.length} items</span>
            <button type="button" className="adm-btn adm-btn-light" onClick={loadItems} disabled={loading}>
              <FiRefreshCcw /> {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        <div className="adm-search-box">
          <input
            className="adm-search-input"
            placeholder="Tìm theo tên, nhà cung cấp, nhóm dịch vụ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="adm-table-wrap adm-product-list-scroll">
          <table className="adm-table2">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên dịch vụ</th>
                <th>Nhà cung cấp</th>
                <th>Nhóm</th>
                <th>Giá</th>
                <th>Tồn</th>
                <th>Trạng thái</th>
                <th>Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="adm-branch-empty-cell">Chưa có dịch vụ nào.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="adm-ellipsis">{item.name}</td>
                    <td>{item.provider || "-"}</td>
                    <td>{item.category || "-"}</td>
                    <td>{formatPrice(item.price)}đ</td>
                    <td>{item.stock}</td>
                    <td>
                      <span className={`adm-pill ${item.active ? "" : "adm-pill-muted"}`}>
                        {item.active ? "Hoạt động" : "Tạm ẩn"}
                      </span>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-btn" onClick={() => handleEdit(item)}>
                          <FiEdit /> Sửa
                        </button>
                        <button type="button" className="adm-btn adm-btn-danger" onClick={() => handleDelete(item.id)}>
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
