import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useMetadataCache } from '@/stores/metadata-cache'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Webhook,
  Search,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Package,
  Link2,
  CheckCheck,
  X,
  Wrench,
  Warehouse,
  Hammer,
  ClipboardList,
  Truck,
  Users as UsersIcon,
  FileText,
  Cog,
  Box,
  Settings,
  Puzzle,
  Upload,
  Download,
  Check,
  Shield,
  Globe,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Simple markdown-to-HTML renderer for addon readmes
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<li class="flex items-start gap-2 ml-1"><span class="text-muted-foreground mt-1.5 shrink-0">•</span><span>$1</span></li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^]*?<\/li>\n?)+)/g, '<ul class="space-y-1 my-2">$1</ul>')
    // Paragraphs: double newline
    .replace(/\n\n(?!<)/g, '</p><p class="mt-2">')
    // Single newlines within paragraphs
    .replace(/\n(?!<)/g, '<br/>')
  // Wrap in paragraph if not starting with a tag
  if (!html.startsWith('<')) html = '<p>' + html + '</p>'
  return html
}

// resource_type → 'github_repo' | 'google_calendar'
// Maps to GET /api/oauth/:provider/resources
const RESOURCE_TYPE_PROVIDER: Record<string, string> = {
  github_repo: 'github',
  google_calendar: 'google',
}

interface CredentialField {
  key: string
  label: string
  description?: string
  required: boolean
  secret: boolean
  oauth_provider?: string  // 'github' | 'google' — if set, OAuth flow is available
  resource_type?: string   // 'github_repo' | 'google_calendar' — if set, show resource picker
}

interface ToolItem {
  id: string
  name: string
  description: string
  enabled_by_default: boolean
}

interface MarketplaceIntegration {
  id: string
  slug: string
  name: string
  description: string
  category: string
  tags: string[]
  icon_type: 'brand' | 'lucide' | 'url'
  icon_slug: string
  icon_color: string
  credentials: CredentialField[]
  tools: ToolItem[]
}

interface OAuthStatus {
  connected: boolean
  scope?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos',
  communication: 'Comunicación',
  dev: 'Desarrollo',
  productivity: 'Productividad',
  payments: 'Pagos',
  crm: 'CRM',
  research: 'Investigación',
  logistics: 'Logística',
  email: 'Email',
  ai: 'Inteligencia Artificial',
  utilities: 'Utilidades',
  custom: 'Personalizado',
  industry: 'Industria',
  integration: 'Integración',
}

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  github: { label: 'GitHub', color: '#181717' },
  google: { label: 'Google', color: '#4285F4' },
}

// ─── Icon component ────────────────────────────────────────────────────────

function IntegrationIcon({
  integration,
  size = 'md',
}: {
  integration: MarketplaceIntegration
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 36 : 28
  const containerCls =
    size === 'sm'
      ? 'h-9 w-9'
      : size === 'lg'
        ? 'h-14 w-14'
        : 'h-11 w-11'

  if (integration.icon_type === 'brand' || integration.icon_type === 'url') {
    const src =
      integration.icon_type === 'url'
        ? integration.icon_slug
        : `https://cdn.simpleicons.org/${integration.icon_slug}/${integration.icon_color}`
    return (
      <div
        className={cn(
          containerCls,
          'flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm shrink-0'
        )}
      >
        <img
          src={src}
          alt={integration.name}
          width={dim}
          height={dim}
          className='object-contain'
          onError={(e) => {
            const img = e.target as HTMLImageElement
            img.style.display = 'none'
            const parent = img.parentElement
            if (parent) {
              parent.innerHTML = `<span style="font-size:${dim * 0.6}px">🔗</span>`
            }
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        containerCls,
        'flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 shrink-0'
      )}
    >
      <Webhook className='text-indigo-500' style={{ width: dim, height: dim }} />
    </div>
  )
}

// ─── OAuth connect button ──────────────────────────────────────────────────

function OAuthConnectButton({
  provider,
  onConnected,
}: {
  provider: string
  onConnected: () => void
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const popupRef = useRef<Window | null>(null)

  const { data: status, refetch } = useQuery<OAuthStatus>({
    queryKey: ['oauth-status', provider],
    queryFn: async () => {
      const res = await api.get(`/oauth/${provider}/status`)
      return res.data
    },
  })

  // Listen for postMessage from the popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'oauth_success' && e.data?.provider === provider) {
        setLoading(false)
        refetch().then(() => onConnected())
        toast.success(t('marketplace.connect_success', { name: PROVIDER_LABELS[provider]?.label ?? provider }))
      } else if (e.data?.type === 'oauth_error') {
        setLoading(false)
        toast.error(e.data.message || t('marketplace.connect_error'))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [provider, refetch, onConnected])

  function openPopup() {
    setLoading(true)
    const token = localStorage.getItem('auth_token') || ''
    const apiBase = (import.meta.env.VITE_API_URL as string) || '/api'
    const connectPath =
      provider === 'github' ? '/github/install' : `/oauth/${provider}/connect`
    const url = `${apiBase}${connectPath}?token=${encodeURIComponent(token)}`
    const w = 600, h = 700
    const left = window.screenX + (window.outerWidth - w) / 2
    const top = window.screenY + (window.outerHeight - h) / 2
    popupRef.current = window.open(
      url,
      `oauth_${provider}`,
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    )
    // Poll for popup close — also refetch status as fallback when
    // Cross-Origin-Opener-Policy blocks window.opener.postMessage.
    const interval = setInterval(() => {
      try {
        if (popupRef.current?.closed) {
          clearInterval(interval)
          setLoading(false)
          // Fallback: re-check OAuth status in case postMessage was blocked by COOP
          refetch().then((res) => {
            if (res.data?.connected) {
              onConnected()
            }
          })
        }
      } catch {
        // COOP may block .closed — just keep polling
      }
    }, 500)
  }

  if (status?.connected) {
    return (
      <div className='flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 px-3 py-2'>
        <CheckCheck className='h-4 w-4 text-green-600 shrink-0' />
        <span className='text-xs font-medium text-green-700 dark:text-green-400 flex-1'>
          Conectado con {PROVIDER_LABELS[provider]?.label ?? provider}
        </span>
        <button
          onClick={openPopup}
          className='text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline'
        >
          Reconectar
        </button>
      </div>
    )
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='w-full justify-start gap-2 h-9'
      onClick={openPopup}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Link2 className='h-4 w-4' />
      )}
      Conectar con {PROVIDER_LABELS[provider]?.label ?? provider}
    </Button>
  )
}

// ─── Resource picker ───────────────────────────────────────────────────────

interface ResourceOption { value: string; label: string }

function ResourcePicker({
  resourceType,
  value,
  onChange,
  label,
}: {
  resourceType: string
  value: string
  onChange: (v: string) => void
  label: string
  required?: boolean
}) {
  const provider = RESOURCE_TYPE_PROVIDER[resourceType]
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  const { data: oauthStatus } = useQuery<OAuthStatus>({
    queryKey: ['oauth-status', provider],
    queryFn: async () => {
      const res = await api.get(`/oauth/${provider}/status`)
      return res.data
    },
    enabled: !!provider,
  })

  const { data: resources = [], isLoading } = useQuery<ResourceOption[]>({
    queryKey: ['oauth-resources', provider],
    queryFn: async () => {
      const res = await api.get(`/oauth/${provider}/resources`)
      return res.data.success ? res.data.data : []
    },
    enabled: !!provider && !!oauthStatus?.connected,
    staleTime: 2 * 60 * 1000,
  })

  function toggle(val: string) {
    const next = selected.includes(val)
      ? selected.filter(s => s !== val)
      : [...selected, val]
    onChange(next.join(','))
  }

  if (!oauthStatus?.connected) {
    return (
      <div className='flex h-9 items-center rounded-md border border-dashed border-muted-foreground/30 px-3 text-xs text-muted-foreground'>
        Conecta tu cuenta para seleccionar
      </div>
    )
  }

  return (
    <div className='space-y-2'>
      {isLoading ? (
        <div className='flex h-9 items-center gap-2 text-muted-foreground text-sm'>
          <Loader2 className='h-3.5 w-3.5 animate-spin' /> Cargando {label.toLowerCase()}...
        </div>
      ) : resources.length === 0 ? (
        <div className='flex h-9 items-center text-xs text-muted-foreground'>Sin resultados</div>
      ) : (
        <div className='max-h-40 overflow-y-auto rounded-md border divide-y'>
          {resources.map((r) => {
            const checked = selected.includes(r.value)
            return (
              <button
                key={r.value}
                type='button'
                onClick={() => toggle(r.value)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                  checked ? 'bg-primary/5' : 'hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                  checked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                )}>
                  {checked && <CheckCheck className='h-2.5 w-2.5 text-primary-foreground' />}
                </div>
                <span className='flex-1 truncate'>{r.label}</span>
              </button>
            )
          })}
        </div>
      )}
      {selected.length > 0 && (
        <p className='text-xs text-muted-foreground'>
          {selected.length} {selected.length === 1 ? 'repositorio seleccionado' : 'repositorios seleccionados'}
        </p>
      )}
    </div>
  )
}

// ─── Addon support ──────────────────────────────────────────────────────────

const addonIconMap: Record<string, LucideIcon> = {
  Wrench, ClipboardList, Warehouse, Hammer, Package, Settings,
  Box, Cog, FileText, Truck, Users: UsersIcon, Puzzle,
}

interface AddonSettingDef {
  key: string
  label: string
  type: string
  default_value?: unknown
}

interface AddonModuleRef {
  key: string
  label: string
}

interface Addon {
  key: string
  name: string
  description: string
  version: string
  category: string
  icon: string
  requires: AddonModuleRef[]
  models: AddonModuleRef[]
  settings?: AddonSettingDef[]
  installed: boolean
  status: string
  author?: string
  website?: string
  license?: string
  readme?: string
  screenshots?: string[]
  features?: string[]
  price?: string
}

// ─── Addon Settings Form (shared between card dialog and detail modal) ─────

function AddonSettingsForm({
  addon,
  addonSettings,
  setAddonSettings,
  onSave,
  onCancel,
  isSaving,
}: {
  addon: Addon
  addonSettings: Record<string, unknown>
  setAddonSettings: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}) {
  return (
    <div className='space-y-4'>
      {addon.settings?.map((setting) => (
        <div key={setting.key} className='space-y-2'>
          <Label htmlFor={`detail-${setting.key}`}>{setting.label}</Label>
          {setting.type === 'boolean' ? (
            <Switch
              id={`detail-${setting.key}`}
              checked={!!addonSettings[setting.key]}
              onCheckedChange={(checked) =>
                setAddonSettings(prev => ({ ...prev, [setting.key]: checked }))
              }
            />
          ) : (
            <Input
              id={`detail-${setting.key}`}
              type={setting.type === 'number' ? 'number' : 'text'}
              value={String(addonSettings[setting.key] ?? '')}
              onChange={(e) =>
                setAddonSettings(prev => ({
                  ...prev,
                  [setting.key]: setting.type === 'number' ? Number(e.target.value) : e.target.value,
                }))
              }
            />
          )}
        </div>
      ))}
      <div className='flex justify-end gap-2 pt-2'>
        <Button variant='outline' size='sm' onClick={onCancel}>Cancelar</Button>
        <Button size='sm' onClick={onSave} disabled={isSaving}>
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ─── Addon Detail Modal ────────────────────────────────────────────────────

function AddonDetailModal({
  addon,
  open,
  onOpenChange,
}: {
  addon: Addon
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
  const [addonSettings, setAddonSettings] = useState<Record<string, unknown>>({})

  const Icon = addonIconMap[addon.icon] || Box

  // Invalidate all addon-affected caches: sidebar navigation + metadata (actions, columns)
  const invalidateAddonCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['addons-available'] })
    queryClient.invalidateQueries({ queryKey: ['addon-navigation'] })
    queryClient.invalidateQueries({ queryKey: ['navigation'] })
    useMetadataCache.setState({ cache: {}, modalCache: {}, prefetched: false })
    useMetadataCache.getState().prefetchAll()
  }

  const installMutation = useMutation({
    mutationFn: (key: string) => api.post(`/addons/${key}/install`),
    onSuccess: () => {
      invalidateAddonCaches()
      toast.success(t('addon_store.installed'))
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  })

  const uninstallMutation = useMutation({
    mutationFn: (key: string) => api.post(`/addons/${key}/uninstall`),
    onSuccess: () => {
      invalidateAddonCaches()
      toast.success(t('addon_store.uninstalled'))
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  })

  const toggleMutation = useMutation({
    mutationFn: (key: string) => api.post(`/addons/${key}/${addon.status === 'enabled' ? 'disable' : 'enable'}`),
    onSuccess: () => {
      invalidateAddonCaches()
    },
  })

  const saveSettingsMutation = useMutation({
    mutationFn: ({ key, settings }: { key: string; settings: Record<string, unknown> }) =>
      api.put(`/addons/${key}/settings`, settings),
    onSuccess: () => {
      toast.success(t('addon_store.settings_saved'))
    },
  })

  const loadSettings = async () => {
    try {
      const res = await api.get(`/addons/${addon.key}/settings`)
      setAddonSettings(res.data?.data || {})
    } catch {
      setAddonSettings({})
    }
  }

  useEffect(() => {
    if (open && addon.installed) {
      loadSettings()
    }
    if (open) {
      setActiveTab('overview')
    }
  }, [open, addon.key, addon.installed])

  const tabs: { key: 'overview' | 'settings'; label: string }[] = [
    { key: 'overview', label: 'General' },
    ...(addon.installed && addon.settings && addon.settings.length > 0
      ? [{ key: 'settings' as const, label: 'Configuracion' }]
      : []),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl p-0 gap-0'>
        {/* Header */}
        <div className='relative px-6 pt-5 pb-3 border-b border-border/50 shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='h-12 w-12 flex items-center justify-center rounded-xl bg-muted border border-border shrink-0'>
              <Icon className='h-6 w-6 text-foreground' />
            </div>
            <div className='flex-1 min-w-0'>
              <DialogTitle className='text-base font-semibold'>{addon.name}</DialogTitle>
              <div className='flex items-center gap-1.5 mt-0.5 flex-wrap'>
                <span className='text-[11px] text-muted-foreground'>
                  {addon.author || 'Sin autor'}
                </span>
                <span className='text-muted-foreground/40'>·</span>
                <span className='text-[11px] text-muted-foreground font-mono'>v{addon.version}</span>
                <Badge variant='secondary' className='text-[9px] capitalize h-4 px-1.5'>
                  {CATEGORY_LABELS[addon.category] ?? addon.category}
                </Badge>
                <Badge variant='outline' className='text-[9px] h-4 px-1.5'>
                  {addon.price && addon.price !== 'free' ? addon.price : t('addon_store.free', 'Gratis')}
                </Badge>
              </div>
            </div>
          </div>
          <DialogDescription className='text-xs mt-2 leading-relaxed'>
            {addon.description}
          </DialogDescription>

          {/* Actions row */}
          <div className='flex items-center gap-2 mt-3'>
            {!addon.installed ? (
              <Button
                size='sm'
                className='gap-1.5 h-9 px-5'
                onClick={() => installMutation.mutate(addon.key)}
                disabled={installMutation.isPending}
              >
                {installMutation.isPending ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Package className='h-3.5 w-3.5' />
                )}
                {t('addon_store.install')}
              </Button>
            ) : (
              <>
                <Button
                  size='sm'
                  variant={addon.status === 'enabled' ? 'secondary' : 'default'}
                  className='gap-1.5 h-9'
                  onClick={() => toggleMutation.mutate(addon.key)}
                  disabled={toggleMutation.isPending}
                >
                  <div className={cn('h-2 w-2 rounded-full', addon.status === 'enabled' ? 'bg-green-500' : 'bg-gray-400')} />
                  {addon.status === 'enabled' ? t('addon_store.active') : t('addon_store.inactive')}
                </Button>
                {addon.settings && addon.settings.length > 0 && (
                  <Button size='sm' variant='outline' className='gap-1.5 h-9' onClick={() => setActiveTab('settings')}>
                    <Settings className='h-3.5 w-3.5' />
                    {t('addon_store.configure', 'Configurar')}
                  </Button>
                )}
                <Button
                  size='sm'
                  variant='ghost'
                  className='gap-1.5 h-9 text-destructive hover:text-destructive'
                  onClick={() => uninstallMutation.mutate(addon.key)}
                  disabled={uninstallMutation.isPending}
                >
                  <X className='h-3.5 w-3.5' />
                  {t('addon_store.uninstall')}
                </Button>
              </>
            )}
            {/* Download button — always available */}
            <div className='ml-auto'>
              <Button
                size='sm'
                variant='outline'
                className='gap-1.5 h-9'
                onClick={() => {
                  const apiBase = (import.meta.env.VITE_API_URL as string) || '/api'
                  const token = localStorage.getItem('auth_token') || ''
                  window.open(`${apiBase}/addons/${addon.key}/download?token=${encodeURIComponent(token)}`, '_blank')
                }}
              >
                <Download className='h-3.5 w-3.5' />
                {t('addon_store.download', 'Descargar')}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className='flex gap-1 px-6 pt-3 shrink-0'>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className='overflow-y-auto max-h-[45vh] px-6'>
          {activeTab === 'overview' && (
            <div className='space-y-5 py-4'>
              {/* Features */}
              {addon.features && addon.features.length > 0 && (
                <div>
                  <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
                    {t('addon_store.features', 'Características')}
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    {addon.features.map((feature, i) => (
                      <div key={i} className='flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5'>
                        <Check className='h-4 w-4 text-green-500 shrink-0 mt-0.5' />
                        <span className='text-sm leading-snug'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Readme / description */}
              <div>
                <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
                  {addon.readme ? t('addon_store.documentation', 'Documentación') : t('addon_store.description', 'Descripción')}
                </h4>
                <div className='rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed prose-sm'>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(addon.readme || addon.description) }} />
                </div>
              </div>

              {/* Info grid: dependencies + models */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {addon.requires && addon.requires.length > 0 && (
                  <div>
                    <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                      {t('addon_store.dependencies', 'Dependencias')}
                    </h4>
                    <div className='flex flex-wrap gap-1.5'>
                      {addon.requires.map((dep) => (
                        <Badge key={dep.key} variant='outline' className='text-xs'>
                          {dep.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {addon.models && addon.models.length > 0 && (
                  <div>
                    <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                      {t('addon_store.models', 'Modelos')}
                    </h4>
                    <div className='flex flex-wrap gap-1.5'>
                      {addon.models.map((mod) => (
                        <Badge key={mod.key} variant='secondary' className='text-xs'>
                          {mod.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && addon.installed && addon.settings && (
            <div className='py-4'>
              <AddonSettingsForm
                addon={addon}
                addonSettings={addonSettings}
                setAddonSettings={setAddonSettings}
                onSave={() => saveSettingsMutation.mutate({ key: addon.key, settings: addonSettings })}
                onCancel={() => setActiveTab('overview')}
                isSaving={saveSettingsMutation.isPending}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between border-t border-border/50 px-6 py-2.5 shrink-0 text-[11px] text-muted-foreground'>
          <div className='flex items-center gap-3'>
            {addon.website && (
              <a href={addon.website} target='_blank' rel='noopener noreferrer'
                className='flex items-center gap-1 hover:text-foreground transition-colors'>
                <Globe className='h-3 w-3' />
                {addon.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          <div className='flex items-center gap-2.5'>
            {addon.license && (
              <span className='flex items-center gap-1'>
                <Shield className='h-3 w-3' />
                {addon.license}
              </span>
            )}
            <span>{addon.models?.length ?? 0} modelos</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Addon Card ────────────────────────────────────────────────────────────

function AddonCard({ addon }: { addon: Addon }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [addonSettings, setAddonSettings] = useState<Record<string, unknown>>({})

  const Icon = addonIconMap[addon.icon] || Box

  // Invalidate all addon-affected caches: sidebar navigation + metadata (actions, columns)
  const invalidateAddonCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['addons-available'] })
    queryClient.invalidateQueries({ queryKey: ['addon-navigation'] })
    queryClient.invalidateQueries({ queryKey: ['navigation'] })
    useMetadataCache.setState({ cache: {}, modalCache: {}, prefetched: false })
    useMetadataCache.getState().prefetchAll()
  }

  const installMutation = useMutation({
    mutationFn: (key: string) => api.post(`/addons/${key}/install`),
    onSuccess: () => {
      invalidateAddonCaches()
      toast.success(t('addon_store.installed'))
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  })

  const uninstallMutation = useMutation({
    mutationFn: (key: string) => api.post(`/addons/${key}/uninstall`),
    onSuccess: () => {
      invalidateAddonCaches()
      toast.success(t('addon_store.uninstalled'))
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  })

  const toggleMutation = useMutation({
    mutationFn: (key: string) => api.post(`/addons/${key}/${addon.status === 'enabled' ? 'disable' : 'enable'}`),
    onSuccess: () => {
      invalidateAddonCaches()
    },
  })

  const saveSettingsMutation = useMutation({
    mutationFn: ({ key, settings }: { key: string; settings: Record<string, unknown> }) =>
      api.put(`/addons/${key}/settings`, settings),
    onSuccess: () => {
      toast.success(t('addon_store.settings_saved'))
      setSettingsOpen(false)
    },
  })

  const openSettings = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await api.get(`/addons/${addon.key}/settings`)
      setAddonSettings(res.data?.data || {})
    } catch {
      setAddonSettings({})
    }
    setSettingsOpen(true)
  }

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={cn(
          'group relative flex flex-col gap-4 p-5 rounded-2xl border bg-card text-left cursor-pointer',
          'hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
          'transition-all duration-200',
          addon.installed && addon.status === 'enabled' && 'border-primary/30'
        )}
      >
        <div className='flex items-start justify-between gap-2'>
          <div className='h-11 w-11 flex items-center justify-center rounded-xl bg-muted border shrink-0'>
            <Icon className='h-6 w-6' />
          </div>
          <div className='flex gap-1.5'>
            <Badge variant='secondary' className='text-[10px] capitalize font-medium shrink-0'>
              {CATEGORY_LABELS[addon.category] ?? addon.category}
            </Badge>
            {addon.installed && (
              <Badge variant={addon.status === 'enabled' ? 'default' : 'secondary'} className='text-[10px]'>
                {addon.status === 'enabled' ? t('addon_store.active') : t('addon_store.inactive')}
              </Badge>
            )}
          </div>
        </div>

        <div className='flex-1 min-h-0'>
          <div className='flex items-center gap-2'>
            <p className='font-semibold text-sm leading-tight'>{addon.name}</p>
            <span className='text-[10px] text-muted-foreground'>v{addon.version}</span>
          </div>
          <p className='text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed'>
            {addon.description}
          </p>
        </div>

        <div className='flex items-center justify-between pt-0.5'>
          <span className='text-[11px] text-muted-foreground'>
            {addon.models?.length ?? 0} {(addon.models?.length ?? 0) !== 1 ? 'modelos' : 'modelo'}
          </span>
          <div className='flex items-center gap-1.5' onClick={(e) => e.stopPropagation()}>
            {!addon.installed ? (
              <Button size='sm' className='h-7 text-xs px-3' onClick={() => installMutation.mutate(addon.key)} disabled={installMutation.isPending}>
                {t('addon_store.install')}
              </Button>
            ) : (
              <>
                <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={() => toggleMutation.mutate(addon.key)}>
                  <div className={cn('h-2 w-2 rounded-full', addon.status === 'enabled' ? 'bg-green-500' : 'bg-gray-400')} />
                </Button>
                <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={openSettings}>
                  <Settings className='h-3.5 w-3.5' />
                </Button>
                <Button size='sm' variant='ghost' className='h-7 text-xs text-destructive hover:text-destructive px-2' onClick={(e) => { e.stopPropagation(); uninstallMutation.mutate(addon.key) }}>
                  <X className='h-3.5 w-3.5' />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Addon Detail Modal */}
      <AddonDetailModal addon={addon} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* Addon Settings Dialog (legacy — kept for direct settings access) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addon.name} - {t('addon_store.settings')}</DialogTitle>
            <DialogDescription>{t('addon_store.settings_desc')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {addon.settings?.map((setting) => (
              <div key={setting.key} className='space-y-2'>
                <Label htmlFor={setting.key}>{setting.label}</Label>
                {setting.type === 'boolean' ? (
                  <Switch
                    id={setting.key}
                    checked={!!addonSettings[setting.key]}
                    onCheckedChange={(checked) =>
                      setAddonSettings(prev => ({ ...prev, [setting.key]: checked }))
                    }
                  />
                ) : (
                  <Input
                    id={setting.key}
                    type={setting.type === 'number' ? 'number' : 'text'}
                    value={String(addonSettings[setting.key] ?? '')}
                    onChange={(e) =>
                      setAddonSettings(prev => ({
                        ...prev,
                        [setting.key]: setting.type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => saveSettingsMutation.mutate({ key: addon.key, settings: addonSettings })}
              disabled={saveSettingsMutation.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

export function MarketplacePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [installing, setInstalling] = useState<MarketplaceIntegration | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [targetAgentId, setTargetAgentId] = useState<string>('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [step, setStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: integrations = [], isLoading: loadingIntegrations } = useQuery<MarketplaceIntegration[]>({
    queryKey: ['tool-marketplace'],
    queryFn: async () => {
      const res = await api.get('/tool-marketplace')
      return res.data.success ? res.data.data : []
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: addons = [], isLoading: loadingAddons } = useQuery<Addon[]>({
    queryKey: ['addons-available'],
    queryFn: async () => {
      const res = await api.get('/addons/available')
      return res.data?.data || []
    },
  })

  const isLoading = loadingIntegrations || loadingAddons

  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ['agents-for-marketplace'],
    queryFn: async () => {
      const res = await api.get('/data/agents/me')
      if (!res.data.success) return []
      const raw = res.data.data
      return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
    },
  })

  // Upload addon mutation
  const [importedAddon, setImportedAddon] = useState<Addon | null>(null)
  const uploadAddonMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('package', file)
      const res = await api.post('/addons/upload', formData, {
        timeout: 300000, // 5 min timeout for large .so files
      })
      return res.data
    },
    onSuccess: (data) => {
      const addonName = data?.data?.name || data?.name || 'Módulo'
      const hotLoaded = data?.hot_loaded === true
      const msg = hotLoaded
        ? `${addonName} instalado y listo.`
        : `${addonName}: ${t('addon_store.upload_success')}`
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['addons-available'] })
      queryClient.invalidateQueries({ queryKey: ['addon-navigation'] })
      // Open detail modal for the imported addon
      if (data?.data) {
        const manifest = data.data
        setImportedAddon({
          ...manifest,
          installed: false,
          status: '',
          requires: manifest.requires || [],
          models: manifest.models || [],
        })
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('addon_store.upload_error'))
    },
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadAddonMutation.mutate(file)
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  type UnifiedApp =
    | { type: 'integration'; key: string; name: string; description: string; category: string; data: MarketplaceIntegration }
    | { type: 'addon'; key: string; name: string; description: string; category: string; data: Addon }

  const allApps: UnifiedApp[] = [
    ...addons.map((a): UnifiedApp => ({
      type: 'addon', key: `addon-${a.key}`, name: a.name,
      description: a.description, category: a.category, data: a,
    })),
    ...integrations.map((i): UnifiedApp => ({
      type: 'integration', key: `int-${i.slug}`, name: i.name,
      description: i.description, category: i.category, data: i,
    })),
  ]

  const filtered = allApps.filter((app) => {
    const q = search.toLowerCase()
    const matchesSearch = !search || app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)
    const matchesCategory = category === 'all' || app.category === category
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(allApps.map((a) => a.category)))]

  const oauthProviders = Array.from(
    new Set(
      (installing?.credentials ?? [])
        .map((c) => c.oauth_provider)
        .filter(Boolean) as string[]
    )
  )

  const manualCredentials = (installing?.credentials ?? []).filter(
    (c) => !c.oauth_provider
  )

  const allOAuthConnected = oauthProviders.every(
    (p) => (queryClient.getQueryData<OAuthStatus>(['oauth-status', p])?.connected ?? false)
  )

  const allResourcesSelected = manualCredentials
    .filter((c) => c.resource_type && c.required)
    .every((c) => !!credentials[c.key])

  // Tools are optional — can install with 0 selected
  const canInstall =
    !isInstalling &&
    !!targetAgentId &&
    (oauthProviders.length === 0 || allOAuthConnected) &&
    allResourcesSelected

  const steps = (() => {
    const s: string[] = ['agent']
    if (oauthProviders.length > 0 || manualCredentials.length > 0) s.push('connect')
    s.push('actions')
    return s
  })()

  const STEP_LABELS: Record<string, string> = {
    agent: 'Agente destino',
    connect: 'Conexión',
    actions: 'Acciones',
  }

  const currentStep = steps[step] ?? 'agent'
  const isFirstStep = step === 0
  const isLastStep = step === steps.length - 1

  const canNext =
    currentStep === 'agent'
      ? !!targetAgentId
      : currentStep === 'connect'
        ? allOAuthConnected && allResourcesSelected
        : true

  function openInstall(integration: MarketplaceIntegration) {
    setInstalling(integration)
    setCredentials({})
    setStep(0)
    setSelectedTools(
      integration.tools?.filter((t) => t.enabled_by_default).map((t) => t.id) ?? []
    )
    setTargetAgentId(agents[0]?.id ?? '')
  }

  async function handleInstall() {
    if (!installing) return
    setIsInstalling(true)
    try {
      const res = await api.post(`/tool-marketplace/${installing.slug}/install`, {
        agent_id: targetAgentId,
        credentials,
        tools: selectedTools,
      })
      if (res.data.success) {
        const count = res.data.data?.length ?? 0
        toast.success(t(count === 1 ? 'marketplace.tools_installed_one' : 'marketplace.tools_installed_other', { count, name: installing.name }))
        queryClient.invalidateQueries({ queryKey: ['agent-tools'] })
        setInstalling(null)
      } else {
        toast.error(res.data.message || t('marketplace.install_error'))
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('marketplace.install_error'))
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div className='flex flex-col h-full bg-background'>
      {/* Header */}
      <div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-5 shrink-0'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Marketplace</h1>
            <p className='text-sm text-muted-foreground mt-0.5'>
              {t('marketplace.subtitle')}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs font-medium px-2.5 py-1'>
              {allApps.length} apps
            </Badge>
            <input
              ref={fileInputRef}
              type='file'
              accept='.zip'
              onChange={handleFileUpload}
              className='hidden'
            />
            <Button
              size='sm'
              variant='outline'
              className='gap-1.5'
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAddonMutation.isPending}
            >
              {uploadAddonMutation.isPending ? (
                <Loader2 className='h-3.5 w-3.5 animate-spin' />
              ) : (
                <Upload className='h-3.5 w-3.5' />
              )}
              {t('addon_store.import_module', 'Importar módulo')}
            </Button>
          </div>
        </div>

        {/* Search + categories */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
            <Input
              placeholder={t('marketplace.search_placeholder')}
              className='pl-9 h-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className='flex gap-1.5 flex-wrap'>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  category === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className='flex-1 px-6 py-6'>
        {isLoading ? (
          <div className='flex items-center justify-center py-24'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-24 text-muted-foreground gap-3'>
            <Package className='h-12 w-12 opacity-20' />
            <p className='text-sm'>{t('marketplace.no_results')}</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {filtered.map((app) =>
              app.type === 'integration' ? (
                <button
                  key={app.key}
                  onClick={() => openInstall(app.data as MarketplaceIntegration)}
                  className={cn(
                    'group relative flex flex-col gap-4 p-5 rounded-2xl border bg-card text-left',
                    'hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
                    'transition-all duration-200'
                  )}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <IntegrationIcon integration={app.data as MarketplaceIntegration} size='md' />
                    <Badge variant='secondary' className='text-[10px] capitalize font-medium shrink-0'>
                      {CATEGORY_LABELS[app.category] ?? app.category}
                    </Badge>
                  </div>
                  <div className='flex-1 min-h-0'>
                    <p className='font-semibold text-sm leading-tight'>{app.name}</p>
                    <p className='text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed'>
                      {app.description}
                    </p>
                  </div>
                  <div className='flex items-center justify-between pt-0.5'>
                    <span className='text-[11px] text-muted-foreground'>
                      {(app.data as MarketplaceIntegration).tools?.length ?? 0}{' '}
                      {((app.data as MarketplaceIntegration).tools?.length ?? 0) !== 1 ? 'acciones' : 'acción'}
                    </span>
                    <span className='text-xs font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      Instalar <ChevronRight className='h-3 w-3' />
                    </span>
                  </div>
                </button>
              ) : (
                <AddonCard key={app.key} addon={app.data as Addon} />
              )
            )}
          </div>
        )}
      </ScrollArea>

      {/* Imported addon detail modal */}
      {importedAddon && (
        <AddonDetailModal
          addon={importedAddon}
          open={!!importedAddon}
          onOpenChange={(open) => { if (!open) setImportedAddon(null) }}
        />
      )}

      {/* Install dialog */}
      <Dialog open={!!installing} onOpenChange={(open) => { if (!open) setInstalling(null) }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <div className='flex items-center gap-3'>
              {installing && <IntegrationIcon integration={installing} size='sm' />}
              <div>
                <DialogTitle>{installing?.name}</DialogTitle>
                <DialogDescription className='text-xs mt-0.5'>
                  {installing?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step progress bar */}
          <div className='flex items-center gap-1.5 mt-1'>
            {steps.map((s, i) => (
              <div key={s} className='flex items-center gap-1.5 flex-1'>
                <div
                  className={cn(
                    'h-1 rounded-full flex-1 transition-all duration-300',
                    i <= step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              </div>
            ))}
          </div>
          <div className='flex items-center justify-between -mt-1 mb-1'>
            <p className='text-[11px] text-muted-foreground font-medium'>
              {STEP_LABELS[currentStep]}
            </p>
            <p className='text-[11px] text-muted-foreground'>
              {step + 1} / {steps.length}
            </p>
          </div>

          <div>
            {/* Step: Agent */}
            {currentStep === 'agent' && (
              <div className='space-y-3'>
                <p className='text-sm text-muted-foreground'>
                  ¿A qué agente quieres agregar esta integración?
                </p>
                {agents.length > 0 ? (
                  <Select value={targetAgentId} onValueChange={setTargetAgentId}>
                    <SelectTrigger className='h-11 w-full text-sm'>
                      <SelectValue placeholder='Selecciona un agente' />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className='text-sm text-muted-foreground italic'>
                    No hay agentes disponibles. Crea uno primero.
                  </p>
                )}
              </div>
            )}

            {/* Step: Connect (OAuth + resource pickers) */}
            {currentStep === 'connect' && (
              <div className='space-y-4'>
                {oauthProviders.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      Conecta tu cuenta para autorizar el acceso. El token se gestiona automáticamente.
                    </p>
                    {oauthProviders.map((provider) => (
                      <OAuthConnectButton
                        key={provider}
                        provider={provider}
                        onConnected={() => {
                          queryClient.invalidateQueries({ queryKey: ['oauth-status', provider] })
                          queryClient.invalidateQueries({ queryKey: ['oauth-resources', provider] })
                        }}
                      />
                    ))}
                  </div>
                )}
                {manualCredentials.map((field) => (
                  <div key={field.key} className='space-y-1.5'>
                    <Label className='text-xs font-medium flex items-center gap-1'>
                      {field.label}
                      {field.required && <span className='text-destructive'>*</span>}
                    </Label>
                    {field.description && (
                      <p className='text-[10px] text-muted-foreground'>{field.description}</p>
                    )}
                    {field.resource_type ? (
                      <ResourcePicker
                        resourceType={field.resource_type}
                        value={credentials[field.key] ?? ''}
                        onChange={(v) => setCredentials((prev) => ({ ...prev, [field.key]: v }))}
                        label={field.label}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        type={field.secret ? 'password' : 'text'}
                        placeholder={field.key}
                        value={credentials[field.key] ?? ''}
                        onChange={(e) =>
                          setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className='h-8 text-sm font-mono'
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step: Actions — tools are optional */}
            {currentStep === 'actions' && (
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>
                  Selecciona las acciones a instalar.{' '}
                  <span className='text-muted-foreground/60 text-xs'>Puedes continuar sin seleccionar ninguna.</span>
                </p>
                <div className='space-y-1.5'>
                  {(installing?.tools ?? []).map((tool) => {
                    const active = selectedTools.includes(tool.id)
                    return (
                      <button
                        key={tool.id}
                        type='button'
                        onClick={() =>
                          setSelectedTools((prev) =>
                            active ? prev.filter((t) => t !== tool.id) : [...prev, tool.id]
                          )
                        }
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                          active
                            ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                            : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
                            active
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/30 bg-transparent'
                          )}
                        >
                          {active && <CheckCircle2 className='h-3 w-3 text-primary-foreground' />}
                        </div>
                        <div className='min-w-0'>
                          <p className='font-medium text-xs'>{tool.name}</p>
                          <p className='text-[11px] text-muted-foreground mt-0.5 leading-relaxed'>
                            {tool.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='gap-2 mt-4'>
            {isFirstStep ? (
              <Button variant='outline' size='sm' onClick={() => setInstalling(null)}>
                <X className='h-3.5 w-3.5 mr-1.5' />
                Cancelar
              </Button>
            ) : (
              <Button variant='outline' size='sm' onClick={() => setStep((s) => s - 1)}>
                Atrás
              </Button>
            )}
            {!isLastStep ? (
              <Button
                size='sm'
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
                className='min-w-[110px]'
              >
                Siguiente
                <ChevronRight className='h-3.5 w-3.5 ml-1' />
              </Button>
            ) : (
              <Button
                size='sm'
                disabled={!canInstall}
                onClick={handleInstall}
                className='min-w-[130px]'
              >
                {isInstalling ? (
                  <>
                    <Loader2 className='h-3.5 w-3.5 mr-1.5 animate-spin' />
                    Instalando...
                  </>
                ) : selectedTools.length > 0 ? (
                  <>Instalar {selectedTools.length} acción{selectedTools.length !== 1 ? 'es' : ''}</>
                ) : (
                  <>Instalar sin herramientas</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
