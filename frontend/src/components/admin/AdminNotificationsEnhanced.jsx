import { useState } from 'react'
import { FiBell, FiSend } from 'react-icons/fi'
import * as notificationApi from '../../services/notificationApi'

const initialForm = {
  title: '',
  content: '',
  type: 'SYSTEM',
  target: 'ALL',
  specific_user_id: '',
  reference_id: '',
  link_url: '',
}

export default function AdminNotifications() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setMessage('')
      setError('')

      const payload = {
        title: form.title.trim(),
        content: form.content.trim() || null,
        type: form.type,
        target: form.target,
        specific_user_id: form.target === 'SPECIFIC' ? Number(form.specific_user_id) : undefined,
        reference_id: form.reference_id ? Number(form.reference_id) : undefined,
        link_url: form.link_url.trim() || null,
      }

      const response = await notificationApi.adminSendNotification(payload)
      setMessage(response?.message || 'Đã gửi thông báo thành công')
      setForm(initialForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='adm-grid'>
      <section className='adm-card adm-card-pad adm-span'>
        <div className='adm-card-title'>
          <h3>Gửi thông báo</h3>
          <span className='adm-pill'><FiBell /> Notify</span>
        </div>

        {message ? <div className='adm-alert adm-alert-success'>{message}</div> : null}
        {error ? <div className='adm-alert adm-alert-error'>{error}</div> : null}

        <form className='adm-form' onSubmit={handleSubmit}>
          <div className='adm-form-row adm-span2'>
            <label>Tiêu đề *</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder='VD: Đơn hàng của bạn đã được thanh toán'
              required
            />
          </div>

          <div className='adm-form-row adm-span2'>
            <label>Nội dung</label>
            <textarea
              className='adm-textarea'
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder='Nội dung thông báo gửi tới người dùng'
              rows={4}
            />
          </div>

          <div className='adm-form-row'>
            <label>Loại *</label>
            <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
              <option value='ORDER'>ORDER</option>
              <option value='PROMOTION'>PROMOTION</option>
              <option value='PRODUCT'>PRODUCT</option>
              <option value='SYSTEM'>SYSTEM</option>
              <option value='NEWS'>NEWS</option>
            </select>
          </div>

          <div className='adm-form-row'>
            <label>Đối tượng *</label>
            <select value={form.target} onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}>
              <option value='ALL'>Tất cả người dùng</option>
              <option value='SPECIFIC'>Người dùng cụ thể</option>
            </select>
          </div>

          {form.target === 'SPECIFIC' ? (
            <div className='adm-form-row'>
              <label>User ID *</label>
              <input
                type='number'
                min='1'
                value={form.specific_user_id}
                onChange={(event) => setForm((prev) => ({ ...prev, specific_user_id: event.target.value }))}
                required
              />
            </div>
          ) : null}

          <div className='adm-form-row'>
            <label>Reference ID</label>
            <input
              type='number'
              min='1'
              value={form.reference_id}
              onChange={(event) => setForm((prev) => ({ ...prev, reference_id: event.target.value }))}
              placeholder='ID liên quan nếu có'
            />
          </div>

          <div className='adm-form-row adm-span2'>
            <label>Link điều hướng</label>
            <input
              value={form.link_url}
              onChange={(event) => setForm((prev) => ({ ...prev, link_url: event.target.value }))}
              placeholder='/order-tracking hoặc /news/12'
            />
          </div>

          <div className='adm-form-actions adm-span2'>
            <button className='adm-btn adm-btn-primary' type='submit' disabled={submitting}>
              <FiSend /> {submitting ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
