import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink, Info, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type UpdateInfo = {
  available: boolean
  latest_version?: string
  release_notes?: string
  mandatory?: boolean
  channel?: string
}

const REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes
const DISMISS_STORAGE_KEY = 'core_update_dismissed_version'

export function CoreUpdateBanner() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem(DISMISS_STORAGE_KEY)
      : null
  )

  const { data } = useQuery({
    queryKey: ['system', 'updates', 'check'],
    queryFn: async () => {
      try {
        const res = await api.get('/system/updates/check')
        if (res.status === 204) return null
        if (res.data?.success && res.data?.data) {
          return res.data.data as UpdateInfo
        }
        return null
      } catch {
        // Silent failure — update check must never break the UI
        return null
      }
    },
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: false,
  })

  // Reset dismissal when a brand-new version is seen
  useEffect(() => {
    if (
      data?.available &&
      data.latest_version &&
      dismissedVersion &&
      data.latest_version !== dismissedVersion
    ) {
      setDismissedVersion(null)
      localStorage.removeItem(DISMISS_STORAGE_KEY)
    }
  }, [data, dismissedVersion])

  if (!data || !data.available) return null

  const version = data.latest_version || ''
  const mandatory = Boolean(data.mandatory)
  const isDismissed = !mandatory && dismissedVersion === version
  if (isDismissed) return null

  const dismiss = () => {
    if (mandatory) return
    setDismissedVersion(version)
    localStorage.setItem(DISMISS_STORAGE_KEY, version)
  }

  return (
    <>
      <div
        role='alert'
        className={cn(
          'flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm',
          mandatory
            ? 'border-destructive/30 bg-destructive text-white'
            : 'bg-primary/10 text-foreground border-primary/20'
        )}
      >
        <div className='flex min-w-0 items-center gap-2'>
          {mandatory ? (
            <AlertTriangle className='h-4 w-4 shrink-0' />
          ) : (
            <Info className='h-4 w-4 shrink-0' />
          )}
          <span className='truncate'>
            {mandatory
              ? `Actualización obligatoria disponible: ${version}`
              : `Nueva versión ${version} disponible`}
          </span>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Button
            size='sm'
            variant={mandatory ? 'secondary' : 'outline'}
            onClick={() => setDialogOpen(true)}
          >
            <ExternalLink className='h-3.5 w-3.5' />
            Ver detalles
          </Button>
          {!mandatory && (
            <Button
              size='icon'
              variant='ghost'
              className='h-7 w-7'
              onClick={dismiss}
              title='Descartar'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Nueva versión {version}</DialogTitle>
            <DialogDescription>
              {mandatory
                ? 'Esta actualización es obligatoria.'
                : 'Revisa las notas de la versión antes de actualizar.'}
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[60vh] overflow-y-auto'>
            {data.release_notes ? (
              <pre className='bg-muted rounded-md p-4 font-mono text-xs whitespace-pre-wrap'>
                {data.release_notes}
              </pre>
            ) : (
              <p className='text-muted-foreground text-sm'>
                Esta versión no incluye notas de release.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
