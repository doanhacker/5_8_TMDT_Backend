import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import * as notificationApi from '../services/notificationApi'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState({ total: 0, limit: 20, offset: 0, unread_count: 0 })

  const refreshNotifications = useCallback(async (params = {}) => {
    if (!user) {
      setNotifications([])
      setMeta({ total: 0, limit: 20, offset: 0, unread_count: 0 })
      return { data: [], meta: { total: 0, limit: 20, offset: 0, unread_count: 0 } }
    }

    try {
      setLoading(true)
      setError('')
      const response = await notificationApi.getMyNotifications(params)
      const nextNotifications = Array.isArray(response?.data) ? response.data : []
      const nextMeta = response?.meta || { total: nextNotifications.length, limit: 20, offset: 0, unread_count: 0 }
      setNotifications(nextNotifications)
      setMeta(nextMeta)
      return { data: nextNotifications, meta: nextMeta }
    } catch (err) {
      if (!String(err.message || '').includes('Token không hợp lệ')) {
        setError(err.message)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  const markOneAsRead = async (notificationId) => {
    await notificationApi.markNotificationRead(notificationId)
    setNotifications((prev) => prev.map((item) => (
      Number(item.notification_id) === Number(notificationId)
        ? { ...item, is_read: true }
        : item
    )))
    setMeta((prev) => ({
      ...prev,
      unread_count: Math.max(0, Number(prev.unread_count || 0) - 1),
    }))
  }

  const markAllAsRead = async () => {
    await notificationApi.markAllNotificationsRead()
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    setMeta((prev) => ({ ...prev, unread_count: 0 }))
  }

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setMeta({ total: 0, limit: 20, offset: 0, unread_count: 0 })
      return undefined
    }

    refreshNotifications({ limit: 20, offset: 0 }).catch(() => {})
    const timer = window.setInterval(() => {
      refreshNotifications({ limit: 20, offset: 0 }).catch(() => {})
    }, 30000)

    return () => window.clearInterval(timer)
  }, [user])

  const value = useMemo(() => ({
    notifications,
    loading,
    error,
    unreadCount: Number(meta.unread_count || 0),
    meta,
    refreshNotifications,
    markOneAsRead,
    markAllAsRead,
  }), [notifications, loading, error, meta])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
