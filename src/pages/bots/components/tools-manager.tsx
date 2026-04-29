import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Loader2,
    Plus,
    Webhook,
    Globe,
    Database,
    Server,
    Trash2,
    Edit,
    Play,
    Power,
    PowerOff,
    CheckCircle2,
    BarChart3,
    Zap,
    Clock,
    Variable,
    XCircle,
    Timer,
    ArrowRight,
    Copy,
    Check,
    Package,
    Bell,
    BellOff,
    MessageSquare,
    Ticket,
    CalendarDays,
    Phone,
    Mail,
    MonitorSmartphone,
    Smartphone,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput } from '@/components/ui/phone-input'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { ToolEditorPro } from './tool-editor-pro'

interface NotificationRule {
    event: string
    channel: string
    target: string
    device_id?: string
    message: string
    enabled: boolean
}

interface DeviceOption {
    id: string
    name: string
    type: string
    identifier: string
    status: string
}

interface AgentTool {
    id: string
    name: string
    description: string
    type: 'webhook' | 'api' | 'mcp' | 'query'
    category: string
    endpoint: string
    method: string
    auth_type: string
    auth_config?: Record<string, any>
    headers?: Record<string, any>
    parameters?: Record<string, any>
    input_schema?: any[]
    body_template?: string
    enabled: boolean
    timeout: number
    usage_count: number
    success_count: number
    error_count: number
    avg_response_ms: number
    created_at: string
    oauth_provider?: string
    auto_create_record?: string
    notifications?: NotificationRule[]
    marketplace_slug?: string
    marketplace_tool_id?: string
}

interface MarketplaceIntegration {
    slug: string
    name: string
    icon_type: 'brand' | 'lucide' | 'url'
    icon_slug: string
    icon_color: string
}

interface ToolsManagerProps {
    agentId: string
    onToolsUpdate?: () => void
}

const TOOL_TYPES = [
    { value: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { value: 'api', label: 'API REST', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { value: 'mcp', label: 'MCP Server', icon: Server, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { value: 'query', label: 'SQL Query', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
]

const NOTIFICATION_CHANNELS = [
    { value: 'whatsapp_contact', label: 'WhatsApp al contacto', icon: MessageSquare, group: 'whatsapp', description: 'Responde al contacto en la conversación activa' },
    { value: 'whatsapp_number', label: 'WhatsApp a número fijo', icon: Phone, group: 'whatsapp', description: 'Envía a un número específico (ej: supervisor)' },
    { value: 'email', label: 'Correo electrónico', icon: Mail, group: 'other', description: 'Envía un email a la dirección indicada' },
    { value: 'internal', label: 'Notificación interna', icon: Bell, group: 'other', description: 'Crea una alerta visible en el dashboard' },
]

// Default messages per channel — the event is auto-determined from the tool type
const DEFAULT_MESSAGES: Record<string, string> = {
    whatsapp_contact: '📋 Se procesó tu solicitud *{{title}}*. Te avisaremos si hay novedades. {{url}}',
    whatsapp_number: '🔔 *{{title}}* — acción ejecutada por {{contact_name}}. {{url}}',
    email: 'Acción ejecutada: {{title}}. Ver detalles: {{url}}',
    internal: '{{title}} — ejecutada por {{contact_name}}',
}

// Determines the event automatically — all tools use "tool_executed".
// The webhook handler matches by marketplace_tool_id to fire the right tool.
function resolveEvent(_tool: AgentTool | null): string {
    return 'tool_executed'
}

const AUTO_RECORD_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
    ticket: { icon: Ticket, label: 'Ticket', color: 'text-blue-500' },
    schedule: { icon: CalendarDays, label: 'Agenda', color: 'text-violet-500' },
}

export function ToolsManager({ agentId, onToolsUpdate }: ToolsManagerProps) {
    const [tools, setTools] = useState<AgentTool[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [editingTool, setEditingTool] = useState<AgentTool | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<AgentTool | null>(null)
    const [testing, setTesting] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<{
        tool: AgentTool
        success: boolean
        data?: any
        error?: string
        duration_ms?: number
        status_code?: number
        params_used?: Record<string, string>
    } | null>(null)
    const [copied, setCopied] = useState(false)
    const [notificationTool, setNotificationTool] = useState<AgentTool | null>(null)
    const [savingNotifications, setSavingNotifications] = useState(false)
    const [devices, setDevices] = useState<DeviceOption[]>([])
    const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([])

    // Fetch marketplace integrations for icon display
    useEffect(() => {
        api.get('/tool-marketplace').then(res => {
            if (res.data?.data) {
                setIntegrations(res.data.data)
            }
        }).catch(() => {})
    }, [])

    useEffect(() => {
        if (notificationTool) {
            api.get('/data/devices/me?per_page=100').then(res => {
                if (res.data?.data) {
                    setDevices(res.data.data.filter((d: DeviceOption) => d.type === 'whatsapp' && d.status === 'active'))
                }
            }).catch(() => {})
        }
    }, [notificationTool])

    const fetchTools = useCallback(async (silent = false) => {
        if (!agentId) return
        if (!silent) setLoading(true)
        try {
            const response = await api.get(`/agents/${agentId}/tools`)
            if (response.data.success) {
                setTools(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching tools:', error)
            if (!silent) toast.error('Error al cargar herramientas')
        } finally {
            if (!silent) setLoading(false)
        }
    }, [agentId])

    useEffect(() => {
        fetchTools()
    }, [fetchTools])

    const openEditor = (tool?: AgentTool) => {
        setEditingTool(tool || null)
        setShowEditor(true)
    }

    const handleDelete = async (tool: AgentTool) => {
        try {
            const response = await api.delete(`/tools/${tool.id}`)
            if (response.data.success) {
                toast.success('Herramienta eliminada')
                setTools(prev => prev.filter(t => t.id !== tool.id))
                onToolsUpdate?.()
            }
        } catch (error) {
            toast.error('Error al eliminar')
        } finally {
            setDeleteConfirm(null)
        }
    }

    const handleToggle = async (tool: AgentTool) => {
        try {
            const response = await api.post(`/tools/${tool.id}/toggle`)
            if (response.data.success) {
                setTools(prev => prev.map(t =>
                    t.id === tool.id ? { ...t, enabled: !t.enabled } : t
                ))
                toast.success(response.data.message)
            }
        } catch (error) {
            toast.error('Error al cambiar estado')
        }
    }

    const handleTest = async (tool: AgentTool) => {
        setTesting(tool.id)
        try {
            // Build test parameters from input_schema defaults/examples
            const testParams: Record<string, string> = {}
            if (tool.input_schema && Array.isArray(tool.input_schema)) {
                tool.input_schema.forEach((param: any) => {
                    if (param.default_value) {
                        testParams[param.name] = param.default_value
                    } else if (param.example) {
                        testParams[param.name] = param.example
                    }
                })
            }
            console.log('Testing tool:', tool.name, 'with params:', testParams)

            const response = await api.post(`/tools/${tool.id}/test`, {
                parameters: testParams
            })

            // Show result modal
            setTestResult({
                tool,
                success: response.data.success,
                data: response.data.data,
                error: response.data.error,
                duration_ms: response.data.duration_ms,
                status_code: response.data.status_code,
                params_used: testParams,
            })

            // Refresh tools to update stats (silent - no loader)
            fetchTools(true)
        } catch (error: any) {
            setTestResult({
                tool,
                success: false,
                error: error.response?.data?.message || error.message || 'Error de conexión',
                params_used: {},
            })
        } finally {
            setTesting(null)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getTypeInfo = (type: string) => {
        return TOOL_TYPES.find(t => t.value === type) || TOOL_TYPES[0]
    }

    const getSuccessRate = (tool: AgentTool) => {
        if (tool.usage_count === 0) return null
        return ((tool.success_count / tool.usage_count) * 100).toFixed(0)
    }

    const isMarketplaceTool = (tool: AgentTool) => {
        return !!tool.marketplace_slug
    }

    const saveToolNotifications = async (toolId: string, notifications: NotificationRule[]) => {
        setSavingNotifications(true)
        try {
            const response = await api.patch(`/tools/${toolId}`, { notifications })
            if (response.data.success) {
                setTools(prev => prev.map(t =>
                    t.id === toolId ? { ...t, notifications } : t
                ))
                setNotificationTool(prev => prev ? { ...prev, notifications } : null)
                toast.success('Notificaciones guardadas')
            }
        } catch (error) {
            toast.error('Error al guardar notificaciones')
        } finally {
            setSavingNotifications(false)
        }
    }

    const addNotificationRule = () => {
        if (!notificationTool) return
        const channel = 'whatsapp_contact'
        const newRule: NotificationRule = {
            event: resolveEvent(notificationTool),
            channel,
            target: '',
            device_id: '',
            message: DEFAULT_MESSAGES[channel] || '',
            enabled: true,
        }
        setNotificationTool({
            ...notificationTool,
            notifications: [...(notificationTool.notifications || []), newRule],
        })
    }

    const updateNotificationRule = (index: number, field: keyof NotificationRule, value: any) => {
        if (!notificationTool) return
        const updated = [...(notificationTool.notifications || [])]
        const rule = { ...updated[index], [field]: value }

        // Auto-fill default message when channel changes (only if message was a default or empty)
        if (field === 'channel') {
            const oldDefault = DEFAULT_MESSAGES[updated[index].channel] || ''
            const currentMsg = updated[index].message
            if (!currentMsg || currentMsg === oldDefault) {
                rule.message = DEFAULT_MESSAGES[value as string] || ''
            }
            rule.target = ''
            rule.device_id = ''
        }

        updated[index] = rule
        setNotificationTool({ ...notificationTool, notifications: updated })
    }

    const removeNotificationRule = (index: number) => {
        if (!notificationTool) return
        const updated = (notificationTool.notifications || []).filter((_, i) => i !== index)
        setNotificationTool({ ...notificationTool, notifications: updated })
    }

    // Group tools by integration slug
    const marketplaceTools = tools.filter(isMarketplaceTool)
    const customTools = tools.filter(t => !isMarketplaceTool(t))

    // Build integration lookup map
    const integrationMap = new Map<string, MarketplaceIntegration>()
    integrations.forEach(i => integrationMap.set(i.slug, i))

    // Group marketplace tools by slug
    const groupedByIntegration = new Map<string, AgentTool[]>()
    marketplaceTools.forEach(tool => {
        const slug = tool.marketplace_slug || 'unknown'
        if (!groupedByIntegration.has(slug)) {
            groupedByIntegration.set(slug, [])
        }
        groupedByIntegration.get(slug)!.push(tool)
    })

    const renderIntegrationIcon = (integration: MarketplaceIntegration | undefined, size = 20) => {
        if (!integration) return <Package className="h-5 w-5 text-indigo-500" />
        const src = integration.icon_type === 'url'
            ? integration.icon_slug
            : integration.icon_type === 'brand'
                ? `https://cdn.simpleicons.org/${integration.icon_slug}/${integration.icon_color}`
                : null
        if (src) {
            return (
                <img
                    src={src}
                    alt={integration.name}
                    width={size}
                    height={size}
                    className="object-contain dark:brightness-0 dark:invert"
                    onError={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                    }}
                />
            )
        }
        return <Package className="h-5 w-5 text-indigo-500" />
    }

    const renderToolCard = (tool: AgentTool, isIntegration: boolean) => {
        const typeInfo = getTypeInfo(tool.type)
        const TypeIcon = typeInfo.icon
        const successRate = getSuccessRate(tool)
        const paramCount = tool.input_schema?.length || 0
        const autoRecord = tool.auto_create_record ? AUTO_RECORD_CONFIG[tool.auto_create_record] : null
        const hasNotifications = (tool.notifications?.length || 0) > 0

        return (
            <div
                key={tool.id}
                className={cn(
                    "group relative bg-card border rounded-xl hover:shadow-lg transition-all duration-200",
                    !tool.enabled && "opacity-60",
                    isIntegration
                        ? "hover:border-indigo-200 dark:hover:border-indigo-800 border-indigo-100 dark:border-indigo-900/50"
                        : "hover:border-violet-200 dark:hover:border-violet-800"
                )}
            >
                <div className="p-4">
                    <div className="flex items-start gap-4">
                        {/* Icon — only for custom tools; integration tools inherit the group header icon */}
                        {!isIntegration && (
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center border shrink-0",
                                tool.enabled
                                    ? typeInfo.bg + " " + "border-transparent"
                                    : "bg-muted border-transparent"
                            )}>
                                <TypeIcon className={cn("h-5 w-5", typeInfo.color)} />
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-semibold">{tool.name}</p>
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                    {typeInfo.label}
                                </Badge>
                                {autoRecord && (
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 gap-1", autoRecord.color)}>
                                        {(() => { const Icon = autoRecord.icon; return <Icon className="h-3 w-3" /> })()}
                                        {autoRecord.label}
                                    </Badge>
                                )}
                                {!tool.enabled && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5">
                                        Deshabilitado
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {tool.description || tool.endpoint}
                            </p>

                            {/* Stats & Parameters */}
                            <div className="flex items-center gap-4 mt-2">
                                {paramCount > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-violet-600">
                                        <Variable className="h-3 w-3" />
                                        {paramCount} parámetro{paramCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {hasNotifications && (
                                    <span className="flex items-center gap-1 text-xs text-amber-600">
                                        <Bell className="h-3 w-3" />
                                        {tool.notifications!.filter(n => n.enabled).length} notificación{tool.notifications!.filter(n => n.enabled).length !== 1 ? 'es' : ''}
                                    </span>
                                )}
                                {tool.usage_count > 0 && (
                                    <>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <BarChart3 className="h-3 w-3" />
                                            {tool.usage_count} usos
                                        </span>
                                        {successRate && (
                                            <span className={cn(
                                                "flex items-center gap-1 text-xs",
                                                parseInt(successRate) >= 90 ? "text-emerald-600" :
                                                    parseInt(successRate) >= 70 ? "text-amber-600" : "text-red-600"
                                            )}>
                                                <CheckCircle2 className="h-3 w-3" />
                                                {successRate}% éxito
                                            </span>
                                        )}
                                        {tool.avg_response_ms > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {tool.avg_response_ms}ms
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Notifications */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9", hasNotifications && "text-amber-600")}
                                onClick={() => setNotificationTool(tool)}
                                title="Notificaciones"
                            >
                                {hasNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleTest(tool)}
                                disabled={testing === tool.id || !tool.enabled}
                                title="Probar"
                            >
                                {testing === tool.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Play className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => openEditor(tool)}
                                title="Editar"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-9 w-9",
                                    tool.enabled ? "text-emerald-600" : "text-muted-foreground"
                                )}
                                onClick={() => handleToggle(tool)}
                                title={tool.enabled ? "Deshabilitar" : "Habilitar"}
                            >
                                {tool.enabled ? (
                                    <Power className="h-4 w-4" />
                                ) : (
                                    <PowerOff className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirm(tool)}
                                title="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Cargando herramientas...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold">Herramientas</h4>
                        <p className="text-xs text-muted-foreground">
                            Webhooks y APIs que el agente puede usar
                        </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                        {tools.length}
                    </Badge>
                </div>
                <Button onClick={() => openEditor()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Herramienta
                </Button>
            </div>

            {/* Tools List */}
            {tools.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="p-4 rounded-full bg-violet-100 dark:bg-violet-900/30 w-fit mx-auto mb-4">
                        <Zap className="h-10 w-10 text-violet-500" />
                    </div>
                    <p className="text-lg font-medium">Sin herramientas</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
                        Agrega webhooks o APIs que el agente pueda usar para consultar información externa o realizar acciones
                    </p>
                    <Button onClick={() => openEditor()} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Agregar primera herramienta
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Marketplace Integrations — grouped by slug */}
                    {marketplaceTools.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-indigo-500" />
                                <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Integraciones</h5>
                                <Badge variant="outline" className="text-[10px] px-1.5 bg-indigo-500/5 border-indigo-500/20 text-indigo-600">
                                    {marketplaceTools.length}
                                </Badge>
                            </div>
                            {Array.from(groupedByIntegration.entries()).map(([slug, groupTools]) => {
                                const integration = integrationMap.get(slug)
                                return (
                                    <div key={slug} className="space-y-2">
                                        {/* Integration group header */}
                                        <div className="flex items-center gap-2.5 px-1">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 shadow-sm">
                                                {renderIntegrationIcon(integration, 16)}
                                            </div>
                                            <span className="text-sm font-medium text-foreground/80">
                                                {integration?.name || slug}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                                                {groupTools.length}
                                            </Badge>
                                        </div>
                                        <div className="grid gap-2 pl-0">
                                            {groupTools.map((tool) => renderToolCard(tool, true))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Custom Tools */}
                    {customTools.length > 0 && (
                        <div className="space-y-3">
                            {marketplaceTools.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-violet-500" />
                                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Herramientas personalizadas</h5>
                                    <Badge variant="outline" className="text-[10px] px-1.5">
                                        {customTools.length}
                                    </Badge>
                                </div>
                            )}
                            <div className="grid gap-3">
                                {customTools.map((tool) => renderToolCard(tool, false))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tool Editor Pro Dialog */}
            <ToolEditorPro
                open={showEditor}
                onOpenChange={setShowEditor}
                tool={editingTool}
                agentId={agentId}
                onSaved={() => {
                    fetchTools()
                    onToolsUpdate?.()
                }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar herramienta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará permanentemente "{deleteConfirm?.name}" y todas sus estadísticas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Notification Rules Modal */}
            <Dialog open={!!notificationTool} onOpenChange={(open) => !open && setNotificationTool(null)}>
                <DialogContent
                    className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
                    aria-describedby={undefined}
                    onPointerDownOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target?.closest('[data-slot="select-content"]') || target?.closest('[data-radix-popper-content-wrapper]')) {
                            e.preventDefault()
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Bell className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                                <span>Notificaciones</span>
                                <p className="text-sm font-normal text-muted-foreground">
                                    {notificationTool?.name}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {(!notificationTool?.notifications || notificationTool.notifications.length === 0) ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                                <BellOff className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Sin notificaciones configuradas
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                                    Envía avisos automáticos cuando esta herramienta se ejecute.
                                </p>
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={addNotificationRule}>
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar notificación
                                </Button>
                            </div>
                        ) : (
                            <>
                                {notificationTool.notifications.map((rule, idx) => {
                                    const channelInfo = NOTIFICATION_CHANNELS.find(c => c.value === rule.channel)
                                    const ChannelIcon = channelInfo?.icon || Bell
                                    const needsPhone = rule.channel === 'whatsapp_number'
                                    const needsEmail = rule.channel === 'email'
                                    const needsDevice = rule.channel === 'whatsapp_number'

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "border rounded-lg transition-all",
                                                rule.enabled ? "bg-card" : "bg-muted/30 opacity-60"
                                            )}
                                        >
                                            {/* Header: switch + channel badge + delete */}
                                            <div className="flex items-center gap-2 p-3 pb-2">
                                                <Switch
                                                    checked={rule.enabled}
                                                    onCheckedChange={(checked) => updateNotificationRule(idx, 'enabled', checked)}
                                                />
                                                <Badge variant="secondary" className="gap-1 text-xs font-normal">
                                                    <ChannelIcon className="h-3 w-3" />
                                                    {channelInfo?.label || rule.channel}
                                                </Badge>
                                                <div className="flex-1" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeNotificationRule(idx)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Body */}
                                            <div className="px-3 pb-3 space-y-2.5">
                                                {/* Channel selector */}
                                                <Select
                                                    value={rule.channel}
                                                    onValueChange={(v) => updateNotificationRule(idx, 'channel', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>WhatsApp</SelectLabel>
                                                            {NOTIFICATION_CHANNELS.filter(c => c.group === 'whatsapp').map(c => (
                                                                <SelectItem key={c.value} value={c.value}>
                                                                    <span className="flex items-center gap-2">
                                                                        <c.icon className="h-3.5 w-3.5 text-green-600" />
                                                                        {c.label}
                                                                    </span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                        <SelectGroup>
                                                            <SelectLabel>Otros</SelectLabel>
                                                            {NOTIFICATION_CHANNELS.filter(c => c.group === 'other').map(c => (
                                                                <SelectItem key={c.value} value={c.value}>
                                                                    <span className="flex items-center gap-2">
                                                                        <c.icon className="h-3.5 w-3.5" />
                                                                        {c.label}
                                                                    </span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>

                                                {/* Phone target */}
                                                {needsPhone && (
                                                    <PhoneInput
                                                        value={rule.target ? `+${rule.target}` : ''}
                                                        onChange={(val) => {
                                                            const clean = val ? String(val).replace(/\+/g, '') : ''
                                                            updateNotificationRule(idx, 'target', clean)
                                                        }}
                                                        defaultCountry="MX"
                                                        placeholder="Número destino"
                                                    />
                                                )}

                                                {/* Email target */}
                                                {needsEmail && (
                                                    <Input
                                                        type="email"
                                                        value={rule.target}
                                                        onChange={(e) => updateNotificationRule(idx, 'target', e.target.value)}
                                                        placeholder="supervisor@empresa.com"
                                                        className="h-8 text-xs"
                                                    />
                                                )}

                                                {/* Device selector */}
                                                {needsDevice && devices.length > 0 && (
                                                    <Select
                                                        value={rule.device_id || ''}
                                                        onValueChange={(v) => updateNotificationRule(idx, 'device_id', v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Línea: automática" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="auto">
                                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                                    <MonitorSmartphone className="h-3.5 w-3.5" />
                                                                    Automático
                                                                </span>
                                                            </SelectItem>
                                                            {devices.map(d => (
                                                                <SelectItem key={d.id} value={d.id}>
                                                                    <span className="flex items-center gap-2">
                                                                        <Smartphone className="h-3.5 w-3.5 text-green-600" />
                                                                        {d.name || d.identifier}
                                                                    </span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                {/* Message */}
                                                <Textarea
                                                    value={rule.message}
                                                    onChange={(e) => updateNotificationRule(idx, 'message', e.target.value)}
                                                    placeholder="Mensaje de notificación..."
                                                    className="text-xs min-h-[56px] resize-none"
                                                />
                                                <p className="text-[10px] text-muted-foreground/50">
                                                    Variables: {'{{title}} {{status}} {{url}} {{contact_name}}'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                        {(notificationTool?.notifications?.length || 0) > 0 && (
                            <Button variant="outline" size="sm" className="gap-1" onClick={addNotificationRule}>
                                <Plus className="h-3 w-3" />
                                Agregar
                            </Button>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            <Button variant="outline" size="sm" onClick={() => setNotificationTool(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => notificationTool && saveToolNotifications(notificationTool.id, notificationTool.notifications || [])}
                                disabled={savingNotifications}
                            >
                                {savingNotifications ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Guardar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Test Result Modal */}
            <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {testResult?.success ? (
                                <div className="p-2 rounded-full bg-emerald-500/10">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                </div>
                            ) : (
                                <div className="p-2 rounded-full bg-red-500/10">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                </div>
                            )}
                            <div>
                                <span className="text-lg">
                                    {testResult?.success ? 'Ejecución Exitosa' : 'Error en Ejecución'}
                                </span>
                                <p className="text-sm font-normal text-muted-foreground">
                                    {testResult?.tool.name}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {/* Stats Bar */}
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                            {testResult?.duration_ms && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{testResult.duration_ms}ms</span>
                                </div>
                            )}
                            {testResult?.status_code && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant={testResult.status_code < 400 ? 'default' : 'destructive'}>
                                        HTTP {testResult.status_code}
                                    </Badge>
                                </div>
                            )}
                            {testResult?.tool && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                                    <span>{testResult.tool.method}</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">{testResult.tool.endpoint}</span>
                                </div>
                            )}
                        </div>

                        {/* Parameters Used */}
                        {testResult?.params_used && Object.keys(testResult.params_used).length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Variable className="h-4 w-4" />
                                    Parámetros Enviados
                                </h4>
                                <div className="p-3 rounded-lg bg-muted/30 border">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(testResult.params_used).map(([key, value]) => (
                                            <Badge key={key} variant="outline" className="gap-1.5 py-1">
                                                <span className="text-muted-foreground">{key}:</span>
                                                <span className="font-mono">{value}</span>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Response/Error */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                    {testResult?.success ? 'Respuesta' : 'Error'}
                                </h4>
                                {(testResult?.data || testResult?.error) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 gap-1.5"
                                        onClick={() => copyToClipboard(
                                            JSON.stringify(testResult?.data || testResult?.error, null, 2)
                                        )}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                Copiar
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                            <div className="rounded-lg border bg-zinc-950 overflow-hidden">
                                <pre className="text-sm font-mono whitespace-pre-wrap p-4">
                                    {testResult?.success ? (
                                        <code className="text-emerald-400">
                                            {JSON.stringify(testResult.data, null, 2) || 'Sin datos en la respuesta'}
                                        </code>
                                    ) : (
                                        <code className="text-red-400">
                                            {testResult?.error || 'Error desconocido'}
                                        </code>
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={() => setTestResult(null)}>
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
