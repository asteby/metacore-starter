import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Save } from 'lucide-react'
import { useMetacore } from '@asteby/metacore-sdk/react'
import type { SettingDef, Installation } from '@asteby/metacore-sdk'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * MetacoreAddonDetailPage — renders the full manifest of a single addon
 * (capabilities, permissions, nav) and an auto-generated settings form bound
 * to the backing installation (if any).
 */
export function MetacoreAddonDetailPage() {
  const { key } = useParams({ strict: false }) as { key: string }
  const { client } = useMetacore()
  const qc = useQueryClient()

  const detail = useQuery({
    queryKey: ['metacore', 'catalog', key],
    queryFn: () => client.detail(key),
  })

  const installed = useQuery({
    queryKey: ['metacore', 'installed'],
    queryFn: () => client.installed(),
    staleTime: 30 * 1000,
  })

  const installation: Installation | undefined = useMemo(
    () => installed.data?.find((i) => i.addon_key === key),
    [installed.data, key],
  )

  const settingsMut = useMutation({
    mutationFn: (settings: Record<string, unknown>) =>
      client.updateSettings(key, settings),
    onSuccess: () => {
      toast.success('Ajustes guardados')
      qc.invalidateQueries({ queryKey: ['metacore', 'installed'] })
    },
    onError: (e: unknown) =>
      toast.error(`No se pudo guardar: ${(e as Error).message}`),
  })

  const [form, setForm] = useState<Record<string, unknown>>({})

  const manifest = detail.data?.manifest
  useEffect(() => {
    if (!manifest) return
    const next: Record<string, unknown> = {}
    for (const s of manifest.settings ?? []) {
      next[s.key] =
        installation?.settings?.[s.key] ?? s.default_value ?? ''
    }
    setForm(next)
  }, [manifest, installation])

  if (detail.isLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (detail.isError || !manifest) {
    return (
      <div className='p-6'>
        <p className='text-sm text-destructive'>
          No se pudo cargar el addon <code>{key}</code>.
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full bg-background overflow-auto'>
      <div className='border-b px-6 py-5'>
        <Link
          to='/addons'
          className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3'
        >
          <ChevronLeft className='h-3 w-3' />
          Volver a addons
        </Link>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {manifest.name}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {manifest.description ?? '—'}
            </p>
            <div className='mt-2 flex flex-wrap gap-1.5'>
              <Badge variant='outline'>v{manifest.version}</Badge>
              {manifest.category && <Badge variant='secondary'>{manifest.category}</Badge>}
              {manifest.author && (
                <Badge variant='outline' className='font-normal'>
                  {manifest.author}
                </Badge>
              )}
            </div>
          </div>
          <div>
            {installation ? (
              <Badge
                variant={installation.status === 'enabled' ? 'default' : 'secondary'}
              >
                {installation.status === 'enabled' ? 'Activo' : 'Inactivo'}
              </Badge>
            ) : (
              <Badge variant='outline'>No instalado</Badge>
            )}
          </div>
        </div>
      </div>

      <div className='grid gap-6 p-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Capacidades</CardTitle>
            <CardDescription>
              Lo que el addon puede hacer dentro de tu organización.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {(manifest.capabilities ?? []).length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                El addon no declara capacidades adicionales.
              </p>
            ) : (
              (manifest.capabilities ?? []).map((c, i) => (
                <div
                  key={`${c.kind}-${c.target}-${i}`}
                  className='rounded-md border p-2 text-xs'
                >
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-[10px]'>
                      {c.kind}
                    </Badge>
                    <code className='text-muted-foreground'>{c.target}</code>
                  </div>
                  {c.reason && (
                    <p className='text-[11px] text-muted-foreground mt-1'>
                      {c.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Ajustes</CardTitle>
            <CardDescription>
              {installation
                ? 'Modifica los parámetros de esta instalación.'
                : 'Instala el addon para configurar sus ajustes.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {(manifest.settings ?? []).length === 0 && (
              <p className='text-sm text-muted-foreground'>
                Este addon no expone ajustes configurables.
              </p>
            )}
            {(manifest.settings ?? []).map((s) => (
              <SettingField
                key={s.key}
                def={s}
                value={form[s.key]}
                onChange={(v) => setForm((prev) => ({ ...prev, [s.key]: v }))}
                disabled={!installation}
              />
            ))}
            {installation && (manifest.settings ?? []).length > 0 && (
              <div className='flex justify-end pt-2'>
                <Button
                  size='sm'
                  disabled={settingsMut.isPending}
                  onClick={() => settingsMut.mutate(form)}
                >
                  {settingsMut.isPending ? (
                    <Loader2 className='h-3.5 w-3.5 mr-1.5 animate-spin' />
                  ) : (
                    <Save className='h-3.5 w-3.5 mr-1.5' />
                  )}
                  Guardar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface SettingFieldProps {
  def: SettingDef
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
}

function SettingField({ def, value, onChange, disabled }: SettingFieldProps) {
  return (
    <div className='space-y-1.5'>
      <Label className='text-xs font-medium'>{def.label}</Label>
      {def.type === 'boolean' ? (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      ) : def.type === 'select' ? (
        <Select
          value={value == null ? '' : String(value)}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger className='h-9 text-sm w-full'>
            <SelectValue placeholder='Selecciona una opción' />
          </SelectTrigger>
          <SelectContent>
            {(def.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={def.type === 'password' ? 'password' : def.type === 'number' ? 'number' : 'text'}
          value={value == null ? '' : String(value)}
          onChange={(e) =>
            onChange(def.type === 'number' ? Number(e.target.value) : e.target.value)
          }
          className='h-9 text-sm'
          disabled={disabled}
        />
      )}
    </div>
  )
}
