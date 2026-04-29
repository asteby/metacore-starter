import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function NotificationPermissionPrompt() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // 1. Check on load
        if ('Notification' in window && Notification.permission === 'default') {
            const timer = setTimeout(() => setShow(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    // 2. Listen for external triggers (like incoming messages)
    useEffect(() => {
        const handleTrigger = () => {
            // Si no están concedidos (default O denied), mostramos el prompt
            if (Notification.permission !== 'granted') {
                setShow(true)
                // Remove dismissal memory so it shows again definitively
                sessionStorage.removeItem('notification-prompt-dismissed')
            }
        }

        window.addEventListener('show-notification-prompt', handleTrigger)
        return () => window.removeEventListener('show-notification-prompt', handleTrigger)
    }, [])

    const handleAllow = async () => {
        // 1. Ocultamos el prompt nuestro INMEDIATAMENTE para que no estorbe
        setShow(false)

        try {
            // 2. Pedimos los permisos nativos
            const permission = await Notification.requestPermission()

            if (permission === 'granted') {
                toast.success('¡Notificaciones activadas!')
                // Optional: reload to sync state everywhere
                setTimeout(() => window.location.reload(), 1000)
            } else {
                // Si el navegador bloquea automáticamente o el usuario dice no
                toast.error('Notificaciones bloqueadas por el navegador', {
                    description: 'Debes habilitarlas manualmente: Click en el ícono 🔒 de la barra de direcciones → Permisos → Notificaciones → Permitir',
                    duration: 8000,
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDismiss = () => {
        setShow(false)
        // Optional: save in localStorage to not show again for a while
        sessionStorage.setItem('notification-prompt-dismissed', 'true')
    }

    if (!show) return null

    // Check if dismissed in this session
    if (sessionStorage.getItem('notification-prompt-dismissed')) return null

    return (
        <div className="fixed top-4 left-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-top-2 duration-500">
            <button
                onClick={handleDismiss}
                className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
                <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">Activar Notificaciones</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed">
                        Recibe alertas cuando te envíen mensajes nuevos. Puedes desactivarlas cuando quieras.
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={handleAllow} size="sm" className="h-8 text-xs px-3">
                            Permitir
                        </Button>
                        <Button onClick={handleDismiss} variant="outline" size="sm" className="h-8 text-xs px-3">
                            Ahora no
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
