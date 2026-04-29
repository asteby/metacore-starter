import { WifiOff } from 'lucide-react'
import { usePWA } from '@/hooks/use-pwa'

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Sin conexión - Modo offline</span>
      </div>
    </div>
  )
}
