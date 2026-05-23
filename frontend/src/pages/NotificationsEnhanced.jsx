import { useEffect, useMemo, useState } from 'react'
import { FiBell, FiCheck, FiPackage, FiSettings, FiTag, FiTruck } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import '../styles/Notifications.css'

const typeMeta = {
  ORDER: { icon: FiTruck, color: '#2563eb', label: 'Đơn hàng' },
  PROMOTION: { icon: FiTag, color: '#ea580c', label: 'Khuyến mãi' },
  PRODUCT: { icon: FiPackage, color: '#7c3aed', label: 'Sản phẩm' },
  SYSTEM: { icon: FiSettings, color: '#475569', label: 'Hệ thống' },
  NEWS: { icon: FiBell, color: '#dc2626', label: 'Tin tức' },
}

const formatRelativeTime = (value) => {
  if (!value) return 'Vừa xong'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Vừa xong'
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifications, unreadCount, loading, error, refreshNotifications, markOneAsRead, markAllAsRead } = useNotifications()
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const params = { limit: 50, offset: 0 }
    if (filter === 'unread') {
      params.is_read = false
    } else if (filter !== 'all') {
      params.type = filter
    }
    refreshNotifications(params).catch(() => {})
  }, [filter, refreshNotifications])

  const filteredNotifications = useMemo(() => notifications, [notifications])

  const handleOpenNotification = async (notification) => {
    if (!notification.is_read) {
      try {
        await markOneAsRead(notification.notification_id)
      } catch (err) {
        console.error('Error marking notification as read:', err)
      }
    }

    if (notification.link_url) {
      navigate(notification.link_url)
    }
  }

  if (!user) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <div className="no-notifications">
            <FiBell size={64} />
            <h3>Vui lòng đăng nhập</h3>
            <p>Bạn cần đăng nhập để xem thông báo cá nhân.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="notifications-title">
            <FiBell size={32} />
            <div>
              <h1>Thông báo</h1>
              <p>{unreadCount} thông báo chưa đọc</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={() => markAllAsRead().catch(() => {})}>
              <FiCheck size={18} />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="notifications-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'ORDER' ? 'active' : ''}`}
            onClick={() => setFilter('ORDER')}
          >
            Đơn hàng
          </button>
          <button 
            className={`filter-btn ${filter === 'PROMOTION' ? 'active' : ''}`}
            onClick={() => setFilter('PROMOTION')}
          >
            Khuyến mãi
          </button>
          <button 
            className={`filter-btn ${filter === 'PRODUCT' ? 'active' : ''}`}
            onClick={() => setFilter('PRODUCT')}
          >
            Sản phẩm
          </button>
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="no-notifications">
              <FiBell size={64} />
              <h3>Đang tải thông báo</h3>
              <p>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : error ? (
            <div className="no-notifications">
              <FiBell size={64} />
              <h3>Không thể tải thông báo</h3>
              <p>{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <FiBell size={64} />
              <h3>Không có thông báo</h3>
              <p>Bạn chưa có thông báo nào trong mục này</p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const meta = typeMeta[notif.type] || typeMeta.SYSTEM
              const Icon = meta.icon
              return (
                <div 
                  key={notif.notification_id} 
                  className={`notification-item ${!notif.is_read ? 'unread' : ''} ${notif.link_url ? 'clickable' : ''}`}
                  onClick={() => handleOpenNotification(notif)}
                >
                  <div className="notification-icon" style={{ backgroundColor: meta.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <h3>{notif.title}</h3>
                      <span className="notification-time">{formatRelativeTime(notif.created_at)}</span>
                    </div>
                    <p>{notif.content || 'Không có nội dung chi tiết'}</p>
                    <div className="notification-meta-row">
                      <span className="notification-type-chip">{meta.label}</span>
                      {notif.link_url ? <span className="notification-link-chip">Có liên kết</span> : null}
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notif.is_read && (
                      <button 
                        className="action-btn read-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          markOneAsRead(notif.notification_id).catch(() => {})
                        }}
                        title="Đánh dấu đã đọc"
                      >
                        <FiCheck size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
