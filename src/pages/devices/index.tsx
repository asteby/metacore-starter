import { useState, useEffect, useCallback } from 'react'
import { DynamicTable } from '@/components/dynamic-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    Key,
    Plus,
    Smartphone,
    Wifi,
    Shield,
    Code2,
    Zap,
    BarChart3,
    RefreshCw,
    Webhook,
} from 'lucide-react'
import {
    GenerateTokenDialog,
    TokenList,
    TokenStatsBar,
    APIDocsSnippet,
} from './device-api-tokens'
import {
    CreateWebhookDialog,
    WebhookList,
    WebhookStatsBar,
    WebhookLogsDialog,
    WebhookPayloadReference,
} from './device-webhooks'

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

interface WebhookStats {
    total_webhooks: number
    active_webhooks: number
    paused_webhooks: number
    failed_webhooks: number
    total_deliveries: number
    total_failures: number
}

export default function DevicesPage() {
    // Token state
    const [tokens, setTokens] = useState<DeviceAPIToken[]>([])
    const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
    const [isLoadingTokens, setIsLoadingTokens] = useState(true)
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false)

    // Webhook state
    const [webhooks, setWebhooks] = useState<any[]>([])
    const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null)
    const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true)
    const [createWebhookOpen, setCreateWebhookOpen] = useState(false)
    const [webhookLogsOpen, setWebhookLogsOpen] = useState(false)
    const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)
    const [selectedWebhookName, setSelectedWebhookName] = useState('')

    // Shared
    const [devices, setDevices] = useState<any[]>([])

    const fetchTokens = useCallback(async () => {
        setIsLoadingTokens(true)
        try {
            const [tokensRes, statsRes] = await Promise.all([
                api.get('/device-tokens'),
                api.get('/device-tokens/stats'),
            ])
            if (tokensRes.data.success) setTokens(tokensRes.data.data || [])
            if (statsRes.data.success) setTokenStats(statsRes.data.data)
        } catch (error) {
            console.error('Error fetching tokens:', error)
        } finally {
            setIsLoadingTokens(false)
        }
    }, [])

    const fetchWebhooks = useCallback(async () => {
        setIsLoadingWebhooks(true)
        try {
            const [webhooksRes, statsRes] = await Promise.all([
                api.get('/webhooks'),
                api.get('/webhooks/stats'),
            ])
            if (webhooksRes.data.success) setWebhooks(webhooksRes.data.data || [])
            if (statsRes.data.success) setWebhookStats(statsRes.data.data)
        } catch (error) {
            console.error('Error fetching webhooks:', error)
        } finally {
            setIsLoadingWebhooks(false)
        }
    }, [])

    const fetchDevices = useCallback(async () => {
        try {
            const res = await api.get('/data/devices/me?per_page=100')
            if (res.data.success) {
                setDevices(res.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching devices:', error)
        }
    }, [])

    useEffect(() => {
        fetchTokens()
        fetchWebhooks()
        fetchDevices()
    }, [fetchTokens, fetchWebhooks, fetchDevices])

    // Token handlers
    const handleRevokeToken = async (tokenId: string) => {
        try {
            const res = await api.post(`/device-tokens/${tokenId}/revoke`)
            if (res.data.success) {
                toast.success('Token revocado exitosamente')
                fetchTokens()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al revocar token')
        }
    }

    const handleDeleteToken = async (tokenId: string) => {
        try {
            const res = await api.delete(`/device-tokens/${tokenId}`)
            if (res.data.success) {
                toast.success('Token eliminado')
                fetchTokens()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar token')
        }
    }

    // Webhook handlers
    const handleDeleteWebhook = async (webhookId: string) => {
        try {
            const res = await api.delete(`/webhooks/${webhookId}`)
            if (res.data.success) {
                toast.success('Webhook eliminado')
                fetchWebhooks()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar webhook')
        }
    }

    const handleToggleWebhook = async (webhookId: string, newStatus: string) => {
        try {
            const res = await api.put(`/webhooks/${webhookId}`, { status: newStatus })
            if (res.data.success) {
                toast.success(newStatus === 'active' ? 'Webhook activado' : 'Webhook pausado')
                fetchWebhooks()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar webhook')
        }
    }

    const handleTestWebhook = async (webhookId: string) => {
        try {
            const res = await api.post(`/webhooks/${webhookId}/test`)
            if (res.data.success) {
                toast.success('Evento de prueba enviado. Revisa los logs en unos segundos.')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al enviar test')
        }
    }

    const handleViewLogs = (webhookId: string) => {
        const wh = webhooks.find(w => w.id === webhookId)
        setSelectedWebhookId(webhookId)
        setSelectedWebhookName(wh?.name || 'Webhook')
        setWebhookLogsOpen(true)
    }

    // Stats
    const activeDevices = devices.filter(d => d.status === 'active' || d.status === 'connected').length
    const totalDevices = devices.length

    return (
        <div className='p-6 space-y-6'>
            {/* Page Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Canales y Dispositivos 📱</h2>
                    <p className='text-muted-foreground'>
                        Conecta canales, genera API tokens y configura webhooks para integraciones en tiempo real.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-card to-card/80 border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Smartphone className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDevices}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {activeDevices} activos
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-card/80 border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Tokens</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                            <Key className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tokenStats?.active_tokens ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {(tokenStats?.total_usage ?? 0).toLocaleString()} API calls totales
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-card/80 border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                            <Webhook className="h-4 w-4 text-violet-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{webhookStats?.active_webhooks ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {(webhookStats?.total_deliveries ?? 0).toLocaleString()} entregas totales
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-card/80 border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Salud</CardTitle>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                            <Shield className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-1">
                            {(webhookStats?.failed_webhooks ?? 0) > 0 ? (
                                <><span className="text-amber-500">⚠</span> <span className="text-base">Atención</span></>
                            ) : (
                                <><span className="text-emerald-500">●</span> OK</>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {webhookStats?.failed_webhooks ?? 0} webhooks fallidos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="connections" className="space-y-4">
                <TabsList className="bg-muted/30 p-1">
                    <TabsTrigger value="connections" className="gap-2 data-[state=active]:bg-background">
                        <Wifi className="h-4 w-4" />
                        Conexiones
                    </TabsTrigger>
                    <TabsTrigger value="api-tokens" className="gap-2 data-[state=active]:bg-background">
                        <Key className="h-4 w-4" />
                        API Tokens
                        {(tokenStats?.active_tokens ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                                {tokenStats?.active_tokens}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="gap-2 data-[state=active]:bg-background">
                        <Webhook className="h-4 w-4" />
                        Webhooks
                        {(webhookStats?.active_webhooks ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                                {webhookStats?.active_webhooks}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="api-docs" className="gap-2 data-[state=active]:bg-background">
                        <Code2 className="h-4 w-4" />
                        API Docs
                    </TabsTrigger>
                </TabsList>

                {/* ===== Connections Tab ===== */}
                <TabsContent value="connections" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conexiones Activas</CardTitle>
                            <CardDescription>
                                Administra los puntos de entrada de tus conversaciones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DynamicTable model="devices" />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ===== API Tokens Tab ===== */}
                <TabsContent value="api-tokens" className="space-y-4">
                    <TokenStatsBar stats={tokenStats} />

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5 text-primary" />
                                    Device API Tokens
                                </CardTitle>
                                <CardDescription>
                                    Genera tokens para que tus dispositivos se autentiquen con la API.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchTokens}>
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" className="gap-1.5 bg-primary" onClick={() => setGenerateDialogOpen(true)}>
                                    <Plus className="h-3.5 w-3.5" />
                                    Generar Token
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TokenList
                                tokens={tokens}
                                onRevoke={handleRevokeToken}
                                onDelete={handleDeleteToken}
                                isLoading={isLoadingTokens}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
                        <CardContent className="flex items-start gap-3 py-4">
                            <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-700 dark:text-amber-400">Seguridad de tokens</p>
                                <ul className="mt-1 space-y-1 text-muted-foreground text-xs list-disc list-inside">
                                    <li>Los tokens se almacenan como hashes SHA-256.</li>
                                    <li>Revoca inmediatamente cualquier token comprometido.</li>
                                    <li>Máximo 5 tokens activos por dispositivo.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ===== Webhooks Tab ===== */}
                <TabsContent value="webhooks" className="space-y-4">
                    <WebhookStatsBar stats={webhookStats} />

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Webhook className="h-5 w-5 text-violet-500" />
                                    Webhooks
                                </CardTitle>
                                <CardDescription>
                                    Recibe eventos en tiempo real en tu servidor. Cada evento incluye firma HMAC-SHA256.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchWebhooks}>
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                                    onClick={() => setCreateWebhookOpen(true)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Crear Webhook
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <WebhookList
                                webhooks={webhooks}
                                onDelete={handleDeleteWebhook}
                                onToggle={handleToggleWebhook}
                                onTest={handleTestWebhook}
                                onViewLogs={handleViewLogs}
                                isLoading={isLoadingWebhooks}
                            />
                        </CardContent>
                    </Card>

                    {/* Payload Reference */}
                    <WebhookPayloadReference />

                    <Card className="border-dashed border-violet-500/30 bg-violet-500/5">
                        <CardContent className="flex items-start gap-3 py-4">
                            <Shield className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-violet-700 dark:text-violet-400">Buenas prácticas de webhooks</p>
                                <ul className="mt-1 space-y-1 text-muted-foreground text-xs list-disc list-inside">
                                    <li>Siempre verifica la firma HMAC-SHA256 antes de procesar el payload.</li>
                                    <li>Responde con HTTP 200 en menos de 10 segundos para evitar reintentos.</li>
                                    <li>Usa el header <code className="font-mono text-primary">X-Webhook-Delivery</code> para deduplicar eventos.</li>
                                    <li>Los webhooks se desactivan automáticamente tras {'{N}'} fallos consecutivos.</li>
                                    <li>Máximo 5 webhooks por dispositivo.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ===== API Docs Tab ===== */}
                <TabsContent value="api-docs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code2 className="h-5 w-5 text-primary" />
                                Referencia de la API
                            </CardTitle>
                            <CardDescription>
                                Autentícate con <code className="text-primary font-mono text-xs">Authorization: Bearer lnk_YOUR_TOKEN</code>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Endpoints */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary" />
                                    Device API Endpoints
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { method: 'GET', path: '/api/v1/device/info', desc: 'Información del dispositivo y token' },
                                        { method: 'POST', path: '/api/v1/device/messages/send', desc: 'Enviar un mensaje' },
                                        { method: 'GET', path: '/api/v1/device/conversations', desc: 'Listar conversaciones' },
                                        { method: 'GET', path: '/api/v1/device/conversations/:id/messages', desc: 'Leer mensajes' },
                                        { method: 'POST', path: '/api/v1/device/webhook/test', desc: 'Probar conectividad' },
                                    ].map(ep => (
                                        <div key={ep.path} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card/40 hover:bg-card/80 transition-colors">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-mono px-2 py-0.5 ${ep.method === 'GET'
                                                    ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10'
                                                    : 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10'
                                                    }`}
                                            >
                                                {ep.method}
                                            </Badge>
                                            <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
                                            <span className="text-xs text-muted-foreground hidden md:inline">{ep.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Auth Methods */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Autenticación
                                </h3>
                                <div className="grid gap-2 md:grid-cols-3">
                                    {[
                                        { title: 'Bearer Token', code: 'Authorization: Bearer lnk_...', recommended: true },
                                        { title: 'Header', code: 'X-API-Key: lnk_...', recommended: false },
                                        { title: 'Query Param', code: '?api_key=lnk_...', recommended: false },
                                    ].map(m => (
                                        <div key={m.title} className="p-3 rounded-lg border bg-card/40 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold">{m.title}</span>
                                                {m.recommended && (
                                                    <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                                                        Recomendado
                                                    </Badge>
                                                )}
                                            </div>
                                            <code className="text-[10px] font-mono text-muted-foreground">{m.code}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Code Examples */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Ejemplos de Código
                                </h3>
                                <APIDocsSnippet />
                            </div>

                            {/* Scopes */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold">Scopes Disponibles</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {[
                                        { scope: 'messages:send', desc: 'Enviar mensajes', icon: '📤' },
                                        { scope: 'messages:read', desc: 'Leer mensajes', icon: '📨' },
                                        { scope: 'conversations:read', desc: 'Listar conversaciones', icon: '💬' },
                                        { scope: 'conversations:write', desc: 'Gestionar conversaciones', icon: '✏️' },
                                        { scope: 'contacts:read', desc: 'Leer contactos', icon: '👥' },
                                        { scope: 'contacts:write', desc: 'Gestionar contactos', icon: '📝' },
                                    ].map(s => (
                                        <div key={s.scope} className="flex items-center gap-2 p-2.5 rounded-lg border bg-card/40">
                                            <span>{s.icon}</span>
                                            <div>
                                                <code className="text-[10px] font-mono font-bold text-foreground">{s.scope}</code>
                                                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ===== Dialogs ===== */}
            <GenerateTokenDialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
                onSuccess={fetchTokens}
                devices={devices.map((d: any) => ({ id: d.id, name: d.name, type: d.type }))}
            />

            <CreateWebhookDialog
                open={createWebhookOpen}
                onOpenChange={setCreateWebhookOpen}
                onSuccess={fetchWebhooks}
                devices={devices.map((d: any) => ({ id: d.id, name: d.name, type: d.type }))}
            />

            <WebhookLogsDialog
                open={webhookLogsOpen}
                onOpenChange={setWebhookLogsOpen}
                webhookId={selectedWebhookId}
                webhookName={selectedWebhookName}
            />
        </div>
    )
}
