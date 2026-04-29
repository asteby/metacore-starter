import { useState, useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  CheckCheck,
  Inbox,
  AlertTriangle,
  Clock,
  FileWarning,
  PackageMinus,
  ShoppingCart,
  CircleDollarSign,
  CalendarX,
  Wrench,
  Settings,
  Zap,
  Eye,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const Route = createFileRoute('/_authenticated/notifications/')({
  component: NotificationCenterPage,
})

interface Notification {
  id: string
  title: string
  body: string
  event_type: string
  channel: string
  status: string
  created_at: string
  read_at: string | null
  reference_type: string | null
  reference_id: string | null
}

const eventIcons: Record<string, React.ElementType> = {
  low_stock: PackageMinus,
  overdue_invoice: FileWarning,
  pending_approval: Clock,
  sla_breach: AlertTriangle,
  contract_expiry: CalendarX,
  payment_received: CircleDollarSign,
  order_created: ShoppingCart,
  maintenance_due: Wrench,
  custom: Settings,
}

const eventColors: Record<string, string> = {
  low_stock: 'text-orange-500',
  overdue_invoice: 'text-red-500',
  pending_approval: 'text-yellow-500',
  sla_breach: 'text-red-500',
  contract_expiry: 'text-orange-500',
  payment_received: 'text-green-500',
  order_created: 'text-blue-500',
  maintenance_due: 'text-yellow-500',
  custom: 'text-gray-500',
}

function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications/unread'),
        api.get('/notifications/unread/count'),
      ])
      setNotifications(notifRes.data?.data || [])
      setUnreadCount(countRes.data?.data?.count || 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read', read_at: new Date().toISOString() })),
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 p-8 gap-4 overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">Centro de Notificaciones</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} sin leer</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Inbox className="h-12 w-12 mb-4" />
              <p className="text-lg">No hay notificaciones pendientes</p>
              <p className="text-sm">Todas las notificaciones han sido leídas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const IconComponent = eventIcons[notification.event_type] || Zap
                const colorClass = eventColors[notification.event_type] || 'text-gray-500'
                const isUnread = !notification.read_at

                return (
                  <Card
                    key={notification.id}
                    className={`transition-colors cursor-pointer hover:bg-muted/50 ${
                      isUnread ? 'border-l-4 border-l-primary bg-muted/20' : ''
                    }`}
                    onClick={() => isUnread && markAsRead(notification.id)}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={`mt-1 ${colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${isUnread ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
