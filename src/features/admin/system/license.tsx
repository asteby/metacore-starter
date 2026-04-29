import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import {
  Copy,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

type LicenseInfo = {
  installation_id: string
  status: string
  plan: string
  entitled_addons: string[]
  entitled_features: string[]
  max_users: number
  max_orgs: number
  max_branches: number
  update_channel: string
  expires_at: string | null
  validated_at: string | null
  source: string
}

function formatDate(v: string | null): string {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() || 'unknown'
  if (s === 'active' || s === 'trial') {
    return (
      <Badge className='bg-emerald-600 text-white hover:bg-emerald-600'>
        <ShieldCheck className='h-3 w-3' />
        {s === 'trial' ? 'Prueba' : 'Activa'}
      </Badge>
    )
  }
  if (s === 'offline') {
    return (
      <Badge className='bg-amber-500 text-white hover:bg-amber-500'>
        <AlertTriangle className='h-3 w-3' />
        Sin conexión
      </Badge>
    )
  }
  if (s === 'expired') {
    return <Badge variant='destructive'>Expirada</Badge>
  }
  return <Badge variant='secondary'>{s}</Badge>
}

export function SystemLicense() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'system', 'license'],
    queryFn: async () => {
      const { data } = await api.get('/system/license')
      return data?.data as LicenseInfo
    },
  })

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/system/license/refresh')
      return data
    },
    onSuccess: () => {
      toast.success('Licencia actualizada')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'system', 'license'],
      })
    },
    onError: (err) => {
      let message = 'No se pudo refrescar la licencia'
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message
      }
      toast.error(message)
    },
  })

  const copyInstallation = async () => {
    if (!data?.installation_id) return
    try {
      await navigator.clipboard.writeText(data.installation_id)
      toast.success('ID de instalación copiado')
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  return (
    <div className='px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-5xl'>
      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Mi licencia
          </h1>
          <p className='text-muted-foreground'>
            Información de entitlement de esta instalación.
          </p>
        </div>
        <Button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          variant='outline'
        >
          {refreshMutation.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <RefreshCw className='h-4 w-4' />
          )}
          Refrescar licencia ahora
        </Button>
      </div>
      <Separator className='my-6' />

      {isLoading && (
        <div className='space-y-4'>
          <Skeleton className='h-40 w-full rounded-xl' />
          <Skeleton className='h-40 w-full rounded-xl' />
        </div>
      )}

      {isError && (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <AlertTriangle className='text-muted-foreground h-10 w-10' />
          <p className='text-muted-foreground'>
            No se pudo obtener la información de la licencia.
          </p>
          <Button variant='outline' onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {data && (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <CardTitle>Estado</CardTitle>
                  <CardDescription>
                    Validez actual de la licencia
                  </CardDescription>
                </div>
                {statusBadge(data.status)}
              </div>
            </CardHeader>
            <CardContent>
              <dl className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                <div>
                  <dt className='text-muted-foreground'>Plan</dt>
                  <dd className='font-medium capitalize'>
                    {data.plan || '—'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Canal de updates</dt>
                  <dd className='font-medium capitalize'>
                    {data.update_channel || 'stable'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Expira</dt>
                  <dd className='font-medium'>{formatDate(data.expires_at)}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Última validación</dt>
                  <dd className='font-medium'>
                    {formatDate(data.validated_at)}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Fuente</dt>
                  <dd className='font-medium'>{data.source || '—'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identificador de instalación</CardTitle>
              <CardDescription>
                Usa este ID cuando contactes al soporte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                <code className='bg-muted flex-1 truncate rounded px-3 py-2 font-mono text-sm'>
                  {data.installation_id || '—'}
                </code>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={copyInstallation}
                  disabled={!data.installation_id}
                  title='Copiar'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Límites</CardTitle>
              <CardDescription>
                Capacidades contratadas en tu plan (0 = ilimitado)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className='grid grid-cols-3 gap-4 text-sm'>
                <div>
                  <dt className='text-muted-foreground'>Usuarios</dt>
                  <dd className='text-xl font-semibold'>
                    {data.max_users || '∞'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Organizaciones</dt>
                  <dd className='text-xl font-semibold'>
                    {data.max_orgs || '∞'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Sucursales</dt>
                  <dd className='text-xl font-semibold'>
                    {data.max_branches || '∞'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complementos incluidos</CardTitle>
              <CardDescription>
                Addons que tu licencia permite instalar desde el marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.entitled_addons.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No hay complementos incluidos en tu plan actual.
                </p>
              ) : (
                <div className='flex flex-wrap gap-1.5'>
                  {data.entitled_addons.map((a) => (
                    <Badge key={a} variant='secondary'>
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Funcionalidades habilitadas</CardTitle>
              <CardDescription>
                Feature flags entregados por tu licencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.entitled_features.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No hay funcionalidades adicionales habilitadas.
                </p>
              ) : (
                <div className='flex flex-wrap gap-1.5'>
                  {data.entitled_features.map((f) => (
                    <Badge key={f} variant='outline'>
                      {f}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
