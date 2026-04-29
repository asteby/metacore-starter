import { useEffect, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { useWebSocketContext } from '@/context/websocket-provider'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAppBadge } from '@/hooks/use-app-badge'
import { useNavigate } from '@tanstack/react-router'


interface NotificationItem {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    is_read: boolean
    created_at: string
    link?: string
    icon?: string
    image?: string
    metadata?: string
    conversation_id?: string
}

// Helper to convert kebab-case to PascalCase (e.g. "message-circle" -> "MessageCircle")
const toPascalCase = (str: string) =>
    str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')

export function NotificationsDropdown() {
    const { lastMessage } = useWebSocketContext()
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [, setLoading] = useState(false)
    const { setBadge } = useAppBadge()
    const navigate = useNavigate()

    // Update app badge when unread count changes
    useEffect(() => {
        setBadge(unreadCount)
    }, [unreadCount, setBadge])


    // Fetch initial notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await api.get('/data/notifications/me', {
                params: {
                    orderBy: 'created_at',
                    orderDir: 'desc',
                    per_page: 20
                }
            })
            if (response.data && response.data.data) {
                setNotifications(response.data.data)
                const unread = response.data.data.filter((n: NotificationItem) => !n.is_read).length
                setUnreadCount(unread)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    // Listen to WebSocket messages
    useEffect(() => {
        if (!lastMessage) return

        try {
            const data = JSON.parse(lastMessage.data)
            if (data.type === 'NOTIFICATION') {
                const payload = data.payload
                console.log('🔔 WS Notification received:', payload)
                console.log('🖼️ Image:', payload.image, 'Icon:', payload.icon)

                const newNotification: NotificationItem = {
                    id: payload.id || crypto.randomUUID(),
                    title: payload.title,
                    message: payload.body || payload.message || payload.description,
                    type: payload.type || 'info',
                    is_read: false,
                    created_at: new Date().toISOString(),
                    link: payload.link,
                    icon: payload.icon,
                    image: payload.image,
                    metadata: payload.metadata,
                    conversation_id: payload.conversation_id
                }

                setNotifications(prev => [newNotification, ...prev])
                setUnreadCount(prev => prev + 1)

                // Si llega mensaje y no tenemos permisos, mostramos la ventanita morada
                // (Ya sea que nunca nos preguntó o que estén bloqueadas)
                if ('Notification' in window && Notification.permission !== 'granted') {
                    window.dispatchEvent(new CustomEvent('show-notification-prompt'))
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }, [lastMessage])

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            await api.patch(`/data/notifications/me/${id}`, { is_read: true })
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            await Promise.all(unreadIds.map(id => api.patch(`/data/notifications/me/${id}`, { is_read: true })))
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const getIcon = (notification: NotificationItem) => {
        // 1. Try custom icon dynamically
        if (notification.icon) {
            const pascalName = toPascalCase(notification.icon)
            // @ts-ignore
            const DynamicIcon = LucideIcons[pascalName]
            if (DynamicIcon) {
                return DynamicIcon
            }
        }

        // 2. Fallback based on type
        switch (notification.type) {
            case 'warning': return LucideIcons.AlertTriangle
            case 'success': return LucideIcons.CheckCircle2
            case 'error': return LucideIcons.XCircle
            case 'info':
            default: return LucideIcons.Info
        }
    }


    const getStyle = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-amber-500 text-white'
            case 'success': return 'bg-emerald-500 text-white'
            case 'error': return 'bg-red-500 text-white'
            case 'info':
            default: return 'bg-blue-500 text-white'
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='relative'>
                    {'Notification' in window && Notification.permission !== 'granted' ? (
                        <div className="relative">
                            <LucideIcons.BellOff className='h-[1.2rem] w-[1.2rem] text-muted-foreground' />
                            {Notification.permission === 'default' && (
                                <span className='absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-yellow-500 ring-2 ring-background' title="Permisos requeridos" />
                            )}
                        </div>
                    ) : (
                        <LucideIcons.Bell className='h-[1.2rem] w-[1.2rem] text-foreground' />
                    )}

                    {/* Always show unread count badge */}
                    {unreadCount > 0 && (
                        <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background'>
                            {unreadCount}
                            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
                        </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-85 sm:w-96 p-0' align='end' forceMount>
                <DropdownMenuLabel className='p-4 font-normal border-b'>
                    <div className='flex items-center justify-between'>
                        <p className='text-sm font-semibold'>Notificaciones</p>
                        {unreadCount > 0 && (
                            <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                                {unreadCount} nuevas
                            </span>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuGroup className='max-h-[350px] overflow-y-auto'>
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No tienes notificaciones
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const Icon = getIcon(notification)

                            return (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className='cursor-pointer p-3 sm:p-4 focus:bg-muted/50 data-[state=open]:bg-muted/50'
                                    onClick={() => {
                                        if (!notification.is_read) markAsRead(notification.id)

                                        if (notification.link) {
                                            if (notification.link.startsWith('http')) {
                                                window.open(notification.link, '_blank')
                                            } else {
                                                navigate({ to: notification.link })
                                            }
                                        } else if (notification.conversation_id) {
                                            navigate({ to: '/chats', search: { id: notification.conversation_id } })
                                        }
                                    }}
                                >
                                    <div className='flex items-start gap-4 w-full'>
                                        {/* Avatar or Icon Container */}
                                        <div className="relative shrink-0">
                                            {notification.image ? (
                                                <>
                                                    <img
                                                        src={notification.image}
                                                        alt="Avatar"
                                                        className="h-10 w-10 rounded-full object-cover border border-muted/40 shadow-sm"
                                                    />
                                                    <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-1 ring-border text-primary shadow-sm`}>
                                                        <Icon className="h-[10px] w-[10px] text-current" strokeWidth={3} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-1 ring-inset ring-black/5 ${getStyle(notification.type)}`}>
                                                    <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </div>

                                        <div className='flex flex-col gap-1 w-full min-w-0'>
                                            <div className='flex items-center justify-between gap-2'>
                                                <p className={`text-sm leading-none truncate ${!notification.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className='text-[10px] text-muted-foreground whitespace-nowrap shrink-0'>
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className='self-center shrink-0'>
                                                <div className='h-2.5 w-2.5 rounded-full bg-primary shadow-sm' />
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            )
                        })
                    )}
                </DropdownMenuGroup>
                {notifications.length > 0 && (
                    <div className='p-2 border-t bg-muted/20'>
                        <Button
                            variant="ghost"
                            size="sm"
                            className='w-full text-xs h-8'
                            onClick={markAllAsRead}
                        >
                            Marcar todo como leído
                        </Button>
                    </div>
                )}
                {'Notification' in window && Notification.permission !== 'granted' && (
                    <div className='p-2 border-t bg-muted/20'>
                        <Button
                            variant="outline"
                            size="sm"
                            className='w-full text-xs h-8 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                            onClick={async () => {
                                try {
                                    // Intentamos abrir el diálogo nativo de Chrome
                                    const permission = await Notification.requestPermission()

                                    if (permission === 'granted') {
                                        toast.success('¡Notificaciones activadas!')
                                        setTimeout(() => window.location.reload(), 1500)
                                    } else {
                                        // Si el usuario lo niega o ya estaba bloqueado por el navegador
                                        toast.error('Permisos bloqueados por el navegador', {
                                            description: 'Debes habilitarlas desde el icono 🔒 en la barra de direcciones.'
                                        })
                                    }
                                } catch (error) {
                                    toast.error('No se pudo abrir la solicitud de permisos')
                                }
                            }}
                        >
                            <LucideIcons.BellRing className="h-3 w-3" />
                            Activar notificaciones
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
