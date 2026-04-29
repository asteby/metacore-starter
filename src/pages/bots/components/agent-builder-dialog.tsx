import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Loader2, ChevronRight, ChevronLeft, BrainCircuit,
  Wand2, UploadCloud, Rocket, Wrench, SkipForward, X,
  Image, Video, File, Link2, CheckCheck, CheckCircle2,
  Headphones, TrendingUp, CalendarDays, ShoppingBag, Users, Search,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentTemplate {
  id: string
  slug: string
  name: string
  description: string
  category: string
  tags: string[]
  icon_type: 'lucide' | 'brand'
  icon_slug: string
  icon_color: string
  system_prompt_template: string
  default_temperature: number
  business_context_fields: ContextField[]
  required_integrations: RequiredIntegration[]
  preview_conversation: PreviewMessage[]
}

interface ContextField {
  key: string
  label: string
  placeholder?: string
  required: boolean
  type: 'text' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
}

interface RequiredIntegration {
  slug: string
  required: boolean
  default_tools: string[]
}

interface PreviewMessage {
  role: 'user' | 'agent'
  message: string
}

interface PendingKnowledgeItem {
  type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'url'
  chunkType?: 'knowledge' | 'instruction' // for text chunks: route to KB or system prompt
  content?: string
  title?: string
  file_name?: string
  file_size?: number
  mime_type?: string
  file_url?: string
}

interface MarketplaceIntegration {
  id: string
  slug: string
  name: string
  description: string
  icon_type: 'brand' | 'lucide'
  icon_slug: string
  icon_color: string
  credentials: CredentialField[]
  tools: ToolItem[]
}

interface CredentialField {
  key: string
  label: string
  description?: string
  required: boolean
  secret: boolean
  oauth_provider?: string
  resource_type?: string
}

interface ToolItem {
  id: string
  name: string
  description: string
  enabled_by_default: boolean
}

interface OAuthStatus { connected: boolean }

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, {
  label: string
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
}> = {
  support:    { label: 'Soporte',    Icon: Headphones,   color: '3b82f6' },
  sales:      { label: 'Ventas',     Icon: TrendingUp,   color: '22c55e' },
  scheduling: { label: 'Agenda',     Icon: CalendarDays, color: 'a855f7' },
  ecommerce:  { label: 'Tienda',     Icon: ShoppingBag,  color: 'f97316' },
  hr:         { label: 'RRHH',       Icon: Users,        color: 'ec4899' },
  custom:     { label: 'Libre',      Icon: Wand2,        color: '6366f1' },
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const ALL_STEPS = [
  { id: 'category',  label: 'Tipo'         },
  { id: 'template',  label: 'Agente'       },
  { id: 'context',   label: 'Negocio'      },
  { id: 'knowledge', label: 'Conocimiento' },
  { id: 'tools',     label: 'Herramientas' },
  { id: 'launch',    label: 'Lanzar'       },
]

const STEP_TITLES: Record<string, string> = {
  category:  '¿Qué tipo de agente?',
  template:  'Elige un template',
  context:   'Tu negocio',
  knowledge: 'Base de conocimiento',
  tools:     'Herramientas',
  launch:    'Todo listo',
}

// ─── Template icon ────────────────────────────────────────────────────────────

const LUCIDE_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties; className?: string }>> = {
  Headphones: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  CalendarDays: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>,
  ShoppingBag: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Package: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  Wand2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>,
}

function TemplateIcon({ template, size = 'md' }: { template: AgentTemplate; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 16 : size === 'lg' ? 32 : 24
  const box = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
  const color = '#' + template.icon_color
  if (template.icon_type === 'brand') {
    return (
      <div className={cn(box, 'flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm shrink-0')}>
        <img src={`https://cdn.simpleicons.org/${template.icon_slug}/${template.icon_color}`} alt={template.name} width={dim} height={dim} className="object-contain" />
      </div>
    )
  }
  const LucideIcon = LUCIDE_ICONS[template.icon_slug]
  return (
    <div className={cn(box, 'flex items-center justify-center rounded-xl border shrink-0')}
      style={{ backgroundColor: color + '18', borderColor: color + '35' }}>
      {LucideIcon
        ? <LucideIcon style={{ width: dim, height: dim, color }} />
        : <Wand2 style={{ width: dim, height: dim, color }} />}
    </div>
  )
}

// ─── OAuth / ResourcePicker ──────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = { github: 'GitHub', google: 'Google' }
const RESOURCE_TYPE_PROVIDER: Record<string, string> = { github_repo: 'github', google_calendar: 'google' }

function OAuthConnectButton({ provider, onConnected }: { provider: string; onConnected: () => void }) {
  const [loading, setLoading] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const { data: status, refetch } = useQuery<OAuthStatus>({
    queryKey: ['oauth-status', provider],
    queryFn: async () => (await api.get(`/oauth/${provider}/status`)).data,
  })
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'oauth_success' && e.data?.provider === provider) {
        setLoading(false); refetch().then(() => onConnected())
        toast.success(`Conectado con ${PROVIDER_LABELS[provider] ?? provider}`)
      } else if (e.data?.type === 'oauth_error') {
        setLoading(false); toast.error(e.data.message || 'Error de conexión')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [provider, refetch, onConnected])

  function openPopup() {
    setLoading(true)
    const token = localStorage.getItem('auth_token') || ''
    const base = (import.meta.env.VITE_API_URL as string) || '/api'
    const path = provider === 'github' ? '/github/install' : `/oauth/${provider}/connect`
    const url = `${base}${path}?token=${encodeURIComponent(token)}`
    const w = 600, h = 700, left = window.screenX + (window.outerWidth - w) / 2, top = window.screenY + (window.outerHeight - h) / 2
    popupRef.current = window.open(url, `oauth_${provider}`, `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`)
    const iv = setInterval(() => { if (popupRef.current?.closed) { clearInterval(iv); setLoading(false) } }, 500)
  }

  if (status?.connected) return (
    <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 px-3 py-2">
      <CheckCheck className="h-4 w-4 text-green-600 shrink-0" />
      <span className="text-sm text-green-700 dark:text-green-400 flex-1">Conectado con {PROVIDER_LABELS[provider] ?? provider}</span>
      <button onClick={openPopup} className="text-xs text-muted-foreground hover:text-foreground underline">Reconectar</button>
    </div>
  )
  return (
    <Button type="button" variant="outline" className="w-full justify-start gap-2 h-10" onClick={openPopup} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
      Conectar con {PROVIDER_LABELS[provider] ?? provider}
    </Button>
  )
}

function ResourcePicker({ resourceType, value, onChange, label }: { resourceType: string; value: string; onChange: (v: string) => void; label: string }) {
  const provider = RESOURCE_TYPE_PROVIDER[resourceType]
  const { data: oauthStatus } = useQuery<OAuthStatus>({ queryKey: ['oauth-status', provider], queryFn: async () => (await api.get(`/oauth/${provider}/status`)).data, enabled: !!provider })
  const { data: resources = [], isLoading } = useQuery<{ value: string; label: string }[]>({
    queryKey: ['oauth-resources', provider],
    queryFn: async () => { const res = await api.get(`/oauth/${provider}/resources`); return res.data.success ? res.data.data : [] },
    enabled: !!provider && !!oauthStatus?.connected, staleTime: 2 * 60 * 1000,
  })
  if (!oauthStatus?.connected) return <div className="flex h-10 items-center rounded-xl border border-dashed px-3 text-sm text-muted-foreground">Conecta tu cuenta primero</div>
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10">{isLoading ? <span className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" />Cargando...</span> : <SelectValue placeholder={`Selecciona ${label.toLowerCase()}`} />}</SelectTrigger>
      <SelectContent>{resources.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}{resources.length === 0 && !isLoading && <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>}</SelectContent>
    </Select>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgentBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentBuilderDialog({ open, onOpenChange, onSuccess }: AgentBuilderDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [agentName, setAgentName] = useState('')
  const [businessContext, setBusinessContext] = useState<Record<string, string>>({})
  const [knowledgeText, setKnowledgeText] = useState('')
  const [pendingKnowledge, setPendingKnowledge] = useState<PendingKnowledgeItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [integrationConfigs, setIntegrationConfigs] = useState<
    Record<string, { credentials: Record<string, string>; selectedTools: string[]; enabled: boolean }>
  >({})
  const [agentMode, setAgentMode] = useState<'standard' | 'copilot' | 'dual'>('standard')
  const [copilotSlug, setCopilotSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSegmenting, setIsSegmenting] = useState(false)
  const [installingSlug, setInstallingSlug] = useState<string | null>(null)
  const [toolSearch, setToolSearch] = useState('')
  const [toolTab, setToolTab] = useState<'recommended' | 'explore'>('recommended')

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<AgentTemplate[]>({
    queryKey: ['marketplace-templates'],
    queryFn: async () => { const res = await api.get('/marketplace/templates'); return res.data.success ? res.data.data : [] },
    staleTime: 10 * 60 * 1000,
  })

  const { data: allIntegrations = [] } = useQuery<MarketplaceIntegration[]>({
    queryKey: ['tool-marketplace'],
    queryFn: async () => { const res = await api.get('/tool-marketplace'); return res.data.success ? res.data.data : [] },
    staleTime: 10 * 60 * 1000,
  })

  const categories = useMemo(() => {
    return [...new Set(templates.map(t => t.category))].filter(c => CATEGORY_META[c])
  }, [templates])

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates

  const templateIntegrations = (selectedTemplate?.required_integrations ?? [])
    .map(ri => allIntegrations.find(i => i.slug === ri.slug))
    .filter(Boolean) as MarketplaceIntegration[]

  useEffect(() => {
    if (!selectedTemplate) return
    const configs: typeof integrationConfigs = {}
    for (const ri of selectedTemplate.required_integrations ?? []) {
      const integration = allIntegrations.find(i => i.slug === ri.slug)
      configs[ri.slug] = {
        credentials: {},
        selectedTools: ri.default_tools ?? integration?.tools.filter(t => t.enabled_by_default).map(t => t.id) ?? [],
        enabled: false,
      }
    }
    setIntegrationConfigs(configs)
  }, [selectedTemplate?.slug])

  const contextFields = selectedTemplate?.business_context_fields ?? []
  const requiredContextFilled = contextFields.filter(f => f.required).every(f => !!businessContext[f.key]?.trim())
  const hasIntegrations = templateIntegrations.length > 0
  const visibleSteps = hasIntegrations ? ALL_STEPS : ALL_STEPS.filter(s => s.id !== 'tools')
  const totalSteps = visibleSteps.length
  const currentStepId = visibleSteps[step]?.id

  const canGoNext =
    currentStepId === 'category' ? !!selectedCategory
    : currentStepId === 'template' ? !!selectedTemplate
    : currentStepId === 'context' ? !!agentName.trim() && (contextFields.length === 0 || requiredContextFilled) && (agentMode !== 'copilot' || !!copilotSlug.trim())
    : true

  function reset() {
    setStep(0); setSelectedCategory(null); setSelectedTemplate(null); setAgentName('')
    setBusinessContext({}); setKnowledgeText(''); setPendingKnowledge([]); setIntegrationConfigs({})
    setIsSubmitting(false); setIsSegmenting(false); setInstallingSlug(null); setToolSearch(''); setToolTab('recommended')
    setAgentMode('standard'); setCopilotSlug('')
  }

  function handleClose() { reset(); onOpenChange(false) }

  function pickCategory(cat: string) { setSelectedCategory(cat); setStep(1) }

  function pickTemplate(tmpl: AgentTemplate) { setSelectedTemplate(tmpl); setStep(2) }

  function goNext() {
    if (step === totalSteps - 1) { handleSubmit() } else { setStep(s => s + 1) }
  }

  function goBack() {
    if (step === 0) { handleClose() } else { setStep(s => s - 1) }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files?.length) return
    setUploading(true); let ok = 0
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('folder', 'knowledge')
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        if (res.data.success) {
          const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'document'
          setPendingKnowledge(prev => [...prev, { type: type as any, file_name: file.name, file_url: res.data.url, file_size: file.size, mime_type: file.type }])
          ok++
        }
      } catch { /* silent */ }
    }
    setUploading(false)
    if (ok > 0) toast.success(`${ok} archivo(s) adjuntados`); else toast.error('Error al subir archivos')
  }

  async function addTextKnowledge() {
    if (!knowledgeText.trim()) return
    setIsSegmenting(true)
    try {
      const res = await api.post('/ai/segment-knowledge', { content: knowledgeText })
      if (res.data.success && res.data.data?.length > 0) {
        const chunks = res.data.data as { title: string; content: string; type: string }[]
        setPendingKnowledge(prev => [...prev, ...chunks.map(c => ({ type: 'text' as const, chunkType: (c.type === 'instruction' ? 'instruction' : 'knowledge') as 'knowledge' | 'instruction', content: c.content, title: c.title }))])
      } else {
        setPendingKnowledge(prev => [...prev, { type: 'text', content: knowledgeText, title: knowledgeText.substring(0, 50) }])
      }
    } catch {
      setPendingKnowledge(prev => [...prev, { type: 'text', content: knowledgeText, title: knowledgeText.substring(0, 50) }])
    } finally {
      setIsSegmenting(false)
    }
    setKnowledgeText('')
  }

  async function handleSubmit() {
    if (!selectedTemplate) return
    setIsSubmitting(true)
    try {
      const integrations = Object.entries(integrationConfigs)
        .filter(([, cfg]) => cfg.enabled)
        .map(([slug, cfg]) => ({ slug, credentials: cfg.credentials, tools: cfg.selectedTools }))

      const res = await api.post('/agents/from-template', {
        template_slug: selectedTemplate.slug,
        name: agentName,
        business_context: businessContext,
        integrations,
        ...(agentMode === 'copilot' ? { mode: 'copilot', slug: copilotSlug.trim() } : {}),
      })
      if (!res.data.success) { toast.error(res.data.message || 'Error al crear el agente'); return }

      const newAgentId = res.data.data.agent.id
      const toolCount = res.data.data.installed_tools?.length ?? 0
      toast.success(`¡Agente "${agentName}" creado!${toolCount > 0 ? ` ${toolCount} herramienta(s) instalada(s).` : ''}`)
      queryClient.invalidateQueries({ queryKey: ['agents'] })

      // Process knowledge in background — don't block the user
      const rawText = knowledgeText.trim()
      const preSegmented = [...pendingKnowledge] // already segmented by addTextKnowledge
      if (rawText || preSegmented.length > 0) {
        ;(async () => {
          // Segment any raw text that wasn't manually processed
          let allKnowledge = [...preSegmented]
          if (rawText) {
            try {
              const segRes = await api.post('/ai/segment-knowledge', { content: rawText })
              if (segRes.data.success && segRes.data.data?.length > 0) {
                const chunks = segRes.data.data as { title: string; content: string; type: string }[]
                allKnowledge = allKnowledge.concat(chunks.map(c => ({
                  type: 'text' as const,
                  chunkType: (c.type === 'instruction' ? 'instruction' : 'knowledge') as 'knowledge' | 'instruction',
                  content: c.content,
                  title: c.title,
                })))
              } else {
                allKnowledge.push({ type: 'text', chunkType: 'knowledge', content: rawText, title: rawText.substring(0, 50) })
              }
            } catch {
              allKnowledge.push({ type: 'text', chunkType: 'knowledge', content: rawText, title: rawText.substring(0, 50) })
            }
          }

          const instructions = allKnowledge.filter(i => i.chunkType === 'instruction' && i.content?.trim())
          const knowledgeItems = allKnowledge.filter(i => i.chunkType !== 'instruction')

          // Inject instructions into system prompt
          if (instructions.length > 0) {
            const extra = '\n\n' + instructions.map(i => i.content!.trim()).join('\n\n')
            try {
              const agentRes = await api.get(`/data/agents/me/${newAgentId}`)
              if (agentRes.data.success) {
                const currentPrompt = agentRes.data.data?.system_prompt || ''
                await api.patch(`/data/agents/me/${newAgentId}`, { system_prompt: currentPrompt + extra })
              }
            } catch { /* silent */ }
          }
          // Upload each chunk separately to the vector store
          for (const item of knowledgeItems) {
            try { await api.post('/ai/knowledge/upload', { agent_id: newAgentId, source: 'initial-setup', ...item }) } catch { /* silent */ }
          }
        })()
      }
      handleClose(); onSuccess?.()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al crear el agente')
    } finally { setIsSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 flex flex-col overflow-hidden rounded-2xl"
        style={{ width: '100%', maxWidth: '780px', height: 'min(88vh, 680px)' }}
      >
        <DialogTitle className="sr-only">Crear agente</DialogTitle>

        {/* ── Header ── */}
        <div className="shrink-0 grid grid-cols-3 items-center px-5 pt-4 pb-3 border-b">
          {/* Left: back arrow + step title */}
          <div className="flex items-center gap-2 min-w-0">
            {step > 0 && (
              <button onClick={goBack} disabled={isSubmitting} className="shrink-0 rounded-lg p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <span className="font-semibold text-sm truncate">{STEP_TITLES[currentStepId]}</span>
          </div>

          {/* Center: dot progress — always truly centered */}
          <div className="flex items-center justify-center gap-1.5">
            {visibleSteps.map((s, i) => (
              <div key={s.id} className={cn(
                'rounded-full transition-all duration-300',
                i === step ? 'w-5 h-1.5 bg-primary' : i < step ? 'w-1.5 h-1.5 bg-primary/40' : 'w-1.5 h-1.5 bg-muted-foreground/20'
              )} />
            ))}
          </div>

          {/* Right: close */}
          <div className="flex justify-end">
            <button onClick={handleClose} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">

          {/* STEP 0: Category */}
          {currentStepId === 'category' && (
            <div className="p-5">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {categories.map(cat => {
                    const meta = CATEGORY_META[cat]
                    const count = templates.filter(t => t.category === cat).length
                    const color = '#' + meta.color
                    const isSelected = selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => pickCategory(cat)}
                        className={cn(
                          'group flex flex-col items-center gap-3 py-7 px-4 rounded-2xl border bg-card text-center transition-all duration-150',
                          'hover:border-primary/40 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20',
                          isSelected && 'border-primary ring-1 ring-primary'
                        )}
                      >
                        <div
                          className="h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
                          style={{ backgroundColor: color + '18', border: `1.5px solid ${color}35` }}
                        >
                          <meta.Icon className="h-7 w-7" style={{ color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{meta.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cat === 'copilot' ? 'Modo especial' : `${count} template${count !== 1 ? 's' : ''}`}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Template */}
          {currentStepId === 'template' && (
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map(tmpl => {
                  const isSelected = selectedTemplate?.slug === tmpl.slug
                  return (
                    <button
                      key={tmpl.slug}
                      onClick={() => pickTemplate(tmpl)}
                      className={cn(
                        'group flex flex-col gap-3 p-4 rounded-2xl border bg-card text-left transition-all duration-150',
                        'hover:border-primary/40 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20',
                        isSelected && 'border-primary ring-1 ring-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <TemplateIcon template={tmpl} size="md" />
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tmpl.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{tmpl.description}</p>
                      </div>
                      {tmpl.preview_conversation?.length > 0 && (
                        <div className="mt-auto pt-3 border-t border-dashed border-muted-foreground/20 space-y-1.5">
                          {tmpl.preview_conversation.slice(0, 2).map((msg, i) => (
                            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                              <span className={cn(
                                'text-[11px] px-2.5 py-1 rounded-full max-w-[90%] line-clamp-1',
                                msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              )}>{msg.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Context */}
          {currentStepId === 'context' && selectedTemplate && (
            <div className="p-5 max-w-2xl mx-auto w-full">
              <div className="space-y-4">
                {/* Agent name — always full width */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Nombre del agente <span className="text-destructive">*</span></Label>
                  <Input placeholder="Ej: Soporte de Acme Corp" value={agentName} onChange={e => setAgentName(e.target.value)} className="h-10" />
                </div>
                {/* Context fields — 2-col grid, textareas span full */}
                <div className="grid grid-cols-2 gap-4">
                  {contextFields.map(field => (
                    <div key={field.key} className={cn('space-y-1.5', field.type === 'textarea' && 'col-span-2')}>
                      <Label className="text-sm">
                        {field.label}{field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea placeholder={field.placeholder} value={businessContext[field.key] ?? ''} onChange={e => setBusinessContext(p => ({ ...p, [field.key]: e.target.value }))} className="resize-none min-h-[90px] text-sm" />
                      ) : field.type === 'select' ? (
                        <Select value={businessContext[field.key] ?? ''} onValueChange={v => setBusinessContext(p => ({ ...p, [field.key]: v }))}>
                          <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>{field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder={field.placeholder} value={businessContext[field.key] ?? ''} onChange={e => setBusinessContext(p => ({ ...p, [field.key]: e.target.value }))} className="h-10 text-sm" />
                      )}
                    </div>
                  ))}
                </div>
                {/* Mode selector: Autónomo vs Copiloto vs Dual */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Modo de operación</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setAgentMode('standard')}
                      className={cn(
                        'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                        agentMode === 'standard'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-violet-500" />
                        <span className="font-semibold text-sm">Autónomo</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Responde automáticamente a los clientes</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentMode('copilot')}
                      className={cn(
                        'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                        agentMode === 'copilot'
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                          : 'border-border hover:border-amber-500/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-sm">Copiloto</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Solo actúa cuando el dueño lo menciona con @slug</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentMode('dual')}
                      className={cn(
                        'flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all',
                        agentMode === 'dual'
                          ? 'border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500'
                          : 'border-border hover:border-cyan-500/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-cyan-500" />
                        <span className="font-semibold text-sm">Dual</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Responde cuando cliente o dueño lo mencionan con @slug</p>
                    </button>
                  </div>
                </div>

                {(agentMode === 'copilot' || agentMode === 'dual') && (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Slug del agente <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="aurora"
                      value={copilotSlug}
                      onChange={e => setCopilotSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {agentMode === 'dual'
                        ? <>Cliente o dueño escribirá <span className="font-mono bg-muted px-1 rounded">@{copilotSlug || 'aurora'}</span> para activarlo en WhatsApp</>
                        : <>El dueño escribirá <span className="font-mono bg-muted px-1 rounded">@{copilotSlug || 'aurora'}</span> para activarlo en WhatsApp</>
                      }
                    </p>
                  </div>
                )}

                {selectedTemplate.slug === 'custom' && (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    El agente personalizado no tiene prompt predefinido. Lo configurarás desde la vista del agente una vez creado.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Knowledge */}
          {currentStepId === 'knowledge' && (
            <div className="flex-1 flex flex-col p-5 max-w-lg mx-auto w-full gap-3">
              <div className="flex-1 flex flex-col gap-3">
                <Textarea
                  placeholder="Pega aquí FAQs, políticas, catálogo, información sobre tu empresa..."
                  value={knowledgeText}
                  onChange={e => setKnowledgeText(e.target.value)}
                  className="flex-1 text-sm resize-none min-h-[140px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={!knowledgeText.trim() || isSegmenting} onClick={addTextKnowledge} className="shrink-0 gap-1.5">
                    {isSegmenting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analizando...</> : 'Agregar texto'}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1 border-dashed" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                    {uploading ? 'Subiendo...' : 'Subir archivos'}
                  </Button>
                </div>
                {pendingKnowledge.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">{pendingKnowledge.length} elemento(s) añadidos</p>
                    {pendingKnowledge.map((item, i) => {
                      const Icon = item.type === 'image' ? Image : item.type === 'video' ? Video : item.type === 'url' ? Link2 : File
                      return (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30 text-sm">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate text-xs">{item.title || item.file_name || item.content?.substring(0, 60)}</span>
                          <button onClick={() => setPendingKnowledge(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Tools — recommended + search all */}
          {currentStepId === 'tools' && (() => {
            const recommendedSlugs = new Set((selectedTemplate?.required_integrations ?? []).map(r => r.slug))
            const recommended = allIntegrations.filter(i => recommendedSlugs.has(i.slug))
            const searchQ = toolSearch.toLowerCase()
            const others = allIntegrations.filter(i =>
              !recommendedSlugs.has(i.slug) &&
              (!searchQ || i.name.toLowerCase().includes(searchQ) || i.description.toLowerCase().includes(searchQ))
            )

            function IntegrationCard({ integration }: { integration: MarketplaceIntegration }) {
              const isInstalled = integrationConfigs[integration.slug]?.enabled
              return (
                <div className={cn(
                  'flex flex-col gap-3 p-4 rounded-2xl border transition-all',
                  isInstalled ? 'border-green-500/40 bg-green-500/5 dark:bg-green-500/10' : 'border-border bg-card hover:border-primary/30'
                )}>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm shrink-0">
                      {integration.icon_type === 'brand'
                        ? <img src={`https://cdn.simpleicons.org/${integration.icon_slug}/${integration.icon_color}`} alt={integration.name} width={22} height={22} className="object-contain" />
                        : <Wrench className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    {isInstalled && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{integration.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{integration.description}</p>
                  </div>
                  <Button size="sm" variant={isInstalled ? 'outline' : 'default'} className="w-full" onClick={() => setInstallingSlug(integration.slug)}>
                    {isInstalled ? 'Editar' : 'Instalar'}
                  </Button>
                </div>
              )
            }

            return (
              <div className="flex-1 flex flex-col p-5 max-w-2xl mx-auto w-full gap-4">
                {/* Segmented control */}
                <div className="flex rounded-xl bg-muted p-1 gap-1 shrink-0">
                  <button
                    onClick={() => setToolTab('recommended')}
                    className={cn('flex-1 text-xs font-medium py-1.5 rounded-lg transition-all', toolTab === 'recommended' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    Recomendadas {recommended.length > 0 && `(${recommended.length})`}
                  </button>
                  <button
                    onClick={() => setToolTab('explore')}
                    className={cn('flex-1 text-xs font-medium py-1.5 rounded-lg transition-all', toolTab === 'explore' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    Explorar todas
                  </button>
                </div>

                {/* Tab: Recommended */}
                {toolTab === 'recommended' && (
                  recommended.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {recommended.map(i => <IntegrationCard key={i.slug} integration={i} />)}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-2">
                      <Wrench className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Este template no tiene integraciones recomendadas.</p>
                      <button onClick={() => setToolTab('explore')} className="text-sm text-primary underline">Explorar todas</button>
                    </div>
                  )
                )}

                {/* Tab: Explore */}
                {toolTab === 'explore' && (
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Buscar integración..."
                        value={toolSearch}
                        onChange={e => setToolSearch(e.target.value)}
                        className="h-9 pl-9 text-sm"
                        autoFocus
                      />
                    </div>
                    {searchQ && others.length === 0 && recommended.filter(i => i.name.toLowerCase().includes(searchQ) || i.description.toLowerCase().includes(searchQ)).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Sin resultados para "{toolSearch}"</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {(searchQ
                          ? allIntegrations.filter(i => i.name.toLowerCase().includes(searchQ) || i.description.toLowerCase().includes(searchQ))
                          : allIntegrations
                        ).map(i => <IntegrationCard key={i.slug} integration={i} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Install modal ── */}
                {(() => {
                  const integration = allIntegrations.find(i => i.slug === installingSlug)
                  if (!integration) return null
                  const cfg = integrationConfigs[integration.slug] ?? { credentials: {}, selectedTools: integration.tools.filter(t => t.enabled_by_default).map(t => t.id), enabled: false }
                  const oauthProviders = [...new Set(integration.credentials.map(c => c.oauth_provider).filter(Boolean) as string[])]
                  const manualCreds = integration.credentials.filter(c => !c.oauth_provider)

                  // Validate: all required OAuth connected + required manual creds filled
                  const oauthAllConnected = oauthProviders.every(p => {
                    const s = queryClient.getQueryData<OAuthStatus>(['oauth-status', p])
                    return s?.connected ?? false
                  })
                  const requiredCredsFilled = manualCreds.filter(f => f.required).every(f => !!cfg.credentials[f.key]?.trim())
                  const canInstall = oauthAllConnected && requiredCredsFilled

                  const integrationSlug = integration.slug
                  const updateCfg = (patch: Partial<typeof cfg>) => {
                    setIntegrationConfigs(prev => ({ ...prev, [integrationSlug]: { ...cfg, ...patch } }))
                  }

                  return (
                    <Dialog open={!!installingSlug} onOpenChange={open => !open && setInstallingSlug(null)}>
                      <DialogContent
                        className="p-0 gap-0 flex flex-col overflow-hidden rounded-2xl"
                        style={{ maxWidth: '420px', maxHeight: '80vh' }}
                      >
                        <DialogTitle className="sr-only">Instalar {integration.name}</DialogTitle>

                        {/* Header */}
                        <div className="shrink-0 flex flex-col items-center gap-3 px-6 pt-6 pb-4 border-b">
                          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm">
                            {integration.icon_type === 'brand'
                              ? <img src={`https://cdn.simpleicons.org/${integration.icon_slug}/${integration.icon_color}`} alt={integration.name} width={32} height={32} className="object-contain" />
                              : <Wrench className="h-7 w-7 text-muted-foreground" />}
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-base">{integration.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                          </div>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
                          {oauthProviders.map(provider => (
                            <OAuthConnectButton key={provider} provider={provider} onConnected={() => queryClient.invalidateQueries({ queryKey: ['oauth-status', provider] })} />
                          ))}
                          {manualCreds.map(field => (
                            <div key={field.key} className="space-y-1.5">
                              <Label className="text-sm">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                              {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                              {field.resource_type
                                ? <ResourcePicker resourceType={field.resource_type} value={cfg.credentials[field.key] ?? ''} onChange={v => updateCfg({ credentials: { ...cfg.credentials, [field.key]: v } })} label={field.label} />
                                : <Input type={field.secret ? 'password' : 'text'} placeholder={field.key} value={cfg.credentials[field.key] ?? ''} onChange={e => updateCfg({ credentials: { ...cfg.credentials, [field.key]: e.target.value } })} className="h-10 text-sm font-mono" />
                              }
                            </div>
                          ))}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Acciones a instalar</p>
                            {integration.tools.map(tool => {
                              const active = cfg.selectedTools.includes(tool.id)
                              return (
                                <button key={tool.id} type="button"
                                  onClick={() => { const next = active ? cfg.selectedTools.filter(t => t !== tool.id) : [...cfg.selectedTools, tool.id]; updateCfg({ selectedTools: next }) }}
                                  className={cn('w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all', active ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/30')}
                                >
                                  <div className={cn('mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors', active ? 'border-primary bg-primary' : 'border-muted-foreground/30')}>
                                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{tool.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 border-t px-5 py-3 space-y-2">
                          {!canInstall && (
                            <p className="text-xs text-muted-foreground text-center">
                              {!oauthAllConnected ? 'Conecta tu cuenta para continuar' : 'Completa los campos requeridos'}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setInstallingSlug(null)}>Cancelar</Button>
                            <Button className="flex-1 gap-1.5" disabled={!canInstall} onClick={() => { updateCfg({ enabled: true }); setInstallingSlug(null) }}>
                              <CheckCircle2 className="h-4 w-4" /> Instalar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )
                })()}
              </div>
            )
          })()}

          {/* STEP 5: Launch */}
          {currentStepId === 'launch' && (
            <div className="flex-1 p-5 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Rocket className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold">Listo para lanzar</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Tu agente será creado con un prompt personalizado para tu negocio.</p>
              <div className="w-full max-w-sm rounded-2xl border bg-muted/30 p-4 text-left space-y-2.5">
                {selectedTemplate && (
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                    <TemplateIcon template={selectedTemplate} size="sm" />
                    <div>
                      <p className="font-semibold text-sm">{agentName}</p>
                      <p className="text-xs text-muted-foreground">{selectedTemplate.name}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 text-xs">
                  {Object.entries(businessContext).filter(([, v]) => v).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground capitalize shrink-0">{k.replace(/_/g, ' ')}:</span>
                      <span className="font-medium truncate">{v}</span>
                    </div>
                  ))}
                  {pendingKnowledge.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">Conocimiento:</span>
                      <span className="font-medium">{pendingKnowledge.length} elemento(s)</span>
                    </div>
                  )}
                  {Object.entries(integrationConfigs).filter(([, c]) => c.enabled).length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">Herramientas:</span>
                      <span className="font-medium">{Object.entries(integrationConfigs).filter(([, c]) => c.enabled).map(([s]) => s).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t px-5 py-3 flex items-center justify-between bg-background gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} disabled={isSubmitting} className="gap-1">
            {step === 0 ? 'Cancelar' : <><ChevronLeft className="h-3.5 w-3.5" /> Atrás</>}
          </Button>
          <div className="flex items-center gap-3">
            {(currentStepId === 'knowledge' || currentStepId === 'tools') && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={goNext}>
                <SkipForward className="h-3.5 w-3.5" /> Omitir
              </Button>
            )}
            {currentStepId !== 'category' && currentStepId !== 'template' && (
              <Button size="sm" className="min-w-[120px] gap-1.5" disabled={!canGoNext || isSubmitting} onClick={goNext}>
                {isSubmitting
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creando...</>
                  : currentStepId === 'launch'
                    ? <><Rocket className="h-3.5 w-3.5" /> Crear agente</>
                    : <>Siguiente <ChevronRight className="h-3.5 w-3.5" /></>}
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
