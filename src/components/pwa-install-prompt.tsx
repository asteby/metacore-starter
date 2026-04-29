import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/use-pwa'
import { useEffect, useState } from 'react'

export function PWAInstallPrompt() {
  const { isInstallable, installApp } = usePWA()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isInstallable) {
      setShow(true)
    }
  }, [isInstallable])

  const handleInstall = async () => {
    const installed = await installApp()
    if (installed) {
      setShow(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!show || !isInstallable) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold">Instalar App</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Instala la app para acceso rápido y funcionalidad offline
          </p>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleInstall} size="sm">
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
