import { useState } from 'react'
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
    Key,
    Copy,
    Check,
    AlertTriangle,
    Shield,
    Clock,
    Zap,
    Eye,
    EyeOff,
    Trash2,
    XCircle,
    RefreshCw,
    ChevronDown,
    Activity,
    Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeviceAPIToken {
    id: string
    name: string
    token_prefix: string
    device_id: string
    device?: { id: string; name: string; type: string }
    scopes: string
    rate_limit_per_minute: number
    status: string
    usage_count: number
    last_used_at: string | null
    last_used_ip: string
    expires_at: string | null
    created_at: string
}

interface TokenStats {
    total_tokens: number
    active_tokens: number
    revoked_tokens: number
    expired_tokens: number
    total_usage: number
}

interface GenerateTokenDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    devices: { id: string; name: string; type: string }[]
}

export function GenerateTokenDialog({ open, onOpenChange, onSuccess, devices }: GenerateTokenDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generatedToken, setGeneratedToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showToken, setShowToken] = useState(true)

    const [form, setForm] = useState({
        name: '',
        device_id: '',
        scopes: 'messages:send,messages:read,conversations:read',
        rate_limit_per_minute: 60,
        expires_in: '90d',
    })

    const handleSubmit = async () => {
        if (!form.name || !form.device_id) {
            toast.error('Nombre y dispositivo son requeridos')
            return
        }
        setIsSubmitting(true)
        try {
            const response = await api.post('/device-tokens', form)
            if (response.data.success) {
                setGeneratedToken(response.data.data.token)
                toast.success('Token generado exitosamente')
                onSuccess()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al generar token')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopy = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken)
            setCopied(true)
            toast.success('Token copiado al portapapeles')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleClose = () => {
        setGeneratedToken(null)
        setCopied(false)
        setShowToken(true)
        setForm({
            name: '',
            device_id: '',
            scopes: 'messages:send,messages:read,conversations:read',
            rate_limit_per_minute: 60,
            expires_in: '90d',
        })
        onOpenChange(false)
    }

    const scopeOptions = [
        { value: 'messages:send', label: 'Enviar mensajes', icon: '📤' },
        { value: 'messages:read', label: 'Leer mensajes', icon: '📨' },
        { value: 'conversations:read', label: 'Ver conversaciones', icon: '💬' },
        { value: 'conversations:write', label: 'Gestionar conversaciones', icon: '✏️' },
        { value: 'contacts:read', label: 'Leer contactos', icon: '👥' },
        { value: 'contacts:write', label: 'Gestionar contactos', icon: '📝' },
    ]

    // If token was generated, show the success view
    if (generatedToken) {
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
                                        <DialogTitle className="text-lg">Token Generado</DialogTitle>
                                        <DialogDescription>
                                            Copia este token ahora. <span className="text-destructive font-semibold">No se mostrará de nuevo.</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <span className="text-xs text-amber-600 font-medium">
                                        Guarda este token en un lugar seguro. Es la única vez que lo verás.
                                    </span>
                                </div>

                                <div className="relative group">
                                    <div className="p-4 rounded-xl bg-card border-2 border-dashed border-primary/30 font-mono text-sm break-all select-all transition-all group-hover:border-primary/60">
                                        {showToken ? generatedToken : '•'.repeat(generatedToken.length)}
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 opacity-60 hover:opacity-100"
                                            onClick={() => setShowToken(!showToken)}
                                        >
                                            {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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

                                {/* Quick usage example */}
                                <div className="rounded-xl bg-card/60 border p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <Code2 className="h-3.5 w-3.5" />
                                        Ejemplo de uso
                                    </div>
                                    <pre className="text-[11px] leading-relaxed font-mono text-muted-foreground overflow-x-auto">
                                        {`curl -X GET \\
  ${window.location.origin}/api/v1/device/info \\
  -H "Authorization: Bearer ${generatedToken.substring(0, 20)}..."`}
                                    </pre>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleCopy} variant="outline" className="gap-2">
                                    <Copy className="h-4 w-4" />
                                    {copied ? '¡Copiado!' : 'Copiar Token'}
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
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary/5 via-background to-background">
                    <div className="p-6 space-y-6">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                                    <Key className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg">Generar API Token</DialogTitle>
                                    <DialogDescription>
                                        Crea un token para integrar dispositivos con la API.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Nombre del Token</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ej. Production API v1"
                                    className="bg-muted/20"
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

                            <div className="grid grid-cols-2 gap-4">
                                {/* Expiration */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        Expiración
                                    </Label>
                                    <Select
                                        value={form.expires_in}
                                        onValueChange={(val) => setForm(f => ({ ...f, expires_in: val }))}
                                    >
                                        <SelectTrigger className="bg-muted/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30d">30 días</SelectItem>
                                            <SelectItem value="90d">90 días</SelectItem>
                                            <SelectItem value="365d">1 año</SelectItem>
                                            <SelectItem value="never">Sin expiración</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Rate Limit */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                        Req/minuto
                                    </Label>
                                    <Input
                                        type="number"
                                        value={form.rate_limit_per_minute}
                                        onChange={(e) => setForm(f => ({ ...f, rate_limit_per_minute: parseInt(e.target.value) || 60 }))}
                                        className="bg-muted/20"
                                        min={1}
                                        max={1000}
                                    />
                                </div>
                            </div>

                            {/* Scopes */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                    Permisos
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {scopeOptions.map(scope => {
                                        const isActive = form.scopes.includes(scope.value)
                                        return (
                                            <button
                                                key={scope.value}
                                                type="button"
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                                                    isActive
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-muted/10 border-muted-foreground/10 text-muted-foreground hover:border-primary/20"
                                                )}
                                                onClick={() => {
                                                    const scopes = form.scopes.split(',').filter(s => s)
                                                    if (isActive) {
                                                        setForm(f => ({
                                                            ...f,
                                                            scopes: scopes.filter(s => s !== scope.value).join(',')
                                                        }))
                                                    } else {
                                                        setForm(f => ({
                                                            ...f,
                                                            scopes: [...scopes, scope.value].join(',')
                                                        }))
                                                    }
                                                }}
                                            >
                                                <span>{scope.icon}</span>
                                                <span>{scope.label}</span>
                                                {isActive && <Check className="h-3 w-3 ml-auto" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !form.name || !form.device_id}
                                className="gap-2 bg-primary"
                            >
                                {isSubmitting ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Key className="h-4 w-4" />
                                )}
                                Generar Token
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ===== Token List Component =====

interface TokenListProps {
    tokens: DeviceAPIToken[]
    onRevoke: (id: string) => void
    onDelete: (id: string) => void
    isLoading: boolean
}

export function TokenList({ tokens, onRevoke, onDelete, isLoading }: TokenListProps) {
    const [expandedToken, setExpandedToken] = useState<string | null>(null)

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        )
    }

    if (tokens.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                        <Key className="h-10 w-10 text-primary/40" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                        <span className="text-[10px]">🔒</span>
                    </div>
                </div>
                <h3 className="text-lg font-bold mb-1">Sin API Tokens</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                    Genera tu primer token para integrar dispositivos con tu aplicación vía API.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {tokens.map(token => {
                const isExpanded = expandedToken === token.id
                const isActive = token.status === 'active'
                const isRevoked = token.status === 'revoked'

                return (
                    <div
                        key={token.id}
                        className={cn(
                            "rounded-xl border transition-all duration-200",
                            isActive
                                ? "bg-card/60 border-border/60 hover:border-primary/20"
                                : "bg-muted/10 border-border/30 opacity-70"
                        )}
                    >
                        {/* Header row */}
                        <div
                            className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
                            onClick={() => setExpandedToken(isExpanded ? null : token.id)}
                        >
                            <div className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                                isActive ? "bg-emerald-500/10" : "bg-muted/30"
                            )}>
                                <Key className={cn(
                                    "h-4 w-4",
                                    isActive ? "text-emerald-500" : "text-muted-foreground"
                                )} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold truncate">{token.name}</span>
                                    <Badge
                                        variant={isActive ? 'default' : isRevoked ? 'destructive' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {token.status === 'active' ? 'Activo' : token.status === 'revoked' ? 'Revocado' : 'Expirado'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="font-mono">{token.token_prefix}•••</span>
                                    {token.device && (
                                        <>
                                            <span>•</span>
                                            <span>{token.device.name}</span>
                                        </>
                                    )}
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        {token.usage_count} usos
                                    </span>
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
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Permisos</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {token.scopes.split(',').map(s => (
                                                <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">
                                                    {s.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rate Limit</span>
                                        <p className="text-sm font-medium mt-1">{token.rate_limit_per_minute} req/min</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Último uso</span>
                                        <p className="text-sm mt-1">
                                            {token.last_used_at
                                                ? new Date(token.last_used_at).toLocaleDateString()
                                                : 'Nunca'}
                                        </p>
                                        {token.last_used_ip && (
                                            <p className="text-[10px] text-muted-foreground font-mono">{token.last_used_ip}</p>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Expira</span>
                                        <p className="text-sm mt-1">
                                            {token.expires_at
                                                ? new Date(token.expires_at).toLocaleDateString()
                                                : 'Nunca'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                                    {isActive && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onRevoke(token.id)
                                            }}
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                            Revocar
                                        </Button>
                                    )}
                                    {!isActive && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(token.id)
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Eliminar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ===== Stats Bar Component =====

interface TokenStatsBarProps {
    stats: TokenStats | null
}

export function TokenStatsBar({ stats }: TokenStatsBarProps) {
    if (!stats) return null

    const items = [
        { label: 'Activos', value: stats.active_tokens, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Revocados', value: stats.revoked_tokens, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Expirados', value: stats.expired_tokens, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Total API Calls', value: stats.total_usage.toLocaleString(), color: 'text-primary', bg: 'bg-primary/10' },
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

// ===== API Docs Snippet =====

export function APIDocsSnippet() {
    const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl')

    const snippets = {
        curl: `# Obtener info del dispositivo
curl -X GET \\
  ${window.location.origin}/api/v1/device/info \\
  -H "Authorization: Bearer lnk_YOUR_TOKEN"

# Enviar un mensaje
curl -X POST \\
  ${window.location.origin}/api/v1/device/messages/send \\
  -H "Authorization: Bearer lnk_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "+521234567890", "message": "Hola!", "type": "text"}'

# Listar conversaciones
curl -X GET \\
  "${window.location.origin}/api/v1/device/conversations?page=1&per_page=20" \\
  -H "Authorization: Bearer lnk_YOUR_TOKEN"`,

        js: `// Node.js / Fetch API
const API_URL = '${window.location.origin}/api/v1/device';
const TOKEN = 'lnk_YOUR_TOKEN';

const headers = {
  'Authorization': \`Bearer \${TOKEN}\`,
  'Content-Type': 'application/json'
};

// Obtener info del dispositivo
const info = await fetch(\`\${API_URL}/info\`, { headers });

// Enviar un mensaje
const send = await fetch(\`\${API_URL}/messages/send\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    to: '+521234567890',
    message: 'Hola desde la API!',
    type: 'text'
  })
});

// Listar conversaciones
const convos = await fetch(\`\${API_URL}/conversations?page=1\`, { headers });`,

        python: `import requests

API_URL = '${window.location.origin}/api/v1/device'
TOKEN = 'lnk_YOUR_TOKEN'
headers = {'Authorization': f'Bearer {TOKEN}'}

# Obtener info del dispositivo
info = requests.get(f'{API_URL}/info', headers=headers)

# Enviar un mensaje
send = requests.post(f'{API_URL}/messages/send',
    headers=headers,
    json={
        'to': '+521234567890',
        'message': 'Hola desde Python!',
        'type': 'text'
    })

# Listar conversaciones
convos = requests.get(f'{API_URL}/conversations',
    headers=headers, params={'page': 1, 'per_page': 20})`
    }

    return (
        <div className="rounded-xl border bg-card/40 overflow-hidden">
            <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/20">
                <Code2 className="h-4 w-4 text-muted-foreground mr-2" />
                {(['curl', 'js', 'python'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-3 py-1 rounded-md text-xs font-medium transition-all",
                            activeTab === tab
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                    >
                        {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JavaScript' : 'Python'}
                    </button>
                ))}
            </div>
            <pre className="p-4 text-[11px] leading-relaxed font-mono text-muted-foreground overflow-x-auto max-h-[300px] custom-scrollbar">
                {snippets[activeTab]}
            </pre>
        </div>
    )
}
