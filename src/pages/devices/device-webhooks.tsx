import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Webhook,
    Copy,
    Check,
    AlertTriangle,
    Shield,
    Eye,
    EyeOff,
    Trash2,
    XCircle,
    RefreshCw,
    ChevronDown,
    Play,
    Pause,
    CheckCircle2,
    ExternalLink,
    Send,
    Zap,
    FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ===== Types =====

interface DeviceWebhookType {
    id: string
    name: string
    url: string
    secret_masked?: string
    device_id: string
    device?: { id: string; name: string; type: string }
    status: string
    events: string
    max_retries: number
    timeout_secs: number
    success_count: number
    failure_count: number
    consecutive_failures: number
    last_delivered_at: string | null
    last_failed_at: string | null
    last_http_status: number
    last_error: string
    auto_disable_threshold: number
    created_at: string
}

interface WebhookLog {
    id: string
    event_type: string
    event_id: string
    request_url: string
    request_body: string
    response_status: number
    response_body: string
    response_time_msec: number
    status: string
    attempt_num: number
    error: string
    created_at: string
}

interface WebhookStats {
    total_webhooks: number
    active_webhooks: number
    paused_webhooks: number
    failed_webhooks: number
    total_deliveries: number
    total_failures: number
}

// ===== Create Webhook Dialog =====

interface CreateWebhookDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    devices: { id: string; name: string; type: string }[]
}

export function CreateWebhookDialog({ open, onOpenChange, onSuccess, devices }: CreateWebhookDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showSecret, setShowSecret] = useState(true)

    const [form, setForm] = useState({
        name: '',
        url: '',
        device_id: '',
        events: 'message.incoming,message.sent',
        max_retries: 3,
        timeout_secs: 10,
        auto_disable_threshold: 10,
    })

    const handleSubmit = async () => {
        if (!form.name || !form.url || !form.device_id) {
            toast.error('Nombre, URL y dispositivo son requeridos')
            return
        }
        setIsSubmitting(true)
        try {
            const response = await api.post('/webhooks', form)
            if (response.data.success) {
                setGeneratedSecret(response.data.data.secret)
                toast.success('Webhook creado exitosamente')
                onSuccess()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear webhook')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopy = () => {
        if (generatedSecret) {
            navigator.clipboard.writeText(generatedSecret)
            setCopied(true)
            toast.success('Secret copiado al portapapeles')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleClose = () => {
        setGeneratedSecret(null)
        setCopied(false)
        setShowSecret(true)
        setForm({
            name: '',
            url: '',
            device_id: '',
            events: 'message.incoming,message.sent',
            max_retries: 3,
            timeout_secs: 10,
            auto_disable_threshold: 10,
        })
        onOpenChange(false)
    }

    const eventOptions = [
        { value: 'message.incoming', label: 'Mensaje entrante', icon: '📨' },
        { value: 'message.sent', label: 'Mensaje enviado', icon: '📤' },
        { value: 'message.delivered', label: 'Mensaje entregado', icon: '✅' },
        { value: 'message.read', label: 'Mensaje leído', icon: '👀' },
        { value: 'conversation.created', label: 'Conversación creada', icon: '💬' },
        { value: 'conversation.closed', label: 'Conversación cerrada', icon: '🔒' },
        { value: 'conversation.assigned', label: 'Conversación asignada', icon: '👤' },
        { value: 'device.connected', label: 'Dispositivo conectado', icon: '🟢' },
        { value: 'device.disconnected', label: 'Dispositivo desconectado', icon: '🔴' },
        { value: 'contact.created', label: 'Contacto creado', icon: '👥' },
    ]

    // Success view - show secret
    if (generatedSecret) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-emerald-500/10 via-background to-background">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
                                        <Check className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg">Webhook Creado</DialogTitle>
                                        <DialogDescription>
                                            Copia el signing secret. <span className="text-destructive font-semibold">No se mostrará de nuevo.</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-amber-500" />
                                    <span className="text-xs text-amber-600 font-medium">
                                        Usa este secret para verificar las firmas HMAC-SHA256 en tu servidor.
                                    </span>
                                </div>

                                <div className="relative group">
                                    <div className="p-4 rounded-xl bg-card border-2 border-dashed border-primary/30 font-mono text-sm break-all select-all transition-all group-hover:border-primary/60">
                                        {showSecret ? generatedSecret : '•'.repeat(generatedSecret.length)}
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 opacity-60 hover:opacity-100"
                                            onClick={() => setShowSecret(!showSecret)}
                                        >
                                            {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn("h-7 w-7", copied ? "text-emerald-500" : "opacity-60 hover:opacity-100")}
                                            onClick={handleCopy}
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Verification example */}
                                <div className="rounded-xl bg-card/60 border p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <Shield className="h-3.5 w-3.5" />
                                        Verificación de firma (Node.js)
                                    </div>
                                    <pre className="text-[11px] leading-relaxed font-mono text-muted-foreground overflow-x-auto">
                                        {`const crypto = require('crypto');

function verifyWebhook(body, timestamp, signature, secret) {
  const signedContent = \`\${timestamp}.\${body}\`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature), Buffer.from(expected)
  );
}`}
                                    </pre>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleCopy} variant="outline" className="gap-2">
                                    <Copy className="h-4 w-4" />
                                    {copied ? '¡Copiado!' : 'Copiar Secret'}
                                </Button>
                                <Button onClick={handleClose} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                    <Check className="h-4 w-4" />
                                    Listo
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-br from-violet-500/5 via-background to-background">
                    <div className="p-6 space-y-6">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                    <Webhook className="h-6 w-6 text-violet-500" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg">Registrar Webhook</DialogTitle>
                                    <DialogDescription>
                                        Recibe eventos en tiempo real en tu servidor vía HTTP POST.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Nombre</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ej. CRM Integration"
                                    className="bg-muted/20"
                                />
                            </div>

                            {/* URL */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-1.5">
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    URL del Endpoint
                                </Label>
                                <Input
                                    value={form.url}
                                    onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://your-server.com/webhook"
                                    className="bg-muted/20 font-mono text-sm"
                                />
                            </div>

                            {/* Device */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Dispositivo</Label>
                                <Select
                                    value={form.device_id}
                                    onValueChange={(val) => setForm(f => ({ ...f, device_id: val }))}
                                >
                                    <SelectTrigger className="bg-muted/20">
                                        <SelectValue placeholder="Seleccionar dispositivo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {devices.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">
                                                        {d.type === 'whatsapp' ? '📱' : d.type === 'web' ? '🌐' : d.type === 'telegram' ? '✈️' : '📡'}
                                                    </span>
                                                    {d.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Events */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                    Eventos a recibir
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {eventOptions.map(event => {
                                        const isActive = form.events.includes(event.value)
                                        return (
                                            <button
                                                key={event.value}
                                                type="button"
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                                                    isActive
                                                        ? "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400"
                                                        : "bg-muted/10 border-muted-foreground/10 text-muted-foreground hover:border-violet-500/20"
                                                )}
                                                onClick={() => {
                                                    const events = form.events.split(',').filter(s => s.trim())
                                                    if (isActive) {
                                                        setForm(f => ({
                                                            ...f,
                                                            events: events.filter(s => s !== event.value).join(',')
                                                        }))
                                                    } else {
                                                        setForm(f => ({
                                                            ...f,
                                                            events: [...events, event.value].join(',')
                                                        }))
                                                    }
                                                }}
                                            >
                                                <span>{event.icon}</span>
                                                <span>{event.label}</span>
                                                {isActive && <Check className="h-3 w-3 ml-auto" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Advanced settings */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Max Reintentos</Label>
                                    <Input
                                        type="number"
                                        value={form.max_retries}
                                        onChange={(e) => setForm(f => ({ ...f, max_retries: parseInt(e.target.value) || 3 }))}
                                        className="bg-muted/20"
                                        min={0}
                                        max={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Timeout (seg)</Label>
                                    <Input
                                        type="number"
                                        value={form.timeout_secs}
                                        onChange={(e) => setForm(f => ({ ...f, timeout_secs: parseInt(e.target.value) || 10 }))}
                                        className="bg-muted/20"
                                        min={1}
                                        max={30}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Auto-disable</Label>
                                    <Input
                                        type="number"
                                        value={form.auto_disable_threshold}
                                        onChange={(e) => setForm(f => ({ ...f, auto_disable_threshold: parseInt(e.target.value) || 10 }))}
                                        className="bg-muted/20"
                                        min={3}
                                        max={100}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !form.name || !form.url || !form.device_id}
                                className="gap-2 bg-violet-600 hover:bg-violet-700"
                            >
                                {isSubmitting ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Webhook className="h-4 w-4" />
                                )}
                                Crear Webhook
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ===== Webhook List Component =====

interface WebhookListProps {
    webhooks: DeviceWebhookType[]
    onDelete: (id: string) => void
    onToggle: (id: string, status: string) => void
    onTest: (id: string) => void
    onViewLogs: (id: string) => void
    isLoading: boolean
}

export function WebhookList({ webhooks, onDelete, onToggle, onTest, onViewLogs, isLoading }: WebhookListProps) {
    const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        )
    }

    if (webhooks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 flex items-center justify-center ring-1 ring-violet-500/10">
                        <Webhook className="h-10 w-10 text-violet-500/40" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                        <span className="text-[10px]">🔔</span>
                    </div>
                </div>
                <h3 className="text-lg font-bold mb-1">Sin Webhooks</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                    Registra tu primer webhook para recibir eventos en tiempo real en tu servidor.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {webhooks.map(wh => {
                const isExpanded = expandedWebhook === wh.id
                const isActive = wh.status === 'active'
                const isFailed = wh.status === 'failed'
                const isPaused = wh.status === 'paused'

                const successRate = (wh.success_count + wh.failure_count) > 0
                    ? Math.round((wh.success_count / (wh.success_count + wh.failure_count)) * 100)
                    : 100

                return (
                    <div
                        key={wh.id}
                        className={cn(
                            "rounded-xl border transition-all duration-200",
                            isActive
                                ? "bg-card/60 border-border/60 hover:border-violet-500/20"
                                : isFailed
                                    ? "bg-destructive/5 border-destructive/20"
                                    : "bg-muted/10 border-border/30 opacity-70"
                        )}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
                            onClick={() => setExpandedWebhook(isExpanded ? null : wh.id)}
                        >
                            <div className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                                isActive ? "bg-violet-500/10" : isFailed ? "bg-destructive/10" : "bg-muted/30"
                            )}>
                                <Webhook className={cn(
                                    "h-4 w-4",
                                    isActive ? "text-violet-500" : isFailed ? "text-destructive" : "text-muted-foreground"
                                )} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold truncate">{wh.name}</span>
                                    <Badge
                                        variant={isActive ? 'default' : isFailed ? 'destructive' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {wh.status === 'active' ? 'Activo' : wh.status === 'failed' ? 'Fallido' : 'Pausado'}
                                    </Badge>
                                    {successRate < 90 && (wh.success_count + wh.failure_count > 0) && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                                            {successRate}% éxito
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="font-mono truncate max-w-[200px]">{wh.url}</span>
                                    {wh.device && (
                                        <>
                                            <span>•</span>
                                            <span>{wh.device.name}</span>
                                        </>
                                    )}
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                        {wh.success_count}
                                    </span>
                                    {wh.failure_count > 0 && (
                                        <span className="flex items-center gap-1 text-destructive">
                                            <XCircle className="h-3 w-3" />
                                            {wh.failure_count}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-180"
                            )} />
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-border/40 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Eventos</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {wh.events.split(',').map(e => (
                                                <Badge key={e} variant="outline" className="text-[9px] px-1.5 py-0">
                                                    {e.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reintentos</span>
                                        <p className="text-sm font-medium mt-1">{wh.max_retries} intentos</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Última entrega</span>
                                        <p className="text-sm mt-1">
                                            {wh.last_delivered_at
                                                ? new Date(wh.last_delivered_at).toLocaleString()
                                                : 'Nunca'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Signing Secret</span>
                                        <p className="text-sm font-mono mt-1">{wh.secret_masked || '•••'}</p>
                                    </div>
                                </div>

                                {/* Last error */}
                                {wh.last_error && (
                                    <div className="mb-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                                        <div className="flex items-center gap-2 text-xs">
                                            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                                            <span className="text-destructive font-medium">Último error:</span>
                                            <span className="text-muted-foreground truncate">{wh.last_error}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-border/20 flex-wrap">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onTest(wh.id)
                                        }}
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Test
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onViewLogs(wh.id)
                                        }}
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        Logs
                                    </Button>

                                    {isActive && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 text-xs text-amber-600 hover:bg-amber-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onToggle(wh.id, 'paused')
                                            }}
                                        >
                                            <Pause className="h-3.5 w-3.5" />
                                            Pausar
                                        </Button>
                                    )}

                                    {(isPaused || isFailed) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 text-xs text-emerald-600 hover:bg-emerald-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onToggle(wh.id, 'active')
                                            }}
                                        >
                                            <Play className="h-3.5 w-3.5" />
                                            Activar
                                        </Button>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 ml-auto"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(wh.id)
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ===== Webhook Logs Dialog =====

interface WebhookLogsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    webhookId: string | null
    webhookName: string
}

export function WebhookLogsDialog({ open, onOpenChange, webhookId, webhookName }: WebhookLogsDialogProps) {
    const [logs, setLogs] = useState<WebhookLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [expandedLog, setExpandedLog] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchLogs = useCallback(async () => {
        if (!webhookId) return
        setIsLoading(true)
        try {
            const res = await api.get(`/webhooks/${webhookId}/logs?page=${page}&per_page=15`)
            if (res.data.success) {
                setLogs(res.data.data || [])
                setTotalPages(res.data.meta?.pages || 1)
            }
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setIsLoading(false)
        }
    }, [webhookId, page])

    useEffect(() => {
        if (open && webhookId) {
            fetchLogs()
        }
    }, [open, webhookId, fetchLogs])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl max-h-[85vh]">
                <div className="p-6 space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                <FileText className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <DialogTitle>Delivery Logs</DialogTitle>
                                <DialogDescription>{webhookName}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />
                                ))}
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                Sin logs de entrega aún
                            </div>
                        ) : logs.map(log => {
                            const isSuccess = log.status === 'success'
                            const isExp = expandedLog === log.id

                            return (
                                <div
                                    key={log.id}
                                    className={cn(
                                        "rounded-lg border transition-all cursor-pointer",
                                        isSuccess ? "border-border/40" : "border-destructive/20 bg-destructive/5"
                                    )}
                                >
                                    <div
                                        className="flex items-center gap-3 px-3 py-2.5"
                                        onClick={() => setExpandedLog(isExp ? null : log.id)}
                                    >
                                        <div className={cn(
                                            "h-6 w-6 rounded flex items-center justify-center shrink-0",
                                            isSuccess ? "bg-emerald-500/10" : "bg-destructive/10"
                                        )}>
                                            {isSuccess
                                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                : <XCircle className="h-3.5 w-3.5 text-destructive" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                                                    {log.event_type}
                                                </Badge>
                                                {log.response_status > 0 && (
                                                    <Badge variant={isSuccess ? "default" : "destructive"} className="text-[9px] px-1.5 py-0">
                                                        HTTP {log.response_status}
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] text-muted-foreground">
                                                    {log.response_time_msec}ms
                                                </span>
                                                {log.attempt_num > 1 && (
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600">
                                                        intento #{log.attempt_num}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>

                                        <ChevronDown className={cn(
                                            "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                                            isExp && "rotate-180"
                                        )} />
                                    </div>

                                    {isExp && (
                                        <div className="px-3 pb-3 pt-0 border-t border-border/20 space-y-2 animate-in fade-in duration-200">
                                            {log.error && (
                                                <div className="p-2 rounded bg-destructive/10 text-xs text-destructive font-mono">
                                                    {log.error}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground">Request Body</span>
                                                    <pre className="text-[10px] font-mono text-muted-foreground p-2 rounded bg-muted/20 mt-1 max-h-[120px] overflow-auto">
                                                        {(() => {
                                                            try { return JSON.stringify(JSON.parse(log.request_body), null, 2) }
                                                            catch { return log.request_body }
                                                        })()}
                                                    </pre>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground">Response Body</span>
                                                    <pre className="text-[10px] font-mono text-muted-foreground p-2 rounded bg-muted/20 mt-1 max-h-[120px] overflow-auto">
                                                        {log.response_body || '(empty)'}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 border-t">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Anterior
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Página {page} de {totalPages}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={fetchLogs}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Actualizar
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ===== Webhook Stats Bar =====

interface WebhookStatsBarProps {
    stats: WebhookStats | null
}

export function WebhookStatsBar({ stats }: WebhookStatsBarProps) {
    if (!stats) return null

    const items = [
        { label: 'Activos', value: stats.active_webhooks, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Pausados', value: stats.paused_webhooks, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Fallidos', value: stats.failed_webhooks, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Entregas Totales', value: stats.total_deliveries.toLocaleString(), color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map(item => (
                <div key={item.label} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", item.bg)}>
                    <div className={cn("text-2xl font-bold tabular-nums", item.color)}>{item.value}</div>
                    <div className="text-xs text-muted-foreground font-medium">{item.label}</div>
                </div>
            ))}
        </div>
    )
}

// ===== Webhook Payload Format Reference =====

export function WebhookPayloadReference() {
    return (
        <div className="rounded-xl border bg-card/40 overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold">Formato del Payload</span>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Headers que recibirás:</h4>
                    <div className="space-y-1">
                        {[
                            { header: 'Content-Type', value: 'application/json' },
                            { header: 'X-Webhook-ID', value: 'UUID del webhook' },
                            { header: 'X-Webhook-Event', value: 'Tipo de evento' },
                            { header: 'X-Webhook-Timestamp', value: 'Unix timestamp' },
                            { header: 'X-Webhook-Signature', value: 'HMAC-SHA256 signature' },
                            { header: 'X-Webhook-Delivery', value: 'ID único de entrega' },
                        ].map(h => (
                            <div key={h.header} className="flex items-center gap-2 text-xs">
                                <code className="font-mono text-primary font-semibold">{h.header}</code>
                                <span className="text-muted-foreground">— {h.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Body (JSON):</h4>
                    <pre className="text-[11px] font-mono text-muted-foreground p-3 rounded-lg bg-muted/20 overflow-x-auto">
                        {`{
  "id": "uuid-unique-event-id",
  "type": "message.incoming",
  "timestamp": "2026-02-10T22:47:42Z",
  "device_id": "uuid-device-id",
  "org_id": "uuid-organization-id",
  "data": {
    "message_id": "uuid",
    "conversation_id": "uuid",
    "content": "Hola! 👋",
    "content_type": "text",
    "sender_type": "contact",
    "contact": {
      "name": "Juan Pérez",
      "phone": "+521234567890"
    }
  }
}`}
                    </pre>
                </div>
            </div>
        </div>
    )
}
