import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/use-pwa'

export function PWAUpdatePrompt() {
  const { needRefresh, updateApp, closeUpdatePrompt } = usePWA()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
      <button
        onClick={closeUpdatePrompt}
        className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <RefreshCw className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold">Actualización disponible</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Hay una nueva versión disponible
          </p>
          <div className="flex gap-2 mt-3">
            <Button onClick={updateApp} size="sm">
              Actualizar
            </Button>
            <Button onClick={closeUpdatePrompt} variant="outline" size="sm">
              Después
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
