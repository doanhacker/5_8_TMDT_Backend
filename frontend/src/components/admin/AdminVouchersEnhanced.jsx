import { useEffect, useMemo, useState } from 'react'
import { FiEdit, FiGift, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi'
import * as voucherApi from '../../services/voucherApi'

const initialVoucherForm = {
  voucher_code: '',
  discount_type: 'PERCENTAGE',
  discount_value: '',
  min_order_value: '0',
  remaining_quantity: '0',
  expiration_date: '',
}

const toCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const getVoucherStatus = (voucher) => {
  const expiresAt = new Date(voucher.expiration_date)
  if (Number(voucher.remaining_quantity) <= 0) {
    return { key: 'out_of_stock', label: 'Hết lượt', tone: 'warn' }
  }
  if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
    return { key: 'expired', label: 'Hết hạn', tone: 'danger' }
  }
  return { key: 'active', label: 'Đang hoạt động', tone: 'ok' }
}

const toDatetimeLocalValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (input) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 })
  const [voucherForm, setVoucherForm] = useState(initialVoucherForm)

  const loadVouchers = async (page = 1, customSearch = search, customStatus = status) => {
    try {
      setLoading(true)
      setError('')
      const response = await voucherApi.getAllVouchers({
        page,
        limit: pagination.limit,
        search: customSearch,
        status: customStatus,
        sortBy: 'expiration_date',
        sortOrder: 'ASC',
      })
      setVouchers(Array.isArray(response?.data) ? response.data : [])
      setPagination(response?.pagination || { page: 1, limit: 10, totalItems: 0, totalPages: 1 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVouchers(1)
  }, [])

  const summary = useMemo(() => {
    return vouchers.reduce((accumulator, voucher) => {
      const state = getVoucherStatus(voucher).key
      accumulator[state] += 1
      return accumulator
    }, { active: 0, expired: 0, out_of_stock: 0 })
  }, [vouchers])

  const resetForm = () => {
    setEditingId('')
    setVoucherForm(initialVoucherForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setMessage('')

      const payload = {
        voucher_code: voucherForm.voucher_code,
        discount_type: voucherForm.discount_type,
        discount_value: Number(voucherForm.discount_value),
        min_order_value: Number(voucherForm.min_order_value || 0),
        remaining_quantity: Number(voucherForm.remaining_quantity || 0),
        expiration_date: new Date(voucherForm.expiration_date).toISOString(),
      }

      if (editingId) {
        await voucherApi.updateVoucher(editingId, payload)
        setMessage('Cập nhật voucher thành công')
      } else {
        await voucherApi.createVoucher(payload)
        setMessage('Tạo voucher thành công')
      }

      resetForm()
      await loadVouchers(pagination.page || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (voucherId) => {
    try {
      setLoading(true)
      setError('')
      const response = await voucherApi.getVoucherById(voucherId)
      const voucher = response?.data
      if (!voucher) {
        throw new Error('Không tải được chi tiết voucher')
      }
      setEditingId(String(voucher.voucher_id))
      setVoucherForm({
        voucher_code: voucher.voucher_code || '',
        discount_type: voucher.discount_type || 'PERCENTAGE',
        discount_value: String(voucher.discount_value ?? ''),
        min_order_value: String(voucher.min_order_value ?? 0),
        remaining_quantity: String(voucher.remaining_quantity ?? 0),
        expiration_date: toDatetimeLocalValue(voucher.expiration_date),
      })
      setMessage('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (voucherId, voucherCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa voucher ${voucherCode}?`)) return
    try {
      setLoading(true)
      setError('')
      setMessage('')
      await voucherApi.deleteVoucher(voucherId)
      setMessage(`Đã xóa voucher ${voucherCode}`)
      if (String(editingId) === String(voucherId)) {
        resetForm()
      }
      await loadVouchers(pagination.page || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    await loadVouchers(1, search, status)
  }

  return (
    <div className='adm-split'>
      <section className='adm-card adm-card-pad'>
        <div className='adm-card-title'>
          <h3>{editingId ? 'Chỉnh sửa voucher' : 'Tạo voucher mới'}</h3>
          <span className='adm-pill'>{editingId ? 'Edit' : 'New'}</span>
        </div>

        {message ? <div className='adm-alert adm-alert-success'>{message}</div> : null}
        {error ? <div className='adm-alert adm-alert-error'>{error}</div> : null}

        <form className='adm-form' onSubmit={handleSubmit}>
          <div className='adm-form-row'>
            <label>Mã voucher *</label>
            <input
              value={voucherForm.voucher_code}
              onChange={(event) => setVoucherForm((prev) => ({ ...prev, voucher_code: event.target.value.toUpperCase() }))}
              placeholder='VD: GIAM10'
              required
            />
          </div>

          <div className='adm-form-row'>
            <label>Loại giảm giá *</label>
            <select
              value={voucherForm.discount_type}
              onChange={(event) => setVoucherForm((prev) => ({ ...prev, discount_type: event.target.value }))}
            >
              <option value='PERCENTAGE'>PERCENTAGE</option>
              <option value='FIXED_AMOUNT'>FIXED_AMOUNT</option>
            </select>
          </div>

          <div className='adm-form-row'>
            <label>Giá trị giảm *</label>
            <input
              type='number'
              min='0'
              step='0.01'
              value={voucherForm.discount_value}
              onChange={(event) => setVoucherForm((prev) => ({ ...prev, discount_value: event.target.value }))}
              placeholder={voucherForm.discount_type === 'PERCENTAGE' ? '1 - 100' : 'VD: 200000'}
              required
            />
          </div>

          <div className='adm-form-row'>
            <label>Đơn tối thiểu</label>
            <input
              type='number'
              min='0'
              step='0.01'
              value={voucherForm.min_order_value}
              onChange={(event) => setVoucherForm((prev) => ({ ...prev, min_order_value: event.target.value }))}
            />
          </div>

          <div className='adm-form-row'>
            <label>Số lượt còn lại</label>
            <input
              type='number'
              min='0'
              value={voucherForm.remaining_quantity}
              onChange={(event) => setVoucherForm((prev) => ({ ...prev, remaining_quantity: event.target.value }))}
            />
          </div>

          <div className='adm-form-row'>
            <label>Ngày hết hạn *</label>
            <input
              type='datetime-local'
              value={voucherForm.expiration_date}
              onChange={(event) => setVoucherForm((prev) => ({ ...prev, expiration_date: event.target.value }))}
              required
            />
          </div>

          <div className='adm-form-actions adm-span2'>
            <button className='adm-btn adm-btn-primary' type='submit' disabled={submitting}>
              {editingId ? <FiEdit /> : <FiPlus />}
              {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật voucher' : 'Tạo voucher'}
            </button>
            {editingId ? (
              <button className='adm-btn adm-btn-light' type='button' onClick={resetForm}>
                <FiX /> Hủy sửa
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className='adm-card adm-card-pad'>
        <div className='adm-card-title'>
          <h3>Danh sách voucher</h3>
          <div className='adm-row-actions'>
            <span className='adm-pill adm-pill-muted'>{pagination.totalItems || vouchers.length} items</span>
            <button className='adm-btn adm-btn-light' type='button' onClick={() => loadVouchers(pagination.page || 1)}>
              <FiRefreshCw /> Làm mới
            </button>
          </div>
        </div>

        <div className='adm-kpi-grid' style={{ marginBottom: 14 }}>
          <div className='adm-stat-mini'>Đang hoạt động: <strong>{summary.active}</strong></div>
          <div className='adm-stat-mini'>Hết hạn: <strong>{summary.expired}</strong></div>
          <div className='adm-stat-mini'>Hết lượt: <strong>{summary.out_of_stock}</strong></div>
        </div>

        <form className='adm-voucher-toolbar' onSubmit={handleSearchSubmit}>
          <div className='adm-search-box' style={{ marginBottom: 0 }}>
            <input
              type='text'
              placeholder='Tìm mã voucher...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className='adm-search-input'
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className='adm-toolbar-select'>
            <option value=''>Tất cả trạng thái</option>
            <option value='active'>Đang hoạt động</option>
            <option value='expired'>Hết hạn</option>
            <option value='out_of_stock'>Hết lượt</option>
          </select>
          <button className='adm-btn adm-btn-primary' type='submit'>
            <FiSearch /> Lọc
          </button>
        </form>

        <div className='adm-table-wrap adm-product-list-scroll'>
          <table className='adm-table2'>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Còn lại</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th>Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => {
                const voucherStatus = getVoucherStatus(voucher)
                return (
                  <tr key={voucher.voucher_id}>
                    <td><span className='adm-chip'><FiGift /> {voucher.voucher_code}</span></td>
                    <td>{voucher.discount_type}</td>
                    <td>
                      {voucher.discount_type === 'PERCENTAGE'
                        ? `${voucher.discount_value}%`
                        : toCurrency(voucher.discount_value)}
                    </td>
                    <td>{toCurrency(voucher.min_order_value)}</td>
                    <td>{voucher.remaining_quantity}</td>
                    <td>{new Date(voucher.expiration_date).toLocaleString('vi-VN')}</td>
                    <td><span className={`adm-status2 ${voucherStatus.tone}`}>{voucherStatus.label}</span></td>
                    <td>
                      <div className='adm-row-actions adm-row-actions-compact'>
                        <button className='adm-btn adm-btn-light' type='button' onClick={() => handleEdit(voucher.voucher_id)}>
                          <FiEdit /> Sửa
                        </button>
                        <button className='adm-btn adm-btn-danger' type='button' onClick={() => handleDelete(voucher.voucher_id, voucher.voucher_code)}>
                          <FiTrash2 /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan='8'>
                    <div className='adm-empty-state'>Không có voucher phù hợp.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className='adm-pagination'>
          <button
            className='adm-btn adm-btn-light'
            type='button'
            disabled={(pagination.page || 1) <= 1 || loading}
            onClick={() => loadVouchers((pagination.page || 1) - 1)}
          >
            Trang trước
          </button>
          <span className='adm-muted'>Trang {pagination.page || 1}/{pagination.totalPages || 1}</span>
          <button
            className='adm-btn adm-btn-light'
            type='button'
            disabled={(pagination.page || 1) >= (pagination.totalPages || 1) || loading}
            onClick={() => loadVouchers((pagination.page || 1) + 1)}
          >
            Trang sau
          </button>
        </div>
      </section>
    </div>
  )
}
