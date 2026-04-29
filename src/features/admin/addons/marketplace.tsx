import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import {
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  Package,
  ShieldAlert,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type CatalogEntry = {
  key: string
  name: string
  description?: string
  version: string
  category?: string
  icon?: string
  author?: string
  verified?: boolean
  price?: number
  features?: string[]
  screenshots?: string[]
  entitled: boolean
  installable: boolean
  reason?: string
}

type CategoryOption = { value: string; label: string }

const CATEGORIES: CategoryOption[] = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'industry', label: 'Industria' },
  { value: 'integration', label: 'Integraciones' },
  { value: 'utility', label: 'Utilidades' },
]

function translateInstallError(
  status: number | undefined,
  reason: string | undefined,
  fallback: string
): string {
  if (status === 403 && reason === 'not_entitled') {
    return 'Este complemento no está incluido en tu plan actual. Actualiza tu licencia para instalarlo.'
  }
  if (status === 409 && reason === 'incompatible_core') {
    return 'Este complemento requiere una versión más reciente del núcleo. Actualiza el sistema primero.'
  }
  if (status === 422 && reason === 'invalid_signature') {
    return 'La firma del complemento no es válida. No se instalará por seguridad.'
  }
  if (status === 422 && reason === 'migration_checksum_mismatch') {
    return 'Las migraciones del complemento no coinciden con el checksum esperado. Instalación abortada.'
  }
  return fallback
}

export function AddonsMarketplace() {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState<string>('all')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'addons', 'marketplace', category],
    queryFn: async () => {
      const params = category !== 'all' ? { category } : undefined
      const { data } = await api.get('/addons/marketplace/catalog', { params })
      return (data?.data ?? []) as CatalogEntry[]
    },
  })

  const installMutation = useMutation({
    mutationFn: async (entry: CatalogEntry) => {
      const { data } = await api.post(
        `/addons/marketplace/install/${encodeURIComponent(entry.key)}`
      )
      return data
    },
    onSuccess: (_data, entry) => {
      toast.success(`${entry.name} instalado correctamente`)
      queryClient.invalidateQueries({
        queryKey: ['admin', 'addons', 'marketplace'],
      })
    },
    onError: (err, entry) => {
      let status: number | undefined
      let reason: string | undefined
      let message = `No se pudo instalar ${entry.name}`
      if (axios.isAxiosError(err)) {
        status = err.response?.status
        reason = err.response?.data?.reason
        if (err.response?.data?.message) message = err.response.data.message
      }
      toast.error(translateInstallError(status, reason, message))
    },
  })

  return (
    <div className='px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl'>
      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Marketplace de complementos
          </h1>
          <p className='text-muted-foreground'>
            Descubre e instala módulos oficiales y verificados para ampliar tu
            plataforma.
          </p>
        </div>
        <div className='w-full md:w-64'>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator className='my-6' />

      {isLoading && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-56 w-full rounded-xl' />
          ))}
        </div>
      )}

      {isError && (
        <div className='flex flex-col items-center gap-3 py-12 text-center'>
          <ShieldAlert className='text-muted-foreground h-10 w-10' />
          <p className='text-muted-foreground'>
            No se pudo cargar el catálogo del marketplace.
          </p>
          <Button variant='outline' onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div className='text-muted-foreground py-12 text-center'>
          No hay complementos disponibles en esta categoría.
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {data.map((entry) => (
            <AddonCard
              key={entry.key}
              entry={entry}
              installing={
                installMutation.isPending &&
                installMutation.variables?.key === entry.key
              }
              onInstall={() => installMutation.mutate(entry)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type AddonCardProps = {
  entry: CatalogEntry
  installing: boolean
  onInstall: () => void
}

function AddonCard({ entry, installing, onInstall }: AddonCardProps) {
  const statusBadge = (() => {
    if (entry.entitled && entry.installable) {
      return (
        <Badge className='bg-emerald-600 text-white hover:bg-emerald-600'>
          <CheckCircle2 className='h-3 w-3' />
          Disponible
        </Badge>
      )
    }
    if (entry.reason === 'incompatible_core') {
      return (
        <Badge className='bg-orange-500 text-white hover:bg-orange-500'>
          <ShieldAlert className='h-3 w-3' />
          Requiere actualizar núcleo
        </Badge>
      )
    }
    return (
      <Badge variant='secondary'>
        <Lock className='h-3 w-3' />
        No incluido en tu plan
      </Badge>
    )
  })()

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
              {entry.icon ? (
                <img
                  src={entry.icon}
                  alt=''
                  className='h-6 w-6 object-contain'
                />
              ) : (
                <Package className='text-muted-foreground h-5 w-5' />
              )}
            </div>
            <div className='min-w-0'>
              <CardTitle className='truncate'>{entry.name}</CardTitle>
              <div className='text-muted-foreground mt-0.5 flex items-center gap-2 text-xs'>
                <span>v{entry.version}</span>
                {entry.category && (
                  <>
                    <span>·</span>
                    <span className='capitalize'>{entry.category}</span>
                  </>
                )}
                {entry.verified && (
                  <>
                    <span>·</span>
                    <span className='inline-flex items-center gap-1 text-emerald-600'>
                      <ShieldCheck className='h-3 w-3' />
                      Verificado
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {statusBadge}
        </div>
        {entry.description && (
          <CardDescription className='line-clamp-3'>
            {entry.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='flex-1'>
        {entry.features && entry.features.length > 0 && (
          <ul className='text-muted-foreground space-y-1 text-xs'>
            {entry.features.slice(0, 3).map((f, i) => (
              <li key={i} className='flex items-start gap-1.5'>
                <Star className='mt-0.5 h-3 w-3 shrink-0 text-amber-500' />
                <span className='truncate'>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className='flex items-center justify-between gap-2'>
        <div className='text-muted-foreground text-xs'>
          {entry.author ? `Por ${entry.author}` : ''}
        </div>
        <Button
          size='sm'
          disabled={!entry.installable || installing}
          onClick={onInstall}
        >
          {installing ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              Instalando
            </>
          ) : (
            <>
              <Download className='h-4 w-4' />
              Instalar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
