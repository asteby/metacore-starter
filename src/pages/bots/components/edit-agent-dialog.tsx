import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
    Loader2, Bot, Brain, Trash2, FileText, Image, Video, File,
    Eye, ExternalLink, Sparkles, ZoomIn, Plus, Zap, Pencil, Tag,
    ArrowRight, X, Database, CheckCircle2, ShoppingBag, Headphones, CalendarDays
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
// Checkbox removed
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { KnowledgeUploader } from './knowledge-uploader'
import { ToolsManager } from './tools-manager'

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    description: z.string().optional(),
    system_prompt: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    slug: z.string().regex(/^[a-z0-9_-]*$/, { message: "Solo letras minúsculas, números, guiones y guiones bajos." }).optional().or(z.literal('')),
    mode: z.enum(["standard", "copilot", "dual"]).optional(),
})

interface KnowledgeItem {
    id: string
    type: string
    content?: string
    title?: string
    file_url?: string
    file_name?: string
    created_at: string
}

interface EditAgentDialogProps {
    agent: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const AGENT_TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
    seller: { icon: ShoppingBag, label: 'Vendedor', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
    support: { icon: Headphones, label: 'Soporte', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    scheduler: { icon: CalendarDays, label: 'Agendador', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30' },
    copilot: { icon: Bot, label: 'Copiloto', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' },
    dual: { icon: Bot, label: 'Dual', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30' },
}

export function EditAgentDialog({ agent, open, onOpenChange, onSuccess }: EditAgentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
    const [loadingKnowledge, setLoadingKnowledge] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("general")
    const isVendedor = agent?.agent_type === 'seller'
    const [previewItem, setPreviewItem] = useState<KnowledgeItem | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<KnowledgeItem | null>(null)
    const [showUploader, setShowUploader] = useState(false)
    const [toolsCount, setToolsCount] = useState(0)
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
    const queryClient = useQueryClient()

    // Data Capture State
    const { data: fullAgent, isLoading: isLoadingAgent } = useQuery({
        queryKey: ['agent', agent?.id],
        queryFn: async () => {
            if (!agent?.id) return null
            const res = await api.get(`/data/agents/me/${agent.id}`)
            return res.data.data
        },
        enabled: open && !!agent?.id
    })

    const { data: existingFields } = useQuery<any[]>({
        queryKey: ['contact-custom-fields', agent?.id],
        queryFn: async () => {
            // Get fields that are global (agent_id null) or belong to this agent
            // We use a query parameter that the backend dynamic handler can hopefully parse or we filter here
            const res = await api.get('/data/contact_custom_fields/me')
            let fields = []
            if (Array.isArray(res.data.data)) fields = res.data.data
            else if (res.data.data && Array.isArray(res.data.data.data)) fields = res.data.data.data

            // Filter: show global fields + fields specifically for this agent
            return fields.filter((f: any) => !f.agent_id || f.agent_id === agent?.id)
        }
    })

    const [newFieldName, setNewFieldName] = useState("")
    const [newFieldDesc, setNewFieldDesc] = useState("")
    const [assignedFieldIds, setAssignedFieldIds] = useState<string[]>([])

    useEffect(() => {
        if (open && fullAgent) {
            // Robust parsing of config
            let config = fullAgent.config
            if (typeof config === 'string' && config.startsWith('{')) {
                try {
                    config = JSON.parse(config)
                } catch (e) {
                    config = {}
                }
            }

            if (config?.data_capture_fields) {
                setAssignedFieldIds(config.data_capture_fields)
            } else {
                setAssignedFieldIds([])
            }
        } else if (open && !fullAgent) {
            // Fallback to prop while loading or if load fails
            if (agent?.config?.data_capture_fields) {
                setAssignedFieldIds(agent.config.data_capture_fields)
            }
        }
    }, [open, fullAgent, agent?.id])

    const toggleFieldAssignment = (fieldId: string) => {
        setAssignedFieldIds(prev =>
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        )
    }

    const handleAddField = async () => {
        if (!newFieldName.trim()) return
        try {
            const key = newFieldName
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '')

            const res = await api.post('/data/contact_custom_fields/me', {
                label: newFieldName,
                key: key || `field_${Date.now()}`,
                description: newFieldDesc,
                field_type: 'text',
                is_required: false,
                agent_id: agent.id
            })
            if (res.data.success) {
                toast.success("Campo creado")
                setNewFieldName("")
                setNewFieldDesc("")
                queryClient.invalidateQueries({ queryKey: ['contact-custom-fields'] })
                if (res.data.data?.id) {
                    setAssignedFieldIds(prev => [...prev, res.data.data.id])
                }
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Error al crear campo")
        }
    }

    const handleDeleteField = async (e: React.MouseEvent, fieldId: string) => {
        e.stopPropagation()
        if (!confirm("¿Eliminar este campo?")) return
        try {
            await api.delete(`/data/contact_custom_fields/me/${fieldId}`)
            toast.success("Campo eliminado")
            queryClient.invalidateQueries({ queryKey: ['contact-custom-fields'] })
            setAssignedFieldIds(prev => prev.filter(id => id !== fieldId))
        } catch (e) {
            toast.error("Error al eliminar")
        }
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            system_prompt: "",
            temperature: 0.7,
        },
    })

    useEffect(() => {
        if (agent) {
            form.reset({
                name: agent.name || "",
                description: agent.description || "",
                system_prompt: agent.system_prompt || "",
                temperature: agent.temperature || 0.7,
                slug: agent?.slug || '',
                mode: agent?.mode || 'standard',
            })
        }
    }, [agent, form])

    const fetchKnowledge = useCallback(async () => {
        if (!agent?.id) return
        setLoadingKnowledge(true)
        try {
            const response = await api.get(`/knowledge/${agent.id}`)
            if (response.data.success) {
                setKnowledgeItems(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching knowledge:', error)
        } finally {
            setLoadingKnowledge(false)
        }
    }, [agent?.id])

    const fetchTools = useCallback(async () => {
        if (!agent?.id) return
        try {
            const response = await api.get(`/agents/${agent.id}/tools`)
            if (response.data.success) {
                setToolsCount(response.data.data?.length || 0)
            }
        } catch (error) {
            console.error('Error fetching tools:', error)
        }
    }, [agent?.id])

    useEffect(() => {
        if (open && agent?.id) {
            fetchKnowledge()
            fetchTools()
        }
    }, [open, agent?.id, fetchKnowledge, fetchTools])


    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!agent) return
        setIsSubmitting(true)
        try {
            // Use fullAgent or agent as base for config
            const baseConfig = fullAgent?.config || agent?.config || {}
            let parsedConfig = typeof baseConfig === 'string' ? {} : { ...baseConfig }

            if (typeof baseConfig === 'string' && baseConfig.startsWith('{')) {
                try {
                    parsedConfig = JSON.parse(baseConfig)
                } catch (e) { }
            }

            const payload = {
                ...values,
                config: {
                    ...parsedConfig,
                    data_capture_fields: assignedFieldIds
                }
            }
            const response = await api.patch(`/data/agents/me/${agent.id}`, payload)
            if (response.data.success) {
                toast.success("Agente actualizado correctamente")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(response.data.message || "Error al actualizar")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al actualizar el agente")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDeleteKnowledge(item: KnowledgeItem) {
        setDeletingId(item.id)
        try {
            const response = await api.delete(`/knowledge/${item.id}`)
            if (response.data.success) {
                toast.success("Conocimiento eliminado")
                setKnowledgeItems(prev => prev.filter(k => k.id !== item.id))
            } else {
                toast.error(response.data.message || "Error al eliminar")
            }
        } catch (error) {
            toast.error("Error al eliminar conocimiento")
        } finally {
            setDeletingId(null)
            setDeleteConfirm(null)
        }
    }



    const handleUploadSuccess = () => {
        fetchKnowledge()
        setShowUploader(false)
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'image': return <Image className="h-4 w-4" />
            case 'video': return <Video className="h-4 w-4" />
            case 'pdf': return <File className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const getTypeBadgeStyle = (type: string) => {
        const styles: Record<string, string> = {
            text: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            image: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            video: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            pdf: 'bg-red-500/10 text-red-500 border-red-500/20',
        }
        return styles[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }

    const getFileUrl = (url: string) => {
        if (url.startsWith('http')) return url
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${url}`
    }

    const renderPreview = (item: KnowledgeItem) => {
        if (item.type === 'image' && item.file_url) {
            return (
                <img
                    src={getFileUrl(item.file_url)}
                    alt={item.title || 'Preview'}
                    className="w-12 h-12 object-cover rounded-lg border"
                />
            )
        }
        return (
            <div className={cn(
                "w-12 h-12 rounded-lg border flex items-center justify-center",
                getTypeBadgeStyle(item.type)
            )}>
                {getTypeIcon(item.type)}
            </div>
        )
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="sm:max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-indigo-500/5 to-purple-500/5 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DialogTitle className="text-xl font-semibold">
                                        Editar Agente
                                    </DialogTitle>
                                    {agent?.agent_type && AGENT_TYPE_CONFIG[agent.agent_type] && (() => {
                                        const cfg = AGENT_TYPE_CONFIG[agent.agent_type]
                                        const TypeIcon = cfg.icon
                                        return (
                                            <Badge variant="outline" className={cn("gap-1 text-xs font-medium", cfg.color)}>
                                                <TypeIcon className="h-3 w-3" />
                                                {cfg.label}
                                            </Badge>
                                        )
                                    })()}
                                </div>
                                <DialogDescription className="text-sm">
                                    Configura la identidad y conocimiento de <span className="font-medium text-foreground">{agent?.name}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="px-6 pt-2 shrink-0">
                            <TabsList className={cn("grid w-full h-11", isVendedor ? "grid-cols-4" : "grid-cols-3")}>
                                <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-background">
                                    <Bot className="h-4 w-4" />
                                    Configuración
                                </TabsTrigger>
                                <TabsTrigger value="knowledge" className="gap-2 data-[state=active]:bg-background">
                                    <Brain className="h-4 w-4" />
                                    Conocimiento
                                    {knowledgeItems.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                            {knowledgeItems.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-background">
                                    <Zap className="h-4 w-4" />
                                    Herramientas
                                    {toolsCount > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                            {toolsCount}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                {isVendedor && (
                                    <TabsTrigger value="captura" className="gap-2 data-[state=active]:bg-background">
                                        <Sparkles className="h-4 w-4" />
                                        Captura
                                        {(existingFields?.filter(f => assignedFieldIds.map(String).includes(String(f.id))).length || 0) > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                                {existingFields?.filter(f => assignedFieldIds.map(String).includes(String(f.id))).length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        {/* General Tab */}
                        <TabsContent value="general" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden px-1 data-[state=active]:flex">
                            <ScrollArea className="h-full w-full mb-1">
                                <div className="px-5 py-4">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nombre del Agente</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Ej. Asistente de Ventas"
                                                                className="h-11"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Descripción / Rol</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Describe brevemente qué hace este agente..."
                                                                className="resize-none min-h-[80px]"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="system_prompt"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                                            Instrucciones del Sistema
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Define cómo debe comportarse el agente, su personalidad, reglas especiales..."
                                                                className="resize-none min-h-[120px] font-mono text-sm"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <p className="text-xs text-muted-foreground">
                                                            Estas instrucciones guían el comportamiento del agente en todas las conversaciones
                                                        </p>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Slug del agente</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="aurora" {...field} />
                                                        </FormControl>
                                                        <p className="text-xs text-muted-foreground">Será mencionado como @{field.value || 'slug'} en WhatsApp (modo copiloto/dual)</p>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="mode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Modo de operación</FormLabel>
                                                        <FormControl>
                                                            <select
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                                                {...field}
                                                            >
                                                                <option value="standard">Estándar (responde a clientes)</option>
                                                                <option value="copilot">Copiloto (responde al dueño por @mención)</option>
                                                                <option value="dual">Dual (responde por @mención de cliente o dueño)</option>
                                                            </select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                        </form>
                                    </Form>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Knowledge Tab */}
                        <TabsContent value="knowledge" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden px-1 data-[state=active]:flex">
                            <ScrollArea className="h-full w-full mb-1">
                                <div className="px-5 py-4 space-y-4">
                                    {/* Header with Add Button */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-purple-500" />
                                            <h4 className="font-semibold">Base de Conocimiento</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {knowledgeItems.length}
                                            </Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowUploader(true)}
                                            className="gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Entrenar
                                        </Button>
                                    </div>

                                    {/* Knowledge List */}
                                    {loadingKnowledge ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <p className="text-sm">Cargando...</p>
                                        </div>
                                    ) : knowledgeItems.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed rounded-xl">
                                            <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="text-sm font-medium text-muted-foreground">Sin conocimiento</p>
                                            <p className="text-xs text-muted-foreground mt-1 mb-4">
                                                Entrena al agente con información para que pueda responder
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowUploader(true)}
                                                className="gap-2"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                Agregar conocimiento
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {knowledgeItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="group flex items-center gap-3 p-3 bg-card border rounded-xl hover:shadow-sm hover:border-primary/20 transition-all"
                                                >
                                                    {/* Preview */}
                                                    <div
                                                        className="cursor-pointer flex-shrink-0"
                                                        onClick={() => (item.file_url || item.content) && setPreviewItem(item)}
                                                    >
                                                        {renderPreview(item)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {item.title || item.file_name || 'Sin título'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.content?.slice(0, 80) || item.file_name || item.type}
                                                            {item.content && item.content.length > 80 && '...'}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                            onClick={() => setEditingItem(item)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        {(item.file_url || item.content) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => setPreviewItem(item)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {item.file_url && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                asChild
                                                            >
                                                                <a
                                                                    href={getFileUrl(item.file_url)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteConfirm(item)}
                                                            disabled={deletingId === item.id}
                                                        >
                                                            {deletingId === item.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Tools Tab */}
                        <TabsContent value="tools" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden px-1 data-[state=active]:flex">
                            <ScrollArea className="h-full w-full mb-1">
                                <div className="px-5 py-4">
                                    {agent?.id && (
                                        <ToolsManager
                                            agentId={agent.id}
                                            onToolsUpdate={fetchTools}
                                        />
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Captura Tab */}
                        <TabsContent value="captura" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden px-1 data-[state=active]:flex">
                            <ScrollArea className="h-full w-full mb-1">
                                <div className="px-7 pt-1 pb-6 space-y-4">
                                    {isLoadingAgent ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                                            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Logic for New Fields */}
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <h4 className="text-base font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                                                        <Plus className="w-4 h-4 text-indigo-500" />
                                                        Nuevo Campo para {agent?.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground ml-6">Define un dato que solo este agente se encargará de buscar.</p>
                                                </div>
                                                <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                                    <Input
                                                        placeholder="Nombre del nuevo dato (ej: RFC)..."
                                                        value={newFieldName}
                                                        onChange={e => setNewFieldName(e.target.value)}
                                                        className="h-10 text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Instrucciones para la IA..."
                                                            value={newFieldDesc}
                                                            onChange={e => setNewFieldDesc(e.target.value)}
                                                            className="flex-1 h-10 text-xs"
                                                        />
                                                        <Button type="button" onClick={handleAddField} disabled={!newFieldName.trim()} className="h-10">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>



                                            {/* Derived active fields to ensure UI consistency */}
                                            {(() => {
                                                const activeFields = existingFields?.filter(f =>
                                                    assignedFieldIds.map(String).includes(String(f.id))
                                                ) || [];

                                                return (
                                                    <div className="bg-gradient-to-br from-indigo-500/[0.07] to-purple-500/[0.07] border border-indigo-500/20 rounded-2xl p-4 shadow-sm">
                                                        <h4 className="text-sm font-bold mb-4 flex items-center justify-between">
                                                            <span className="flex items-center gap-2 text-indigo-950 dark:text-indigo-50">
                                                                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                                                                Configuración de Captura de {agent?.name}
                                                            </span>
                                                            <Badge className="bg-indigo-500 text-white border-none shadow-sm">
                                                                {activeFields.length} {activeFields.length === 1 ? 'campo' : 'campos'}
                                                            </Badge>
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {activeFields.map((field) => (
                                                                <div
                                                                    key={field.id}
                                                                    className="flex items-center justify-between p-3 rounded-lg border bg-background shadow-sm"
                                                                >
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                                                            <Tag className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-medium truncate">{field.label}</p>
                                                                            <p className="text-[10px] text-muted-foreground truncate">{field.description || 'Sin descripción'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                                                                            title="Desasignar de este agente"
                                                                            onClick={() => toggleFieldAssignment(field.id!)}
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                                                                            title="Eliminar campo permanentemente"
                                                                            onClick={(e) => handleDeleteField(e, field.id!)}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {activeFields.length === 0 && (
                                                                <div className="text-center py-8 px-6 bg-white/40 dark:bg-black/20 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 shadow-inner">
                                                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900">
                                                                        <Database className="w-6 h-6 text-indigo-300 dark:text-indigo-700" />
                                                                    </div>
                                                                    <p className="text-sm font-bold text-indigo-950 dark:text-indigo-50 mb-1">Sin campos de captura</p>
                                                                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                                                        Usa el formulario de arriba para definir qué datos debe recolectar {agent?.name}.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>

                    {/* Fixed Footer */}
                    <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                        {(activeTab === 'general' || activeTab === 'captura') && (
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                                ) : (
                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Guardar Cambios</>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Upload/Train Modal */}
            < Dialog open={showUploader} onOpenChange={setShowUploader} >
                <DialogContent className="sm:max-w-[500px] h-[70vh] p-0 flex flex-col">
                    {/* Header Fijo */}
                    <div className="px-6 py-4 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Entrenar Agente
                        </DialogTitle>
                        <DialogDescription>
                            Agrega información para que {agent?.name} pueda responder preguntas
                        </DialogDescription>
                    </div>

                    {/* Body con Scroll */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {agent?.id && (
                            <KnowledgeUploader
                                agentId={agent.id}
                                onSuccess={handleUploadSuccess}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog >

            {/* Preview Dialog */}
            < Dialog open={!!previewItem
            } onOpenChange={() => setPreviewItem(null)}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] p-0 flex flex-col">
                    {/* Header Fijo */}
                    <div className="px-6 py-4 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <ZoomIn className="h-5 w-5 shrink-0" />
                            <span className="truncate">{previewItem?.title || previewItem?.file_name || 'Vista previa'}</span>
                        </DialogTitle>
                    </div>

                    {/* Body con Scroll */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {previewItem?.type === 'image' && previewItem.file_url && (
                            <img
                                src={getFileUrl(previewItem.file_url)}
                                alt={previewItem.title || 'Preview'}
                                className="w-full object-contain rounded-lg bg-muted/50"
                            />
                        )}
                        {previewItem?.type === 'video' && previewItem.file_url && (
                            <video
                                src={getFileUrl(previewItem.file_url)}
                                controls
                                className="w-full rounded-lg"
                            />
                        )}
                        {previewItem?.type === 'pdf' && previewItem.file_url && (
                            <iframe
                                src={getFileUrl(previewItem.file_url)}
                                className="w-full h-full min-h-[50vh] rounded-lg border"
                            />
                        )}
                        {previewItem?.content && (
                            <div className={cn("p-4 bg-muted/50 rounded-lg border", previewItem.file_url && "mt-4")}>
                                <p className="text-sm font-medium mb-2">Contenido de entrenamiento:</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{previewItem.content}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Fijo */}
                    <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
                        {previewItem?.file_url && (
                            <Button variant="outline" asChild>
                                <a href={getFileUrl(previewItem.file_url)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir
                                </a>
                            </Button>
                        )}
                        <Button onClick={() => setPreviewItem(null)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Delete Confirmation */}
            {/* Edit Knowledge Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[500px] h-[500px] flex flex-col">
                    <DialogHeader className="px-0 pt-0 pb-4">
                        <DialogTitle>Editar Conocimiento</DialogTitle>
                        <DialogDescription>
                            Modifica el contenido o reemplaza el archivo adjunto.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0">
                        {editingItem && agent && (
                            <KnowledgeUploader
                                agentId={agent.id}
                                editingItem={editingItem}
                                onSuccess={() => {
                                    handleUploadSuccess()
                                    setEditingItem(null)
                                }}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar conocimiento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará permanentemente este conocimiento, incluyendo el archivo y el entrenamiento asociado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteConfirm && handleDeleteKnowledge(deleteConfirm)}
                        >
                            {deletingId ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
                            ) : (
                                <><Trash2 className="mr-2 h-4 w-4" /> Eliminar</>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
