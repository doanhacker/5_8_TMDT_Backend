import { useEffect, useMemo, useState } from 'react'
import { FiEdit, FiPlus, FiRefreshCcw, FiSave, FiTrash2, FiX } from 'react-icons/fi'
import {
  createTradeInRequest,
  createUsedTradeItem,
  deleteUsedTradeItem,
  getTradeInRequests,
  getUsedTradeItems,
  uploadUsedTradeItemImage,
  updateTradeInRequestStatus,
  updateUsedTradeItem,
} from '../../services/usedTradeInApi'
import { getImageUrl } from '../../config/api'

const REQUEST_STATUSES = ['PENDING', 'CONTACTED', 'APPRAISED', 'COMPLETED', 'CANCELLED']

const createEmptyItemForm = () => ({
  id: '',
  name: '',
  category: 'Thiết bị',
  grade: 'Cũ đẹp',
  note: '',
  cpu: '',
  ram: '',
  storage: '',
  battery: '',
  price: '',
  oldPrice: '',
  sold: '0',
  image: '',
  stock: '0',
  active: true,
})

const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN')

export default function AdminUsedTradeIn() {
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [itemForm, setItemForm] = useState(createEmptyItemForm())
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const isEditing = Boolean(itemForm.id)

  const loadItems = async () => {
    try {
      setLoadingItems(true)
      setError('')
      const data = await getUsedTradeItems({ includeInactive: true, limit: 300 })
      setItems(data)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách máy cũ')
    } finally {
      setLoadingItems(false)
    }
  }

  const loadRequests = async () => {
    try {
      setLoadingRequests(true)
      setError('')
      const data = await getTradeInRequests({ limit: 300 })
      setRequests(data)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách thu cũ')
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    loadItems()
    loadRequests()
  }, [])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((item) => [item.name, item.category, item.grade, item.cpu].join(' ').toLowerCase().includes(keyword))
  }, [items, search])

  const resetForm = () => {
    setItemForm(createEmptyItemForm())
    setError('')
  }

  const handleSubmitItem = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!itemForm.name.trim()) {
      setError('Vui lòng nhập tên máy cũ')
      return
    }

    const payload = {
      name: itemForm.name.trim(),
      category: itemForm.category.trim() || 'Thiết bị',
      grade: itemForm.grade.trim() || 'Cũ đẹp',
      note: itemForm.note.trim(),
      cpu: itemForm.cpu.trim(),
      ram: itemForm.ram.trim(),
      storage: itemForm.storage.trim(),
      battery: itemForm.battery.trim(),
      price: Number(itemForm.price || 0),
      oldPrice: itemForm.oldPrice === '' ? null : Number(itemForm.oldPrice),
      sold: Number(itemForm.sold || 0),
      image: itemForm.image.trim(),
      stock: Number(itemForm.stock || 0),
      active: Boolean(itemForm.active),
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setError('Giá bán không hợp lệ')
      return
    }

    try {
      setSubmitting(true)
      if (isEditing) {
        await updateUsedTradeItem(itemForm.id, payload)
        setMessage('Cập nhật máy cũ thành công')
      } else {
        await createUsedTradeItem(payload)
        setMessage('Tạo máy cũ thành công')
      }
      resetForm()
      await loadItems()
    } catch (err) {
      setError(err.message || 'Không thể lưu máy cũ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      setError('')
      setMessage('')

      const uploadedImageUrl = await uploadUsedTradeItemImage(file)
      setItemForm((prev) => ({ ...prev, image: uploadedImageUrl }))
      setMessage('Upload ảnh thành công')
    } catch (err) {
      setError(err.message || 'Không thể upload ảnh máy cũ')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleEditItem = (item) => {
    setMessage('')
    setError('')
    setItemForm({
      id: item.id,
      name: item.name || '',
      category: item.category || 'Thiết bị',
      grade: item.grade || 'Cũ đẹp',
      note: item.note || '',
      cpu: item.cpu || '',
      ram: item.ram || '',
      storage: item.storage || '',
      battery: item.battery || '',
      price: String(item.price ?? ''),
      oldPrice: item.oldPrice != null ? String(item.oldPrice) : '',
      sold: String(item.sold ?? 0),
      image: item.image || '',
      stock: String(item.stock ?? 0),
      active: Boolean(item.active),
    })
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa máy cũ này?')) return

    try {
      setMessage('')
      setError('')
      await deleteUsedTradeItem(id)
      if (String(itemForm.id) === String(id)) {
        resetForm()
      }
      setMessage('Xóa máy cũ thành công')
      await loadItems()
    } catch (err) {
      setError(err.message || 'Không thể xóa máy cũ')
    }
  }

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await updateTradeInRequestStatus(requestId, status)
      await loadRequests()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái yêu cầu')
    }
  }

  return (
    <div className='adm-card adm-card-pad'>
      <div className='adm-card-title'>
        <h3>Máy cũ, Thu cũ</h3>
        <div className='adm-row-actions'>
          <button
            type='button'
            className={`adm-btn ${activeTab === 'items' ? 'adm-btn-primary' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Quản lý máy cũ
          </button>
          <button
            type='button'
            className={`adm-btn ${activeTab === 'requests' ? 'adm-btn-primary' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Yêu cầu thu cũ
          </button>
        </div>
      </div>

      {message ? <p className='adm-muted' style={{ color: '#2f7a4f' }}>{message}</p> : null}
      {error ? <p className='adm-muted' style={{ color: '#dc2626' }}>{error}</p> : null}

      {activeTab === 'items' ? (
        <div className='adm-split'>
          <section className='adm-card adm-card-pad'>
            <div className='adm-card-title'>
              <h3>{isEditing ? 'Chỉnh sửa máy cũ' : 'Thêm máy cũ'}</h3>
              <span className='adm-pill'>{isEditing ? 'Edit' : 'New'}</span>
            </div>

            <form className='adm-form' onSubmit={handleSubmitItem}>
              <div className='adm-form-row adm-span2'>
                <label>Tên máy *</label>
                <input value={itemForm.name} onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))} required />
              </div>

              <div className='adm-form-row'>
                <label>Danh mục</label>
                <input value={itemForm.category} onChange={(event) => setItemForm((prev) => ({ ...prev, category: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>Phân hạng</label>
                <input value={itemForm.grade} onChange={(event) => setItemForm((prev) => ({ ...prev, grade: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>Giá bán</label>
                <input type='number' min='0' value={itemForm.price} onChange={(event) => setItemForm((prev) => ({ ...prev, price: event.target.value }))} required />
              </div>
              <div className='adm-form-row'>
                <label>Giá cũ</label>
                <input type='number' min='0' value={itemForm.oldPrice} onChange={(event) => setItemForm((prev) => ({ ...prev, oldPrice: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>Tồn kho</label>
                <input type='number' min='0' value={itemForm.stock} onChange={(event) => setItemForm((prev) => ({ ...prev, stock: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>Đã bán</label>
                <input type='number' min='0' value={itemForm.sold} onChange={(event) => setItemForm((prev) => ({ ...prev, sold: event.target.value }))} />
              </div>

              <div className='adm-form-row'>
                <label>CPU</label>
                <input value={itemForm.cpu} onChange={(event) => setItemForm((prev) => ({ ...prev, cpu: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>RAM</label>
                <input value={itemForm.ram} onChange={(event) => setItemForm((prev) => ({ ...prev, ram: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>Ổ cứng</label>
                <input value={itemForm.storage} onChange={(event) => setItemForm((prev) => ({ ...prev, storage: event.target.value }))} />
              </div>
              <div className='adm-form-row'>
                <label>Pin (%)</label>
                <input value={itemForm.battery} onChange={(event) => setItemForm((prev) => ({ ...prev, battery: event.target.value }))} />
              </div>

              <div className='adm-form-row adm-span2'>
                <label>Mô tả</label>
                <textarea value={itemForm.note} onChange={(event) => setItemForm((prev) => ({ ...prev, note: event.target.value }))} />
              </div>

              <div className='adm-form-row adm-span2'>
                <label>URL ảnh</label>
                <input value={itemForm.image} onChange={(event) => setItemForm((prev) => ({ ...prev, image: event.target.value }))} />
              </div>

              <div className='adm-form-row adm-span2'>
                <label>Tải ảnh từ máy</label>
                <input type='file' accept='image/*' onChange={handleUploadImage} disabled={uploadingImage} />
                <small className='adm-muted'>
                  {uploadingImage ? 'Đang upload ảnh...' : 'Chọn ảnh để upload tự động và điền URL ảnh'}
                </small>
              </div>

              {itemForm.image ? (
                <div className='adm-form-row adm-span2'>
                  <label>Preview ảnh</label>
                  <img
                    src={getImageUrl(itemForm.image)}
                    alt={itemForm.name || 'Ảnh máy cũ'}
                    style={{ width: 120, height: 120, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                </div>
              ) : null}

              <div className='adm-inline'>
                <label className='adm-check'>
                  <input
                    type='checkbox'
                    checked={itemForm.active}
                    onChange={(event) => setItemForm((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                  Hoạt động
                </label>
              </div>

              <div className='adm-form-actions adm-span2'>
                {isEditing ? (
                  <button type='button' className='adm-btn' onClick={resetForm}>
                    <FiX /> Hủy sửa
                  </button>
                ) : null}
                <button type='submit' className='adm-btn adm-btn-primary' disabled={submitting}>
                  {isEditing ? <FiSave /> : <FiPlus />}
                  {submitting ? 'Đang lưu...' : isEditing ? 'Cập nhật máy cũ' : 'Thêm máy cũ'}
                </button>
              </div>
            </form>
          </section>

          <section className='adm-card adm-card-pad'>
            <div className='adm-card-title'>
              <h3>Danh sách máy cũ</h3>
              <div className='adm-row-actions'>
                <span className='adm-pill adm-pill-muted'>{filteredItems.length} items</span>
                <button type='button' className='adm-btn adm-btn-light' onClick={loadItems} disabled={loadingItems}>
                  <FiRefreshCcw /> {loadingItems ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>
            </div>

            <div className='adm-search-box'>
              <input
                className='adm-search-input'
                placeholder='Tìm theo tên, danh mục, phân hạng...'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className='adm-table-wrap adm-product-list-scroll'>
              <table className='adm-table2'>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên máy</th>
                    <th>Phân hạng</th>
                    <th>Giá</th>
                    <th>Tồn</th>
                    <th>Trạng thái</th>
                    <th>Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingItems && filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='adm-branch-empty-cell'>Chưa có máy cũ nào.</td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className='adm-ellipsis'>{item.name}</td>
                        <td>{item.grade || '-'}</td>
                        <td>{formatPrice(item.price)}đ</td>
                        <td>{item.stock}</td>
                        <td>
                          <span className={`adm-pill ${item.active ? '' : 'adm-pill-muted'}`}>
                            {item.active ? 'Hoạt động' : 'Tạm ẩn'}
                          </span>
                        </td>
                        <td>
                          <div className='adm-row-actions'>
                            <button type='button' className='adm-btn' onClick={() => handleEditItem(item)}>
                              <FiEdit /> Sửa
                            </button>
                            <button type='button' className='adm-btn adm-btn-danger' onClick={() => handleDeleteItem(item.id)}>
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
      ) : (
        <section className='adm-card adm-card-pad'>
          <div className='adm-card-title'>
            <h3>Yêu cầu thu cũ</h3>
            <button type='button' className='adm-btn adm-btn-light' onClick={loadRequests} disabled={loadingRequests}>
              <FiRefreshCcw /> {loadingRequests ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          <div className='adm-table-wrap adm-product-list-scroll'>
            <table className='adm-table2'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Thiết bị</th>
                  <th>SĐT</th>
                  <th>Giá kỳ vọng</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {!loadingRequests && requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='adm-branch-empty-cell'>Chưa có yêu cầu thu cũ.</td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td className='adm-ellipsis'>
                        <strong>{request.customerName}</strong>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{request.email || '-'}</div>
                      </td>
                      <td className='adm-ellipsis'>
                        {request.deviceName}
                        <div style={{ color: '#64748b', fontSize: 12 }}>{request.deviceCondition || '-'}</div>
                      </td>
                      <td>{request.phone}</td>
                      <td>{request.expectedPrice != null ? `${formatPrice(request.expectedPrice)}đ` : '-'}</td>
                      <td>
                        <span className='adm-pill'>{request.status}</span>
                      </td>
                      <td>
                        <select
                          className='adm-filter-select'
                          value={request.status}
                          onChange={(event) => handleUpdateRequestStatus(request.id, event.target.value)}
                        >
                          {REQUEST_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
