import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Package, CheckCircle2, XCircle, Trash2, Play, Pause } from 'lucide-react'
import { useMetacore } from '@asteby/metacore-sdk/react'
import type { CatalogEntry, Installation } from '@asteby/metacore-sdk'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/**
 * MetacoreMarketplacePage — lists every addon published in the host catalog
 * and exposes install / enable / disable / uninstall actions.
 */
export function MetacoreMarketplacePage() {
  const { client } = useMetacore()
  const qc = useQueryClient()

  const catalog = useQuery({
    queryKey: ['metacore', 'catalog'],
    queryFn: () => client.catalog(),
    staleTime: 60 * 1000,
  })

  const installed = useQuery({
    queryKey: ['metacore', 'installed'],
    queryFn: () => client.installed(),
    staleTime: 30 * 1000,
  })

  const installMap = new Map<string, Installation>(
    (installed.data ?? []).map((i) => [i.addon_key, i]),
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['metacore'] })
  }

  const installMut = useMutation({
    mutationFn: (key: string) => client.install(key, {}),
    onSuccess: () => {
      toast.success('Addon instalado')
      invalidate()
    },
    onError: (e: unknown) =>
      toast.error(`No se pudo instalar: ${(e as Error).message}`),
  })

  const enableMut = useMutation({
    mutationFn: (key: string) => client.enable(key),
    onSuccess: () => {
      toast.success('Addon habilitado')
      invalidate()
    },
    onError: (e: unknown) =>
      toast.error(`No se pudo habilitar: ${(e as Error).message}`),
  })

  const disableMut = useMutation({
    mutationFn: (key: string) => client.disable(key),
    onSuccess: () => {
      toast.success('Addon deshabilitado')
      invalidate()
    },
    onError: (e: unknown) =>
      toast.error(`No se pudo deshabilitar: ${(e as Error).message}`),
  })

  const uninstallMut = useMutation({
    mutationFn: (key: string) => client.uninstall(key),
    onSuccess: () => {
      toast.success('Addon desinstalado')
      invalidate()
    },
    onError: (e: unknown) =>
      toast.error(`No se pudo desinstalar: ${(e as Error).message}`),
  })

  const [category, setCategory] = useState<string>('all')

  const entries: CatalogEntry[] = catalog.data ?? []

  const categories = [
    'all',
    ...Array.from(
      new Set(entries.map((e) => e.manifest.category).filter(Boolean) as string[]),
    ),
  ]

  const filtered = entries.filter(
    (e) => category === 'all' || e.manifest.category === category,
  )

  const isLoading = catalog.isLoading || installed.isLoading

  return (
    <div className='flex flex-col h-full bg-background'>
      <div className='border-b px-6 py-5 shrink-0'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Addons</h1>
            <p className='text-sm text-muted-foreground'>
              Extiende tu instancia con módulos publicados en Metacore.
            </p>
          </div>
          <Badge variant='secondary'>{entries.length} disponibles</Badge>
        </div>
        <div className='flex gap-1.5 flex-wrap'>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className='flex-1 px-6 py-6'>
        {isLoading ? (
          <div className='flex items-center justify-center py-24'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-24 text-muted-foreground gap-3'>
            <Package className='h-12 w-12 opacity-20' />
            <p className='text-sm'>No hay addons disponibles.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {filtered.map((entry) => {
              const m = entry.manifest
              const inst = installMap.get(m.key)
              const isInstalled = !!inst || entry.installed
              const isEnabled =
                inst?.status === 'enabled' || entry.enabled === true
              const key = m.key
              return (
                <Card key={key} className='flex flex-col'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-start justify-between gap-2'>
                      <CardTitle className='text-base font-semibold'>
                        {m.name}
                      </CardTitle>
                      {m.category && (
                        <Badge variant='outline' className='text-[10px]'>
                          {m.category}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className='line-clamp-2'>
                      {m.description ?? '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='flex-1 flex flex-col justify-between gap-3'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span>v{m.version}</span>
                      {isInstalled && (
                        <Badge
                          variant={isEnabled ? 'default' : 'secondary'}
                          className='text-[10px]'
                        >
                          {isEnabled ? (
                            <>
                              <CheckCircle2 className='h-3 w-3 mr-1' />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className='h-3 w-3 mr-1' />
                              Inactivo
                            </>
                          )}
                        </Badge>
                      )}
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      <Link
                        to='/addons/$key'
                        params={{ key }}
                        className='text-xs text-primary hover:underline'
                      >
                        Detalles
                      </Link>
                      <div className='flex-1' />
                      {!isInstalled && entry.installable !== false ? (
                        <Button
                          size='sm'
                          disabled={installMut.isPending}
                          onClick={() => installMut.mutate(key)}
                        >
                          {installMut.isPending && installMut.variables === key ? (
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                          ) : (
                            'Instalar'
                          )}
                        </Button>
                      ) : (
                        <>
                          {isEnabled ? (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => disableMut.mutate(key)}
                              disabled={disableMut.isPending}
                            >
                              <Pause className='h-3.5 w-3.5 mr-1' />
                              Deshabilitar
                            </Button>
                          ) : (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => enableMut.mutate(key)}
                              disabled={enableMut.isPending}
                            >
                              <Play className='h-3.5 w-3.5 mr-1' />
                              Habilitar
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => uninstallMut.mutate(key)}
                            disabled={uninstallMut.isPending}
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
