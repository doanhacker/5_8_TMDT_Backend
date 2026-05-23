import { useMemo, useState } from "react"
import { FiEdit2, FiPlus, FiRefreshCcw, FiSearch, FiTrash2 } from "react-icons/fi"
import "../../styles/AdminCategories.css"

export default function AdminCategories({
  categories = [],
  loadingCategories = false,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [keyword, setKeyword] = useState("")
  const [formData, setFormData] = useState({
    category_id: "",
    category_name: "",
    parent_category_id: "",
  })

  const parentCategories = useMemo(() => {
    return categories.filter((item) => !item.parent_category_id)
  }, [categories])

  const filteredCategories = useMemo(() => {
    if (!keyword.trim()) return categories
    return categories.filter((item) =>
      String(item.category_name || "")
        .toLowerCase()
        .includes(keyword.toLowerCase())
    )
  }, [categories, keyword])

  const totalCategories = categories.length
  const totalParents = categories.filter((item) => !item.parent_category_id).length
  const totalChildren = categories.filter((item) => !!item.parent_category_id).length

  const getCategoryNameById = (id) => {
    const found = categories.find((item) => String(item.category_id) === String(id))
    return found ? found.category_name : "Không có"
  }

  const resetForm = () => {
    setFormData({
      category_id: "",
      category_name: "",
      parent_category_id: "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const name = formData.category_name.trim()
    if (!name) {
      alert("Vui lòng nhập tên danh mục")
      return
    }

    const payload = {
      category_name: name,
      parent_category_id: formData.parent_category_id || null,
    }

    try {
      if (formData.category_id) {
        await onUpdateCategory?.(formData.category_id, payload)
      } else {
        await onCreateCategory?.(payload)
      }
      resetForm()
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi lưu danh mục")
    }
  }

  const handleEdit = (category) => {
    setFormData({
      category_id: category.category_id,
      category_name: category.category_name || "",
      parent_category_id: category.parent_category_id || "",
    })
  }

  const handleDelete = async (categoryId) => {
    const hasChild = categories.some(
      (item) => String(item.parent_category_id) === String(categoryId)
    )

    if (hasChild) {
      alert("Không thể xóa danh mục cha vì đang có danh mục con.")
      return
    }

    const confirmDelete = window.confirm("Bạn có chắc muốn xóa danh mục này?")
    if (!confirmDelete) return

    try {
      await onDeleteCategory?.(categoryId)
      if (String(formData.category_id) === String(categoryId)) {
        resetForm()
      }
    } catch (error) {
      alert(error.message || "Không thể xóa danh mục")
    }
  }

  return (
    <div className="catm-page">
      <div className="catm-stats">
        <div className="catm-stat-card catm-stat-card-total">
          <span>Tổng danh mục</span>
          <strong>{totalCategories}</strong>
        </div>
        <div className="catm-stat-card catm-stat-card-parent">
          <span>Danh mục cha</span>
          <strong>{totalParents}</strong>
        </div>
        <div className="catm-stat-card catm-stat-card-child">
          <span>Danh mục con</span>
          <strong>{totalChildren}</strong>
        </div>
      </div>

      <div className="catm-grid">
        <section className="catm-card catm-form-card">
          <div className="catm-head">
            <h3>{formData.category_id ? "Cập nhật danh mục" : "Thêm danh mục"}</h3>
            <p>{formData.category_id ? "Điều chỉnh thông tin danh mục hiện có" : "Tạo danh mục cha hoặc danh mục con mới"}</p>
          </div>

          <form className="catm-form" onSubmit={handleSubmit}>
            <div className="catm-form-group">
              <label>Tên danh mục</label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                placeholder="Nhập tên danh mục"
              />
            </div>

            <div className="catm-form-group">
              <label>Danh mục cha</label>
              <select
                value={formData.parent_category_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parent_category_id: e.target.value,
                  }))
                }
              >
                <option value="">-- Danh mục gốc --</option>
                {parentCategories.map((item) => (
                  <option
                    key={item.category_id}
                    value={item.category_id}
                    disabled={String(item.category_id) === String(formData.category_id)}
                  >
                    {item.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="catm-actions">
              <button type="submit" className="catm-btn catm-btn-primary">
                <FiPlus />
                <span>{formData.category_id ? "Cập nhật" : "Thêm danh mục"}</span>
              </button>

              <button
                type="button"
                className="catm-btn catm-btn-secondary"
                onClick={resetForm}
              >
                <FiRefreshCcw />
                <span>Làm mới</span>
              </button>
            </div>
          </form>
        </section>

        <section className="catm-card catm-table-card">
          <div className="catm-head catm-head-row">
            <h3>Danh sách danh mục</h3>

            <div className="catm-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          {loadingCategories ? (
            <div className="catm-loading">
              <p>Đang tải danh mục...</p>
            </div>
          ) : (
            <div className="catm-table-wrap">
              <table className="catm-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Loại</th>
                    <th>Danh mục cha</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((item) => {
                      const isParent = !item.parent_category_id

                      return (
                        <tr key={item.category_id}>
                          <td>{item.category_id}</td>
                          <td className="catm-text-left">{item.category_name}</td>
                          <td>
                            <span
                              className={`catm-badge ${
                                isParent ? "catm-badge-success" : "catm-badge-warning"
                              }`}
                            >
                              {isParent ? "Danh mục cha" : "Danh mục con"}
                            </span>
                          </td>
                          <td>
                            {isParent
                              ? "Danh mục gốc"
                              : getCategoryNameById(item.parent_category_id)}
                          </td>
                          <td>
                            <div className="catm-action-group">
                              <button
                                type="button"
                                className="catm-icon-btn catm-edit-btn"
                                onClick={() => handleEdit(item)}
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className="catm-icon-btn catm-delete-btn"
                                onClick={() => handleDelete(item.category_id)}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="catm-empty-row">
                        Không có danh mục phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}