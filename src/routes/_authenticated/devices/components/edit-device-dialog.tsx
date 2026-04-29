import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Loader2, Settings, Bot, Workflow, User, Plus, Palette, Trash2, Network,
    Key, Webhook, Shield, Copy, Check, Eye, EyeOff, XCircle,
    Activity, Zap, Send, Pause, Play,
    CheckCircle2, MessageSquare, Smartphone, Globe,
    Mail, ArrowDownLeft, ArrowUpRight, CheckCheck, MessageCircle,
    WifiOff, UserPlus, Camera, Radio, BookOpen,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from '@/components/ui/label'

// ===== Channel config =====
const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    whatsapp: { label: 'WhatsApp', icon: <MessageCircle className="h-5 w-5 text-emerald-500" />, color: 'text-emerald-500' },
    instagram: { label: 'Instagram', icon: <Camera className="h-5 w-5 text-pink-500" />, color: 'text-pink-500' },
    telegram: { label: 'Telegram', icon: <Send className="h-5 w-5 text-blue-500" />, color: 'text-blue-500' },
    messenger: { label: 'Messenger', icon: <MessageSquare className="h-5 w-5 text-blue-600" />, color: 'text-blue-600' },
    web: { label: 'Web Chat', icon: <Globe className="h-5 w-5 text-violet-500" />, color: 'text-violet-500' },
    api: { label: 'API', icon: <Zap className="h-5 w-5 text-amber-500" />, color: 'text-amber-500' },
    sms: { label: 'SMS', icon: <Smartphone className="h-5 w-5 text-teal-500" />, color: 'text-teal-500' },
    email: { label: 'Email', icon: <Mail className="h-5 w-5 text-red-500" />, color: 'text-red-500' },
}

function getChannelInfo(type: string) {
    return CHANNEL_CONFIG[type] || { label: type, icon: <Radio className="h-5 w-5 text-muted-foreground" />, color: 'text-muted-foreground' }
}

// ===== Form schema =====
const formSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    process_type: z.enum(['agent', 'flow', 'user', 'orchestrator']),
    process_id: z.string().optional(),
    custom_statuses: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        color: z.string(),
    })),
})

type FormValues = z.infer<typeof formSchema>

interface EditDeviceDialogProps {
    device: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

// ===== Token sub-component =====
function DeviceTokensTab({ deviceId }: { deviceId: string }) {
    const { t } = useTranslation()
    const [tokens, setTokens] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [generatedToken, setGeneratedToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showToken, setShowToken] = useState(true)
    const [tokenForm, setTokenForm] = useState({
        name: '', scopes: 'messages:send,messages:read,conversations:read',
        rate_limit_per_minute: 60, expires_in: '90d',
    })

    const fetchTokens = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get(`/device-tokens?device_id=${deviceId}`)
            if (res.data.success) setTokens(res.data.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [deviceId])

    useEffect(() => { fetchTokens() }, [fetchTokens])

    const handleGenerate = async () => {
        if (!tokenForm.name) { toast.error('Nombre requerido'); return }
        setGenerating(true)
        try {
            const res = await api.post('/device-tokens', { ...tokenForm, device_id: deviceId })
            if (res.data.success) {
                setGeneratedToken(res.data.data.token)
                toast.success('Token generado')
                fetchTokens()
            }
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
        finally { setGenerating(false) }
    }

    const handleRevoke = async (id: string) => {
        try {
            await api.post(`/device-tokens/${id}/revoke`)
            toast.success('Token revocado')
            fetchTokens()
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
    }

    if (generatedToken) {
        return (
            <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Token generado</p>
                        <p className="text-xs text-muted-foreground">Cópialo ahora. <span className="text-destructive font-semibold">No se mostrará de nuevo.</span></p>
                    </div>
                </div>
                <div className="relative group">
                    <div className="p-3 rounded-lg bg-card border-2 border-dashed border-primary/30 font-mono text-xs break-all select-all">
                        {showToken ? generatedToken : '•'.repeat(generatedToken.length)}
                    </div>
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowToken(!showToken)}>
                            {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className={cn("h-6 w-6", copied && "text-emerald-500")}
                            onClick={() => { navigator.clipboard.writeText(generatedToken); setCopied(true); toast.success('Copiado'); setTimeout(() => setCopied(false), 2000) }}>
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>
                <Button type="button" size="sm" onClick={() => { setGeneratedToken(null); setTokenForm(f => ({ ...f, name: '' })) }}>
                    Listo
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Generate form */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/5">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5" /> Nuevo Token
                    </div>
                    <a
                        href="/docs#section-tokens"
                        target="_blank"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                        <BookOpen className="h-3 w-3" /> Ver documentación
                    </a>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                        <Input value={tokenForm.name} onChange={e => setTokenForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nombre del token" className="h-8 text-sm bg-muted/20" />
                    </div>
                    <Select value={tokenForm.expires_in} onValueChange={v => setTokenForm(f => ({ ...f, expires_in: v }))}>
                        <SelectTrigger className="h-8 text-xs bg-muted/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30d">30 días</SelectItem>
                            <SelectItem value="90d">90 días</SelectItem>
                            <SelectItem value="365d">1 año</SelectItem>
                            <SelectItem value="never">Sin expiración</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" value={tokenForm.rate_limit_per_minute}
                        onChange={e => setTokenForm(f => ({ ...f, rate_limit_per_minute: parseInt(e.target.value) || 60 }))}
                        className="h-8 text-xs bg-muted/20" min={1} max={1000} />
                </div>
                <Button type="button" size="sm" className="w-full gap-1.5 h-8" onClick={handleGenerate} disabled={generating || !tokenForm.name}>
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                    Generar Token
                </Button>
            </div>

            {/* Token list */}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {loading ? [1, 2].map(i => <div key={i} className="h-12 rounded-lg bg-muted/20 animate-pulse" />) :
                    tokens.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">{t('devices.no_tokens')}</div>
                    ) : tokens.map(tok => (
                        <div key={tok.id} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border text-xs",
                            tok.status === 'active' ? "bg-card/60" : "bg-muted/10 opacity-60")}>
                            <Key className={cn("h-3.5 w-3.5 shrink-0", tok.status === 'active' ? "text-emerald-500" : "text-muted-foreground")} />
                            <div className="flex-1 min-w-0">
                                <span className="font-semibold truncate block">{tok.name}</span>
                                <span className="text-muted-foreground font-mono">{tok.token_prefix}•••</span>
                            </div>
                            <Badge variant={tok.status === 'active' ? 'default' : 'destructive'} className="text-[9px] px-1.5 py-0">
                                {tok.status === 'active' ? 'Activo' : tok.status === 'revoked' ? 'Revocado' : 'Expirado'}
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-0.5">
                                <Activity className="h-3 w-3" />{tok.usage_count}
                            </span>
                            {tok.status === 'active' && (
                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRevoke(tok.id)}>
                                    <XCircle className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    )
}

// ===== Webhooks sub-component =====
function DeviceWebhooksTab({ deviceId }: { deviceId: string }) {
    const { t } = useTranslation()
    const [webhooks, setWebhooks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showSecret, setShowSecret] = useState(true)
    const [whForm, setWhForm] = useState({
        name: '', url: '', events: 'message.incoming,message.sent',
        max_retries: 3, timeout_secs: 10, auto_disable_threshold: 10,
    })

    const fetchWebhooks = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get(`/webhooks?device_id=${deviceId}`)
            if (res.data.success) setWebhooks(res.data.data || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [deviceId])

    useEffect(() => { fetchWebhooks() }, [fetchWebhooks])

    const handleCreate = async () => {
        if (!whForm.name || !whForm.url) { toast.error('Nombre y URL requeridos'); return }
        setCreating(true)
        try {
            const res = await api.post('/webhooks', { ...whForm, device_id: deviceId })
            if (res.data.success) {
                setGeneratedSecret(res.data.data.secret)
                toast.success('Webhook creado')
                fetchWebhooks()
            }
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
        finally { setCreating(false) }
    }

    const handleToggle = async (id: string, status: string) => {
        try {
            await api.put(`/webhooks/${id}`, { status })
            toast.success(status === 'active' ? 'Activado' : 'Pausado')
            fetchWebhooks()
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
    }

    const handleTest = async (id: string) => {
        try {
            await api.post(`/webhooks/${id}/test`)
            toast.success('Test enviado')
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
    }

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/webhooks/${id}`)
            toast.success('Eliminado')
            fetchWebhooks()
        } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
    }

    const eventOptions = [
        { value: 'message.incoming', label: 'Entrante', icon: <ArrowDownLeft className="h-3 w-3" /> },
        { value: 'message.sent', label: 'Enviado', icon: <ArrowUpRight className="h-3 w-3" /> },
        { value: 'message.delivered', label: 'Entregado', icon: <CheckCheck className="h-3 w-3" /> },
        { value: 'message.read', label: 'Leído', icon: <Eye className="h-3 w-3" /> },
        { value: 'conversation.created', label: 'Conv. creada', icon: <MessageSquare className="h-3 w-3" /> },
        { value: 'device.connected', label: 'Conectado', icon: <Zap className="h-3 w-3" /> },
        { value: 'device.disconnected', label: 'Desconectado', icon: <WifiOff className="h-3 w-3" /> },
        { value: 'contact.created', label: 'Contacto', icon: <UserPlus className="h-3 w-3" /> },
    ]

    if (generatedSecret) {
        return (
            <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Signing Secret</p>
                        <p className="text-xs text-muted-foreground">Usa esto para verificar HMAC-SHA256. <span className="text-destructive font-semibold">No se mostrará de nuevo.</span></p>
                    </div>
                </div>
                <div className="relative group">
                    <div className="p-3 rounded-lg bg-card border-2 border-dashed border-violet-500/30 font-mono text-xs break-all select-all">
                        {showSecret ? generatedSecret : '•'.repeat(generatedSecret.length)}
                    </div>
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowSecret(!showSecret)}>
                            {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className={cn("h-6 w-6", copied && "text-emerald-500")}
                            onClick={() => { navigator.clipboard.writeText(generatedSecret); setCopied(true); toast.success('Copiado'); setTimeout(() => setCopied(false), 2000) }}>
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>
                <Button type="button" size="sm" onClick={() => { setGeneratedSecret(null); setWhForm(f => ({ ...f, name: '', url: '' })) }}>Listo</Button>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Create form */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/5">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5" /> Nuevo Webhook
                    </div>
                    <a
                        href="/docs#section-webhooks"
                        target="_blank"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                        <BookOpen className="h-3 w-3" /> Ver documentación
                    </a>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Input value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Nombre" className="h-8 text-sm bg-muted/20" />
                    <Input value={whForm.url} onChange={e => setWhForm(f => ({ ...f, url: e.target.value }))}
                        placeholder="https://your-server.com/webhook" className="h-8 text-sm bg-muted/20 font-mono" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {eventOptions.map(ev => {
                        const active = whForm.events.includes(ev.value)
                        return (
                            <button key={ev.value} type="button"
                                className={cn("flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-all",
                                    active ? "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400" : "bg-muted/10 border-muted-foreground/10 text-muted-foreground hover:border-violet-500/20")}
                                onClick={() => {
                                    const events = whForm.events.split(',').filter(s => s.trim())
                                    setWhForm(f => ({
                                        ...f,
                                        events: active ? events.filter(s => s !== ev.value).join(',') : [...events, ev.value].join(',')
                                    }))
                                }}>
                                {ev.icon}<span>{ev.label}</span>
                                {active && <Check className="h-2.5 w-2.5 ml-0.5" />}
                            </button>
                        )
                    })}
                </div>
                <Button type="button" size="sm" className="w-full gap-1.5 h-8 bg-violet-600 hover:bg-violet-700" onClick={handleCreate}
                    disabled={creating || !whForm.name || !whForm.url}>
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Webhook className="h-3.5 w-3.5" />}
                    Crear Webhook
                </Button>
            </div>

            {/* Webhook list */}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {loading ? [1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />) :
                    webhooks.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">{t('devices.no_webhooks')}</div>
                    ) : webhooks.map(wh => {
                        const isActive = wh.status === 'active'
                        const isFailed = wh.status === 'failed'
                        return (
                            <div key={wh.id} className={cn("rounded-lg border px-3 py-2 text-xs",
                                isActive ? "bg-card/60" : isFailed ? "bg-destructive/5 border-destructive/20" : "bg-muted/10 opacity-70")}>
                                <div className="flex items-center gap-2">
                                    <Webhook className={cn("h-3.5 w-3.5 shrink-0",
                                        isActive ? "text-violet-500" : isFailed ? "text-destructive" : "text-muted-foreground")} />
                                    <span className="font-semibold truncate flex-1">{wh.name}</span>
                                    <Badge variant={isActive ? 'default' : isFailed ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 py-0">
                                        {wh.status === 'active' ? 'Activo' : wh.status === 'failed' ? 'Fallido' : 'Pausado'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                    <span className="font-mono truncate max-w-[180px]">{wh.url}</span>
                                    <span>•</span>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />{wh.success_count}
                                    {wh.failure_count > 0 && <><XCircle className="h-3 w-3 text-destructive" />{wh.failure_count}</>}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1" onClick={() => handleTest(wh.id)}>
                                        <Send className="h-3 w-3" />Test
                                    </Button>
                                    {isActive && (
                                        <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 text-amber-600" onClick={() => handleToggle(wh.id, 'paused')}>
                                            <Pause className="h-3 w-3" />Pausar
                                        </Button>
                                    )}
                                    {!isActive && (
                                        <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 text-emerald-600" onClick={() => handleToggle(wh.id, 'active')}>
                                            <Play className="h-3 w-3" />Activar
                                        </Button>
                                    )}
                                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 text-destructive ml-auto" onClick={() => handleDelete(wh.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}

// ===== Main Dialog =====
export function EditDeviceDialog({ device, open, onOpenChange, onSuccess }: EditDeviceDialogProps) {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [agents, setAgents] = useState<any[]>([])
    const [flows, setFlows] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [orchestrators, setOrchestrators] = useState<any[]>([])
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", process_type: "agent", process_id: "none", custom_statuses: [] },
    })

    useEffect(() => {
        if (open) {
            const fetchResources = async () => {
                try {
                    const [r1, r2, r3, r4] = await Promise.all([
                        api.get('/data/agents/me'), api.get('/data/flows/me'),
                        api.get('/data/users/me'), api.get('/data/orchestrators/me')
                    ])
                    if (r1.data.success) setAgents(r1.data.data || [])
                    if (r2.data.success) setFlows(r2.data.data || [])
                    if (r3.data.success) setEmployees(r3.data.data || [])
                    if (r4?.data.success) setOrchestrators(r4.data.data || [])
                } catch (e) { console.error(e) }
            }
            fetchResources()
        }
    }, [open])

    useEffect(() => {
        if (device) {
            form.reset({
                name: device.name || "",
                process_type: (device.process_type as any) || "agent",
                process_id: device.process_id || "none",
                custom_statuses: device.custom_statuses || [],
            })
        }
    }, [device, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!device) return
        setIsSubmitting(true)
        try {
            const payload = {
                name: values.name, type: device.type,
                process_type: values.process_type,
                process_id: values.process_id === 'none' ? null : values.process_id,
            }
            const response = await api.patch(`/data/devices/me/${device.id}`, payload)
            if (response.data.success) {
                if (values.custom_statuses !== undefined) {
                    try {
                        await api.put(`/devices/${device.id}/custom-statuses`, {
                            statuses: values.custom_statuses.map(({ id, name, color }) => ({ id, name, color }))
                        })
                    } catch (err) {
                        toast.error(t('devices.error_saving_statuses'))
                    }
                }
                toast.success(t('devices.device_updated'))
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(response.data.message || t('devices.error_updating_device'))
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('devices.error_updating_device'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const channel = device ? getChannelInfo(device.type) : getChannelInfo('')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh]">
                <div className="bg-gradient-to-br from-primary/5 via-background to-background">
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 text-lg">
                                {channel.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="flex items-center gap-2">
                                    {t('devices.manage_connection')}
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", channel.color)}>
                                        {channel.label}
                                    </Badge>
                                    {device?.provider && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                            {device.provider === 'meta' ? 'Cloud API' : 'QR'}
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="truncate">
                                    {t('devices.configuration_tokens_webhooks')}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 pt-4">
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className={cn("grid w-full grid-cols-4 mb-4 bg-muted/20 h-9")}>
                                    <TabsTrigger value="general" className="gap-1.5 text-xs data-[state=active]:bg-background">
                                        <Settings className="h-3.5 w-3.5" />Config
                                    </TabsTrigger>
                                    <TabsTrigger value="estados" className="gap-1.5 text-xs data-[state=active]:bg-background">
                                        <Palette className="h-3.5 w-3.5" />
                                        Estados
                                        {form.watch('custom_statuses').length > 0 && (
                                            <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">{form.watch('custom_statuses').length}</Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="tokens" className="gap-1.5 text-xs data-[state=active]:bg-background">
                                        <Key className="h-3.5 w-3.5" />Tokens
                                    </TabsTrigger>
                                    <TabsTrigger value="webhooks" className="gap-1.5 text-xs data-[state=active]:bg-background">
                                        <Webhook className="h-3.5 w-3.5" />Webhooks
                                    </TabsTrigger>
                                </TabsList>

                                {/* ===== Config Tab ===== */}
                                <TabsContent value="general" className="space-y-5 mt-0 animate-in fade-in slide-in-from-left-2 duration-300 min-h-[280px]">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold">{t('devices.connection_name')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('devices.connection_name_placeholder')} {...field} className="bg-muted/20" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="process_type" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold">Tipo de Proceso</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-muted/20"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="agent"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-purple-500" /><span>Agente IA</span></div></SelectItem>
                                                        <SelectItem value="flow"><div className="flex items-center gap-2"><Workflow className="h-4 w-4 text-blue-500" /><span>Flujo</span></div></SelectItem>
                                                        <SelectItem value="user"><div className="flex items-center gap-2"><User className="h-4 w-4 text-green-500" /><span>Empleado</span></div></SelectItem>
                                                        <SelectItem value="orchestrator"><div className="flex items-center gap-2"><Network className="h-4 w-4 text-orange-500" /><span>Orquestador</span></div></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="process_id" render={({ field }) => {
                                            const type = form.watch('process_type')
                                            const options = type === 'agent' ? agents : type === 'flow' ? flows : type === 'orchestrator' ? orchestrators : employees
                                            const label = type === 'agent' ? 'Agente' : type === 'flow' ? 'Flujo' : type === 'orchestrator' ? 'Orquestador' : 'Empleado'
                                            return (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">{label}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-muted/20"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="none">Sin asignar</SelectItem>
                                                            {options.map((opt: any) => (
                                                                <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }} />
                                    </div>
                                    {/* Channel info card */}
                                    <div className="p-3 rounded-lg border border-dashed bg-muted/5 flex items-center gap-3">
                                        <span className="[&>svg]:h-5 [&>svg]:w-5">{channel.icon}</span>
                                        <div className="text-xs">
                                            <p className="font-semibold">{channel.label} {device?.provider === 'meta' ? '(Cloud API)' : device?.provider === 'qr' ? '(QR)' : ''}</p>
                                            <p className="text-muted-foreground">
                                                {device?.identifier || device?.phone || 'Sin identificador'}
                                                {device?.status && <> • <span className={device.status === 'connected' ? 'text-emerald-500' : 'text-amber-500'}>{device.status}</span></>}
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ===== Estados Tab ===== */}
                                <TabsContent value="estados" className="mt-0 animate-in fade-in slide-in-from-right-2 duration-300 min-h-[280px]">
                                    <div className="rounded-xl border bg-muted/5 overflow-hidden">
                                        <div className="flex items-center justify-between p-3 border-b bg-muted/10">
                                            <div className="flex items-center gap-2">
                                                <Palette className="h-4 w-4 text-primary" />
                                                <Label className="text-sm font-bold">Estados Personalizados</Label>
                                            </div>
                                            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 border-dashed border-primary/40 text-xs">
                                                        <Plus className="h-3 w-3" />Nuevo
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[320px] p-0 overflow-hidden border-none shadow-2xl">
                                                    <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6">
                                                        <DialogHeader className="mb-4">
                                                            <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                                                <Palette className="h-5 w-5 text-primary" />Nuevo Estado
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-5">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="status-name" className="text-xs font-semibold">Nombre</Label>
                                                                <Input id="status-name" placeholder="Ej. Prioritario..."
                                                                    className="h-9 text-sm bg-muted/30"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault()
                                                                            const input = e.target as HTMLInputElement
                                                                            const name = input.value
                                                                            if (name) {
                                                                                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#f43f5e']
                                                                                const color = colors[Math.floor(Math.random() * colors.length)]
                                                                                const current = form.getValues('custom_statuses')
                                                                                form.setValue('custom_statuses', [...current, { name, color }])
                                                                                input.value = ''
                                                                                toast.success(`Estado "${name}" añadido`)
                                                                                setIsStatusDialogOpen(false)
                                                                            }
                                                                        }
                                                                    }} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold">Color</Label>
                                                                <div className="grid grid-cols-8 gap-2">
                                                                    {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#f43f5e'].map((color) => (
                                                                        <button key={color} type="button"
                                                                            className="h-7 w-7 rounded-full border-2 border-transparent hover:border-white shadow-sm hover:scale-110 transition-all"
                                                                            style={{ backgroundColor: color }}
                                                                            onClick={() => {
                                                                                const nameInput = document.getElementById('status-name') as HTMLInputElement
                                                                                const name = nameInput.value
                                                                                if (name) {
                                                                                    const current = form.getValues('custom_statuses')
                                                                                    form.setValue('custom_statuses', [...current, { name, color }])
                                                                                    nameInput.value = ''
                                                                                    toast.success(`Estado "${name}" añadido`)
                                                                                    setIsStatusDialogOpen(false)
                                                                                } else {
                                                                                    toast.error("Ingresa un nombre primero")
                                                                                    nameInput.focus()
                                                                                }
                                                                            }} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        <div className="p-3 min-h-[120px] max-h-[220px] overflow-y-auto custom-scrollbar">
                                            {form.watch('custom_statuses').length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {form.watch('custom_statuses').map((status, index) => (
                                                        <div key={index}
                                                            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card/40 shadow-sm transition-all hover:shadow-md animate-in zoom-in-95 duration-200"
                                                            style={{ borderColor: `${status.color}30`, background: `linear-gradient(135deg, ${status.color}15, transparent)` }}>
                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color, boxShadow: `0 0 8px ${status.color}80` }} />
                                                            <span className="text-[11px] font-semibold">{status.name}</span>
                                                            <button type="button"
                                                                onClick={() => {
                                                                    const current = form.getValues('custom_statuses')
                                                                    form.setValue('custom_statuses', current.filter((_: any, i: number) => i !== index))
                                                                }}
                                                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                                                    <Palette className="h-8 w-8 mb-2 stroke-[1.5]" />
                                                    <p className="text-xs italic">Define estados personalizados para tus chats</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ===== Tokens Tab ===== */}
                                <TabsContent value="tokens" className="mt-0 min-h-[280px]">
                                    {device?.id ? <DeviceTokensTab deviceId={device.id} /> : (
                                        <div className="py-12 text-center text-sm text-muted-foreground">{t('devices.save_device_first')}</div>
                                    )}
                                </TabsContent>

                                {/* ===== Webhooks Tab ===== */}
                                <TabsContent value="webhooks" className="mt-0 min-h-[280px]">
                                    {device?.id ? <DeviceWebhooksTab deviceId={device.id} /> : (
                                        <div className="py-12 text-center text-sm text-muted-foreground">{t('devices.save_device_first')}</div>
                                    )}
                                </TabsContent>
                            </Tabs>

                            <DialogFooter className="mt-5 gap-3">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                    {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('devices.saving')}</>) : t('devices.save_changes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
