import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, Clock, AlertCircle, BookOpen, Video, FileText, User, ExternalLink, Check, X } from 'lucide-react'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  related_case_study_id?: string
}

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      setupRealtimeSubscription()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const subscription = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === payload.new.id ? payload.new as Notification : notif
            )
          )
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate to related case study if available
    if (notification.related_case_study_id) {
      setIsOpen(false)
      navigate(`/dashboard?highlight=${notification.related_case_study_id}`)
    }
  }

  const getNotificationIcon = (type: string, message: string) => {
    if (message.includes('Sachverhalt verfügbar') || message.includes('hochgeladen')) {
      return <BookOpen className="w-4 h-4 text-blue-500" />
    }
    if (message.includes('Video-Korrektur') || message.includes('korrigiert')) {
      return <Video className="w-4 h-4 text-green-500" />
    }
    if (message.includes('PDF') || message.includes('schriftlich')) {
      return <FileText className="w-4 h-4 text-purple-500" />
    }
    if (message.includes('angefordert')) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    return <Bell className="w-4 h-4 text-gray-500" />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50'
      case 'warning': return 'border-l-yellow-500 bg-yellow-50'
      case 'error': return 'border-l-red-500 bg-red-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Gerade eben'
    } else if (diffInHours < 24) {
      return `vor ${Math.floor(diffInHours)} Std.`
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-primary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Benachrichtigungen</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:text-blue-700 font-medium"
                >
                  Alle als gelesen markieren
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Keine Benachrichtigungen</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 cursor-pointer ${getTypeColor(notification.type)} ${
                      !notification.read ? 'bg-blue-25' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.message)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </p>
                              {notification.related_case_study_id && (
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                            {notification.related_case_study_id && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">
                                → Zur Klausur wechseln
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="p-1 hover:bg-gray-200 rounded-full"
                                title="Als gelesen markieren"
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full"
                              title="Löschen"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Could navigate to a full notifications page
                }}
                className="w-full text-center text-sm text-primary hover:text-blue-700 font-medium"
              >
                Alle Benachrichtigungen anzeigen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
