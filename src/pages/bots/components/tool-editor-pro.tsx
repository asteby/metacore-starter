import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Loader2,
    Plus,
    Trash2,
    Play,
    CheckCircle2,
    XCircle,
    Settings2,
    Zap,
    Variable,
    GripVertical,
    Copy,
    Sparkles,
    Globe,
    Shield,
    Clock,
    ChevronRight,
    Code2,
    TestTube2,
    Braces,
    Info,
    ChevronDown,
    Type,
    Hash,
    Calendar,
    ToggleLeft,
    Mail,
    Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CodeEditor } from '@/components/ui/code-editor'

// ============================================
// TYPES
// ============================================
export interface ToolInputParam {
    id: string
    name: string
    type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'select'
    description: string
    required: boolean
    example: string
    extraction_hint: string
    default_value: string
    options?: string[]
    normalize?: string       // uppercase, lowercase, order_id, alphanumeric, alphanumeric_upper, trim
    format_pattern?: string  // Pattern like "XXX-0000-XXXX"
}

const NORMALIZE_OPTIONS = [
    { value: 'none', label: 'Sin normalización' },
    { value: 'uppercase', label: 'MAYÚSCULAS' },
    { value: 'lowercase', label: 'minúsculas' },
    { value: 'order_id', label: 'ID de Pedido (FDX-1234-ABCD)' },
    { value: 'alphanumeric', label: 'Solo alfanumérico' },
    { value: 'alphanumeric_upper', label: 'Alfanumérico MAYÚSCULA' },
    { value: 'trim', label: 'Quitar espacios' },
]

interface ToolEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tool?: any
    agentId: string
    onSaved: () => void | Promise<void>
}

const PARAM_TYPES = [
    { value: 'string', label: 'Texto', icon: Type, color: 'bg-blue-500' },
    { value: 'number', label: 'Número', icon: Hash, color: 'bg-emerald-500' },
    { value: 'date', label: 'Fecha', icon: Calendar, color: 'bg-amber-500' },
    { value: 'boolean', label: 'Sí/No', icon: ToggleLeft, color: 'bg-purple-500' },
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-pink-500' },
    { value: 'phone', label: 'Teléfono', icon: Phone, color: 'bg-cyan-500' },
]

const TOOL_TYPES = [
    { value: 'api', label: 'API REST', icon: Globe, color: 'text-emerald-500' },
]

const HTTP_METHODS = [
    { value: 'GET', color: 'bg-emerald-500' },
    { value: 'POST', color: 'bg-blue-500' },
    { value: 'PUT', color: 'bg-amber-500' },
    { value: 'DELETE', color: 'bg-red-500' },
    { value: 'PATCH', color: 'bg-purple-500' },
]

// ============================================
// DRAGGABLE VARIABLE CHIP
// ============================================
function DraggableVariable({
    param,
    onDragStart
}: {
    param: ToolInputParam
    onDragStart: (e: React.DragEvent, param: ToolInputParam) => void
}) {
    const typeInfo = PARAM_TYPES.find(t => t.value === param.type) || PARAM_TYPES[0]

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        draggable
                        onDragStart={(e) => onDragStart(e, param)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing",
                            "bg-gradient-to-r from-violet-500/10 to-purple-500/10",
                            "border border-violet-200 dark:border-violet-800",
                            "hover:border-violet-400 dark:hover:border-violet-600",
                            "hover:shadow-md hover:shadow-violet-500/10",
                            "transition-all duration-200 group"
                        )}
                    >
                        <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-violet-500" />
                        <typeInfo.icon className="h-5 w-5 text-muted-foreground/70" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <code className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                                    {`{{${param.name}}}`}
                                </code>
                                {param.required && (
                                    <span className="text-[10px] text-red-500">*</span>
                                )}
                            </div>
                            {param.description && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {param.description}
                                </p>
                            )}
                        </div>
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium">{param.name}</p>
                    <p className="text-xs text-muted-foreground">{param.description || 'Sin descripción'}</p>
                    {param.example && (
                        <p className="text-xs mt-1">Ejemplo: <code>{param.example}</code></p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// ============================================
// DROPPABLE INPUT
// ============================================
function DroppableInput({
    value,
    onChange,
    placeholder,
    onDrop,
    className,
    multiline = false,
}: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onDrop: (variable: string, cursorPos?: number) => void
    className?: string
    multiline?: boolean
}) {
    const [isDragOver, setIsDragOver] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const variable = e.dataTransfer.getData('variable')
        if (variable) {
            const cursorPos = inputRef.current?.selectionStart || value.length
            onDrop(variable, cursorPos)
        }
    }

    const commonProps = {
        ref: inputRef as any,
        value,
        onChange: (e: any) => onChange(e.target.value),
        placeholder,
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) },
        onDragLeave: () => setIsDragOver(false),
        onDrop: handleDrop,
        className: cn(
            "font-mono text-sm transition-all duration-200",
            isDragOver && "ring-2 ring-violet-500 ring-offset-2 bg-violet-50 dark:bg-violet-950",
            className
        ),
    }

    if (multiline) {
        return <Textarea {...commonProps} />
    }
    return <Input {...commonProps} />
}

// ============================================
// MAIN TOOL EDITOR COMPONENT
// ============================================
export function ToolEditorPro({ open, onOpenChange, tool, agentId, onSaved }: ToolEditorProps) {
    const [activeTab, setActiveTab] = useState('general')
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<any>(null)
    const [testValues, setTestValues] = useState<Record<string, string>>({})
    const [showTestRequest, setShowTestRequest] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'api' as 'webhook' | 'api' | 'mcp' | 'query',
        category: 'integration',
        endpoint: '',
        method: 'GET',
        auth_type: 'none',
        auth_config: {} as Record<string, any>,
        headers: {} as Record<string, any>,
        body_template: '',
        input_schema: [] as ToolInputParam[],
        timeout: 30,
        enabled: true,
    })

    // Load tool data
    useEffect(() => {
        if (tool) {
            setFormData({
                name: tool.name || '',
                description: tool.description || '',
                type: tool.type || 'api',
                category: tool.category || 'integration',
                endpoint: tool.endpoint || '',
                method: tool.method || 'GET',
                auth_type: tool.auth_type || 'none',
                auth_config: tool.auth_config || {},
                headers: tool.headers || {},
                body_template: tool.body_template || '',
                input_schema: (tool.input_schema || []).map((p: any) => ({
                    ...p,
                    id: p.id || crypto.randomUUID()
                })),
                timeout: tool.timeout || 30,
                enabled: tool.enabled !== false,
            })
            // Initialize test values with examples
            const examples: Record<string, string> = {}
                ; (tool.input_schema || []).forEach((p: any) => {
                    examples[p.name] = p.example || p.default_value || ''
                })
            setTestValues(examples)
        } else {
            setFormData({
                name: '',
                description: '',
                type: 'api',
                category: 'integration',
                endpoint: '',
                method: 'GET',
                auth_type: 'none',
                auth_config: {},
                headers: {},
                body_template: '',
                input_schema: [],
                timeout: 30,
                enabled: true,
            })
            setTestValues({})
        }
        setActiveTab('general')
        setTestResult(null)
    }, [tool, open])

    // Handle variable drag
    const handleDragStart = (e: React.DragEvent, param: ToolInputParam) => {
        e.dataTransfer.setData('variable', `{{${param.name}}}`)
        e.dataTransfer.effectAllowed = 'copy'
    }

    // Handle variable drop into input
    const handleVariableDrop = (field: 'endpoint' | 'body_template') => (variable: string, cursorPos?: number) => {
        setFormData(prev => {
            const currentValue = prev[field]
            const before = currentValue.slice(0, cursorPos || currentValue.length)
            const after = currentValue.slice(cursorPos || currentValue.length)
            return { ...prev, [field]: before + variable + after }
        })
    }

    // Add parameter
    const addParameter = () => {
        const newParam: ToolInputParam = {
            id: crypto.randomUUID(),
            name: `param_${formData.input_schema.length + 1}`,
            type: 'string',
            description: '',
            required: false,
            example: '',
            extraction_hint: '',
            default_value: '',
            normalize: 'none',
            format_pattern: '',
        }
        setFormData(prev => ({ ...prev, input_schema: [...prev.input_schema, newParam] }))
    }

    // Update parameter
    const updateParameter = (id: string, updates: Partial<ToolInputParam>) => {
        setFormData(prev => ({
            ...prev,
            input_schema: prev.input_schema.map(p => p.id === id ? { ...p, ...updates } : p)
        }))
    }

    // Remove parameter
    const removeParameter = (id: string) => {
        setFormData(prev => ({
            ...prev,
            input_schema: prev.input_schema.filter(p => p.id !== id)
        }))
    }

    // Build URL preview
    const buildPreviewUrl = useCallback(() => {
        let url = formData.endpoint
        formData.input_schema.forEach(p => {
            const value = testValues[p.name] || p.example || `[${p.name}]`
            url = url.replace(new RegExp(`\\{\\{${p.name}\\}\\}`, 'g'), value)
        })
        return url
    }, [formData.endpoint, formData.input_schema, testValues])

    // Build body preview
    const buildPreviewBody = useCallback(() => {
        if (!formData.body_template) return null
        let body = formData.body_template
        formData.input_schema.forEach(p => {
            const value = testValues[p.name] || p.example || `[${p.name}]`
            body = body.replace(new RegExp(`\\{\\{${p.name}\\}\\}`, 'g'), value)
        })
        try {
            return JSON.parse(body)
        } catch {
            return body
        }
    }, [formData.body_template, formData.input_schema, testValues])

    // Save
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre es requerido')
            return
        }
        if (!formData.endpoint.trim() && formData.type !== 'query') {
            toast.error('El endpoint es requerido')
            return
        }

        // Validar patrones de formato
        const invalidPattern = formData.input_schema.find(p => 
            p.format_pattern && !/^[X0\-_./\s]*$/.test(p.format_pattern)
        )
        if (invalidPattern) {
            toast.error(`Patrón inválido en "${invalidPattern.name}". Solo usa X, 0 y separadores (- _ . /)`)
            return
        }

        setSaving(true)
        try {
            const payload = {
                ...formData,
                input_schema: formData.input_schema.map(({ id, ...rest }) => rest),
            }

            if (tool?.id) {
                await api.put(`/tools/${tool.id}`, payload)
                toast.success('Herramienta actualizada')
            } else {
                await api.post(`/agents/${agentId}/tools`, payload)
                toast.success('Herramienta creada')
            }
            onOpenChange(false)
            await onSaved()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    // Test
    const handleTest = async () => {
        setTesting(true)
        setTestResult(null)
        const startTime = Date.now()

        try {
            let response
            console.log('Testing tool with values:', testValues)
            console.log('Form data:', formData)

            if (tool?.id) {
                response = await api.post(`/tools/${tool.id}/test`, {
                    parameters: testValues,
                })
            } else {
                const payload = {
                    tool: {
                        ...formData,
                        input_schema: formData.input_schema.map(({ id, ...rest }) => rest)
                    },
                    test_parameters: testValues,
                }
                console.log('Sending TestPrototype payload:', payload)
                response = await api.post(`/tools/test-prototype`, payload)
            }

            setTestResult({
                success: response.data.success,
                data: response.data.data,
                error: response.data.error,
                duration_ms: response.data.duration_ms || (Date.now() - startTime),
            })
        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.response?.data?.error || error.message,
                duration_ms: Date.now() - startTime,
            })
        } finally {
            setTesting(false)
        }
    }

    // Copy variable
    const copyVariable = (name: string) => {
        navigator.clipboard.writeText(`{{${name}}}`)
        toast.success('Variable copiada')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-lg font-semibold">
                                    {tool ? 'Editar Herramienta' : 'Nueva Herramienta'}
                                </span>
                                {formData.name && (
                                    <p className="text-sm font-normal text-muted-foreground">
                                        {formData.name}
                                    </p>
                                )}
                            </div>
                        </DialogTitle>
                        <div className="flex items-center gap-2 mr-8">
                            <Switch
                                checked={formData.enabled}
                                onCheckedChange={(v) => setFormData(prev => ({ ...prev, enabled: v }))}
                            />
                            <span className="text-sm text-muted-foreground">
                                {formData.enabled ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                            <TabsList className="mx-6 mt-4 justify-start bg-muted/50 p-1">
                                <TabsTrigger value="general" className="gap-2">
                                    <Settings2 className="h-4 w-4" />
                                    General
                                </TabsTrigger>
                                <TabsTrigger value="parameters" className="gap-2">
                                    <Variable className="h-4 w-4" />
                                    Parámetros
                                    {formData.input_schema.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                            {formData.input_schema.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="request" className="gap-2">
                                    <Code2 className="h-4 w-4" />
                                    Request
                                </TabsTrigger>
                                <TabsTrigger value="auth" className="gap-2">
                                    <Shield className="h-4 w-4" />
                                    Auth
                                </TabsTrigger>
                                <TabsTrigger value="test" className="gap-2">
                                    <TestTube2 className="h-4 w-4" />
                                    Probar
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto">
                                {/* GENERAL TAB */}
                                <TabsContent value="general" className="p-6 space-y-6 m-0">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <Label className="mb-2">Nombre de la herramienta *</Label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Ej: Consultar Factura Electrónica"
                                                className="text-lg"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <Label className="mb-2">
                                                Descripción para la IA
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground inline" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            Describe detalladamente cuándo y cómo la IA debe usar esta herramienta.
                                                            Sé específico sobre los casos de uso.
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Ej: Usa esta herramienta cuando el usuario pregunte por facturas electrónicas, estado de timbrado, o información fiscal. Requiere el RFC del cliente."
                                                className="min-h-[100px] resize-none"
                                            />
                                        </div>

                                        <div>
                                            <Label className="mb-2">Tipo</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as any }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TOOL_TYPES.map(type => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            <div className="flex items-center gap-2">
                                                                <type.icon className={cn("h-4 w-4", type.color)} />
                                                                {type.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="mb-2">Timeout (segundos)</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={120}
                                                value={formData.timeout}
                                                onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* PARAMETERS TAB */}
                                <TabsContent value="parameters" className="p-6 space-y-6 m-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-violet-500" />
                                                Parámetros de Entrada
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Define los datos que la IA debe extraer de la conversación
                                            </p>
                                        </div>
                                        <Button onClick={addParameter} size="sm" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Agregar
                                        </Button>
                                    </div>

                                    {formData.input_schema.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                                            <Variable className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="font-medium text-muted-foreground">Sin parámetros</p>
                                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                                Agrega parámetros que la IA extraerá de la conversación
                                            </p>
                                            <Button variant="outline" size="sm" onClick={addParameter} className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                Agregar primer parámetro
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {formData.input_schema.map((param, index) => (
                                                <div
                                                    key={param.id}
                                                    className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-start gap-6">
                                                        <div className="flex flex-col items-center gap-2 text-muted-foreground pt-2">
                                                            <GripVertical className="h-5 w-5 cursor-grab" />
                                                            <span className="text-lg font-mono font-bold text-violet-500">{index + 1}</span>
                                                        </div>

                                                        <div className="flex-1 grid grid-cols-4 gap-x-6 gap-y-4">
                                                            <div>
                                                                <Label className="text-xs mb-2 block">Nombre de variable *</Label>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        value={param.name}
                                                                        onChange={(e) => updateParameter(param.id, {
                                                                            name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                                                                        })}
                                                                        placeholder="rfc"
                                                                        className="font-mono h-10"
                                                                    />
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="icon"
                                                                                    className="shrink-0 h-10 w-10"
                                                                                    onClick={() => copyVariable(param.name)}
                                                                                >
                                                                                    <Copy className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Copiar {`{{${param.name}}}`}</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <Label className="text-xs mb-2 block">Tipo de dato</Label>
                                                                <Select
                                                                    value={param.type}
                                                                    onValueChange={(v) => updateParameter(param.id, { type: v as any })}
                                                                >
                                                                    <SelectTrigger className="h-10">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {PARAM_TYPES.map(t => (
                                                                            <SelectItem key={t.value} value={t.value}>
                                                                                <span className="flex items-center gap-2">
                                                                                    <t.icon className="h-4 w-4" /> {t.label}
                                                                                </span>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div>
                                                                <Label className="text-xs mb-2 block">Valor de ejemplo</Label>
                                                                <Input
                                                                    value={param.example}
                                                                    onChange={(e) => updateParameter(param.id, { example: e.target.value })}
                                                                    placeholder="XAXX010101000"
                                                                    className="h-10"
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-3 pt-6">
                                                                <Switch
                                                                    checked={param.required}
                                                                    onCheckedChange={(v) => updateParameter(param.id, { required: v })}
                                                                />
                                                                <Label className="text-sm">Requerido</Label>
                                                            </div>

                                                            <div className="col-span-2">
                                                                <Label className="text-xs mb-2 block">Descripción para la IA</Label>
                                                                <Input
                                                                    value={param.description}
                                                                    onChange={(e) => updateParameter(param.id, { description: e.target.value })}
                                                                    placeholder="RFC del cliente para consultar facturas"
                                                                    className="h-10"
                                                                />
                                                            </div>

                                                            <div className="col-span-2">
                                                                <Label className="text-xs mb-2 block">Valor por defecto</Label>
                                                                <Input
                                                                    value={param.default_value}
                                                                    onChange={(e) => updateParameter(param.id, { default_value: e.target.value })}
                                                                    placeholder="Opcional - valor si no se proporciona"
                                                                    className="h-10"
                                                                />
                                                            </div>

                                                            <div className="col-span-4">
                                                                <Label className="text-xs mb-2 flex items-center gap-1">
                                                                    <Sparkles className="h-3 w-3 text-violet-500" />
                                                                    Pista de extracción para la IA
                                                                </Label>
                                                                <Textarea
                                                                    value={param.extraction_hint}
                                                                    onChange={(e) => updateParameter(param.id, { extraction_hint: e.target.value })}
                                                                    placeholder="Ej: El RFC es una cadena alfanumérica de 12-13 caracteres con formato XAXX010101000. Puede estar en mayúsculas o minúsculas."
                                                                    className="min-h-[60px] resize-none"
                                                                />
                                                            </div>

                                                            {/* Normalización */}
                                                            <div className="col-span-2">
                                                                <Label className="text-xs mb-2 block">Normalización</Label>
                                                                <Select
                                                                    value={param.normalize || 'none'}
                                                                    onValueChange={(v) => updateParameter(param.id, { normalize: v === 'none' ? '' : v })}
                                                                >
                                                                    <SelectTrigger className="h-10">
                                                                        <SelectValue placeholder="Sin normalización" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {NORMALIZE_OPTIONS.map(opt => (
                                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                                {opt.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                                    Convierte el input del cliente al formato correcto
                                                                </p>
                                                            </div>

                                                            <div className="col-span-2">
                                                                <Label className="text-xs mb-2 block">Patrón de formato</Label>
                                                                <Input
                                                                    value={param.format_pattern || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toUpperCase()
                                                                        updateParameter(param.id, { format_pattern: val })
                                                                    }}
                                                                    placeholder="XXX-0000-XXXX"
                                                                    className={`h-10 font-mono ${param.format_pattern && !/^[X0\-_./\s]*$/.test(param.format_pattern) ? 'border-destructive' : ''}`}
                                                                />
                                                                {param.format_pattern && !/^[X0\-_./\s]*$/.test(param.format_pattern) ? (
                                                                    <p className="text-[10px] text-destructive mt-1">
                                                                        ⚠️ Solo usa X, 0 y separadores (- _ . /)
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                                        X=letra/número, 0=número, guiones son literales
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => removeParameter(param.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* REQUEST TAB */}
                                <TabsContent value="request" className="p-6 space-y-6 m-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-32">
                                            <Label className="mb-2">Método</Label>
                                            <Select
                                                value={formData.method}
                                                onValueChange={(v) => setFormData(prev => ({ ...prev, method: v }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {HTTP_METHODS.map(m => (
                                                        <SelectItem key={m.value} value={m.value}>
                                                            <Badge className={cn("font-mono", m.color)}>
                                                                {m.value}
                                                            </Badge>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex-1">
                                            <Label className="mb-2">
                                                URL del Endpoint *
                                                {formData.input_schema.length > 0 && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        Arrastra variables desde el panel derecho →
                                                    </span>
                                                )}
                                            </Label>
                                            <DroppableInput
                                                value={formData.endpoint}
                                                onChange={(v) => setFormData(prev => ({ ...prev, endpoint: v }))}
                                                placeholder="https://api.ejemplo.com/facturas?rfc={{rfc}}"
                                                onDrop={handleVariableDrop('endpoint')}
                                            />
                                        </div>
                                    </div>

                                    {/* URL Preview */}
                                    {formData.endpoint && (
                                        <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-sm overflow-x-auto">
                                            <span className="text-emerald-400">{formData.method}</span>{' '}
                                            <span className="text-blue-400">{buildPreviewUrl()}</span>
                                        </div>
                                    )}

                                    {/* Body Template */}
                                    {formData.method !== 'GET' && (
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="mb-2 flex items-center gap-2">
                                                    <Braces className="h-4 w-4" />
                                                    Body Template (JSON)
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        Arrastra variables desde el panel →
                                                    </span>
                                                </Label>
                                                <CodeEditor
                                                    value={formData.body_template || `{\n  "ejemplo": "{{parametro}}"\n}`}
                                                    onChange={(v) => setFormData(prev => ({ ...prev, body_template: v || '' }))}
                                                    language="json"
                                                    height="200px"
                                                    disableValidation
                                                />
                                            </div>

                                            {/* Body Preview */}
                                            {formData.body_template && (
                                                <div>
                                                    <Label className="text-xs mb-2 text-muted-foreground">Vista previa con valores de prueba</Label>
                                                    <ScrollArea className="h-[120px] rounded-lg bg-slate-900">
                                                        <pre className="p-4 text-slate-100 font-mono text-sm">
                                                            {JSON.stringify(buildPreviewBody(), null, 2)}
                                                        </pre>
                                                    </ScrollArea>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* AUTH TAB */}
                                <TabsContent value="auth" className="p-6 space-y-6 m-0">
                                    <div>
                                        <Label className="mb-2">Tipo de Autenticación</Label>
                                        <Select
                                            value={formData.auth_type}
                                            onValueChange={(v) => setFormData(prev => ({
                                                ...prev,
                                                auth_type: v,
                                                auth_config: {}
                                            }))}
                                        >
                                            <SelectTrigger className="w-64">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin autenticación</SelectItem>
                                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                                <SelectItem value="api_key">API Key</SelectItem>
                                                <SelectItem value="basic">Basic Auth</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.auth_type === 'bearer' && (
                                        <div>
                                            <Label className="mb-2">Bearer Token</Label>
                                            <Input
                                                type="password"
                                                value={formData.auth_config.token || ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    auth_config: { ...prev.auth_config, token: e.target.value }
                                                }))}
                                                placeholder="Tu token de autenticación"
                                            />
                                        </div>
                                    )}

                                    {formData.auth_type === 'api_key' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="mb-2">Nombre del Header</Label>
                                                <Input
                                                    value={formData.auth_config.header_name || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        auth_config: { ...prev.auth_config, header_name: e.target.value }
                                                    }))}
                                                    placeholder="X-API-Key"
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-2">API Key</Label>
                                                <Input
                                                    type="password"
                                                    value={formData.auth_config.key || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        auth_config: { ...prev.auth_config, key: e.target.value }
                                                    }))}
                                                    placeholder="Tu API Key"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.auth_type === 'basic' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="mb-2">Usuario</Label>
                                                <Input
                                                    value={formData.auth_config.username || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        auth_config: { ...prev.auth_config, username: e.target.value }
                                                    }))}
                                                    placeholder="username"
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-2">Contraseña</Label>
                                                <Input
                                                    type="password"
                                                    value={formData.auth_config.password || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        auth_config: { ...prev.auth_config, password: e.target.value }
                                                    }))}
                                                    placeholder="password"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TEST TAB */}
                                <TabsContent value="test" className="p-6 space-y-6 m-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <TestTube2 className="h-4 w-4 text-emerald-500" />
                                                Panel de Pruebas
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Ingresa valores de prueba y ejecuta la herramienta
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const examples: Record<string, string> = {}
                                                formData.input_schema.forEach(p => {
                                                    examples[p.name] = p.example || ''
                                                })
                                                setTestValues(examples)
                                            }}
                                            className="gap-2"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Usar ejemplos
                                        </Button>
                                    </div>

                                    {/* Test Inputs */}
                                    {formData.input_schema.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
                                            {formData.input_schema.map(param => (
                                                <div key={param.id}>
                                                    <Label className="text-xs mb-1 flex items-center gap-1">
                                                        <code className="text-violet-600">{param.name}</code>
                                                        {param.required && <span className="text-red-500">*</span>}
                                                    </Label>
                                                    {param.type === 'boolean' ? (
                                                        <div className="flex items-center gap-2 h-9">
                                                            <Switch
                                                                checked={testValues[param.name] === 'true'}
                                                                onCheckedChange={(v) => setTestValues(prev => ({
                                                                    ...prev,
                                                                    [param.name]: v ? 'true' : 'false'
                                                                }))}
                                                            />
                                                            <span className="text-sm">
                                                                {testValues[param.name] === 'true' ? 'Sí' : 'No'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                                                            value={testValues[param.name] || ''}
                                                            onChange={(e) => setTestValues(prev => ({
                                                                ...prev,
                                                                [param.name]: e.target.value
                                                            }))}
                                                            placeholder={param.example || param.description}
                                                            className="h-9"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-muted/30 border text-center text-muted-foreground">
                                            No hay parámetros definidos
                                        </div>
                                    )}

                                    {/* Request Preview */}
                                    <div>
                                        <button
                                            onClick={() => setShowTestRequest(!showTestRequest)}
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            {showTestRequest ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            Vista previa del request
                                        </button>
                                        {showTestRequest && (
                                            <div className="mt-2 p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                                                <div>
                                                    <span className="text-emerald-400">{formData.method}</span>{' '}
                                                    <span className="text-blue-400">{buildPreviewUrl()}</span>
                                                </div>
                                                {formData.body_template && (
                                                    <pre className="mt-2 text-amber-300">
                                                        {JSON.stringify(buildPreviewBody(), null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Test Button */}
                                    <Button
                                        onClick={handleTest}
                                        disabled={testing}
                                        className="w-full gap-2"
                                        size="lg"
                                    >
                                        {testing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Ejecutando...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4" />
                                                Ejecutar Prueba
                                            </>
                                        )}
                                    </Button>



                                    {/* Test Result */}
                                    {testResult && (
                                        <div className={cn(
                                            "p-4 rounded-xl border",
                                            testResult.success
                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                        )}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {testResult.success ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    )}
                                                    <span className={cn(
                                                        "font-medium",
                                                        testResult.success ? "text-emerald-700" : "text-red-700"
                                                    )}>
                                                        {testResult.success ? 'Prueba Exitosa' : 'Error'}
                                                    </span>
                                                    {/* Show HTTP status if available in error */}
                                                    {!testResult.success && testResult.error && (() => {
                                                        try {
                                                            const errDetails = JSON.parse(testResult.error)
                                                            if (errDetails.status_code) {
                                                                return (
                                                                    <Badge variant="destructive">
                                                                        HTTP {errDetails.status_code}
                                                                    </Badge>
                                                                )
                                                            }
                                                        } catch { return null }
                                                        return null
                                                    })()}
                                                </div>
                                                {testResult.duration_ms && (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {testResult.duration_ms}ms
                                                    </Badge>
                                                )}
                                            </div>

                                            {testResult.error && (
                                                <div className="space-y-3">
                                                    {(() => {
                                                        try {
                                                            const errDetails = JSON.parse(testResult.error)
                                                            return (
                                                                <>
                                                                    {/* Request Info */}
                                                                    {errDetails.request_url && (
                                                                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-900 text-xs">
                                                                            <span className="text-muted-foreground">Request: </span>
                                                                            <span className="font-mono text-blue-600 dark:text-blue-400">
                                                                                {errDetails.request_method} {errDetails.request_url}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {/* Request Body if sent */}
                                                                    {errDetails.request_body && (
                                                                        <div>
                                                                            <Label className="text-xs text-muted-foreground">Request Body:</Label>
                                                                            <pre className="p-2 rounded bg-slate-100 dark:bg-slate-900 text-xs font-mono overflow-auto max-h-24 mt-1">
                                                                                {errDetails.request_body}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                    {/* Error Status */}
                                                                    <div className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                                                                        <strong>Status:</strong> {errDetails.status || `HTTP ${errDetails.status_code}`}
                                                                    </div>
                                                                    {/* Response Body */}
                                                                    {errDetails.response_body && (
                                                                        <div>
                                                                            <Label className="text-xs text-muted-foreground">Response Body:</Label>
                                                                            <pre className="p-3 rounded bg-white dark:bg-slate-950 border text-xs font-mono overflow-auto max-h-48 mt-1">
                                                                                {typeof errDetails.response_body === 'string' 
                                                                                    ? errDetails.response_body 
                                                                                    : JSON.stringify(errDetails.response_body, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )
                                                        } catch {
                                                            // Not JSON, show as plain error
                                                            return (
                                                                <div className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                                                                    {testResult.error}
                                                                </div>
                                                            )
                                                        }
                                                    })()}
                                                </div>
                                            )}

                                            {testResult.data && (
                                                <pre className="p-3 rounded bg-white dark:bg-slate-950 border text-xs font-mono overflow-auto max-h-64">
                                                    {JSON.stringify(testResult.data, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Right: Variables Panel */}
                    {formData.input_schema.length > 0 && (activeTab === 'request' || activeTab === 'test') && (
                        <div className="w-72 border-l bg-muted/30 flex flex-col">
                            <div className="p-4 border-b">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Variable className="h-4 w-4 text-violet-500" />
                                    Variables
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Arrastra al editor o URL
                                </p>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-2">
                                    {formData.input_schema.map(param => (
                                        <DraggableVariable
                                            key={param.id}
                                            param={param}
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                {tool ? 'Guardar Cambios' : 'Crear Herramienta'}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
