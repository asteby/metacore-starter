import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'

export function NotificationDemo() {
  const { requestPermission, showNotification, isGranted, isSupported } = useNotifications()

  const handleTestNotification = async () => {
    if (!isGranted) {
      await requestPermission()
    }
    
    await showNotification({
      title: 'Notificación de prueba',
      body: 'Esta es una notificación de escritorio con sonido',
      icon: '/images/icons/android/android-launchericon-192-192.png',
      tag: 'test-notification',
      requireInteraction: false
    })
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Las notificaciones no están soportadas en este navegador
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleTestNotification} size="sm" variant="outline">
        <Bell className="h-4 w-4" />
        {isGranted ? 'Enviar notificación' : 'Activar notificaciones'}
      </Button>
      {isGranted && (
        <span className="text-xs text-muted-foreground">
          Notificaciones activadas
        </span>
      )}
    </div>
  )
}
