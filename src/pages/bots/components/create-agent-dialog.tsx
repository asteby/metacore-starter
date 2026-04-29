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
    DialogTitle,
    DialogTrigger,
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Loader2, Sparkles, UploadCloud,
    ArrowRight, CheckCircle2, BrainCircuit,
    MessageSquare, Fingerprint, Lightbulb, Image, Video, File, X,
    Plus, Trash2, Tag, Zap, ShoppingBag, Headphones, CalendarDays, LayoutGrid
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
// Checkbox removed
// Unused imports removed: Progress, Tabs, TabsList, TabsTrigger, TabsContent, Bot, LinkIcon, FileText, ArrowLeft, Upload, Plus

const formSchema = z.object({
    name: z.string().min(2, "El nombre es muy corto."),
    description: z.string().min(5, "La descripción ayuda a identificar al bot."),
    system_prompt: z.string().min(10, "Las instrucciones son vitales para el bot."),
    // Hidden config - using required number for compatibility
    temperature: z.number().min(0).max(1),
})

// Explicit type for form values
type FormValues = z.infer<typeof formSchema>

interface PendingKnowledgeItem {
    type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'url'
    content?: string // Text content or File URL
    title?: string
    file_name?: string
    file_size?: number
    mime_type?: string
    file_url?: string // URL after upload
}


interface CreateAgentDialogProps {
    children?: React.ReactNode
    onSuccess?: () => void
}

interface CustomField {
    id?: string
    key: string
    label: string
    field_type: string
    is_required: boolean
    description: string
}

type AgentType = 'seller' | 'support' | 'scheduler' | 'copilot'

const AGENT_TYPE_OPTIONS: { type: AgentType; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }[] = [
    { type: 'support', icon: Headphones, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60' },
    { type: 'seller', icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60' },
    { type: 'scheduler', icon: CalendarDays, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10 border-violet-500/30 hover:border-violet-500/60' },
    { type: 'copilot', icon: BrainCircuit, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60' },
]

export function CreateAgentDialog({ children, onSuccess }: CreateAgentDialogProps) {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [agentType, setAgentType] = useState<AgentType | undefined>(undefined)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const TOTAL_STEPS = agentType === 'seller' ? 5 : 4

    const STEPS = [
        { id: 1, title: t('agents.type_label'), icon: LayoutGrid, description: t('agents.select_type') },
        { id: 2, title: t('agents.identity'), icon: Fingerprint, description: t('agents.agent_identity_description') },
        { id: 3, title: t('agents.knowledge'), icon: BrainCircuit, description: t('flows.train_brain') },
        { id: 4, title: t('agents.behavior'), icon: MessageSquare, description: t('flows.define_personality') },
        ...(agentType === 'seller' ? [{ id: 5, title: 'Captura', icon: Sparkles, description: 'Configura qué datos debe recolectar el agente' }] : []),
    ]

    // Upload state
    const [uploading, setUploading] = useState(false)
    const [, setUploadProgress] = useState(0) // uploadProgress not used yet

    // Knowledge State
    const [knowledgeText, setKnowledgeText] = useState("")
    const [pendingKnowledge, setPendingKnowledge] = useState<PendingKnowledgeItem[]>([])
    // Temporary files storage before adding to pending list
    const [tempFiles, setTempFiles] = useState<PendingKnowledgeItem[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Segmentation state
    const [isSegmenting, setIsSegmenting] = useState(false)
    const [segmentedChunks, setSegmentedChunks] = useState<{ title: string; content: string; _files?: any[] }[]>([])
    const [showChunksPreview, setShowChunksPreview] = useState(false)

    const [copilotSlug, setCopilotSlug] = useState("")
    const [newFieldName, setNewFieldName] = useState("")
    const [newFieldDesc, setNewFieldDesc] = useState("")
    const [localFields, setLocalFields] = useState<Omit<CustomField, 'id'>[]>([])
    const [assignedExistingFieldIds, setAssignedExistingFieldIds] = useState<string[]>([])

    const { data: existingFields } = useQuery<any[]>({
        queryKey: ['contact-custom-fields'],
        queryFn: async () => {
            const res = await api.get('/data/contact_custom_fields/me')
            let fields = []
            if (Array.isArray(res.data.data)) fields = res.data.data
            else if (res.data.data && Array.isArray(res.data.data.data)) fields = res.data.data.data
            return fields
        }
    })

    const handleAddField = () => {
        if (!newFieldName.trim()) return

        const key = newFieldName.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        const newField = {
            label: newFieldName,
            key: key || `field_${Date.now()}`,
            description: newFieldDesc,
            field_type: 'text',
            is_required: false
        }

        setLocalFields(prev => [...prev, newField])
        setNewFieldName("")
        setNewFieldDesc("")
    }

    const toggleExistingField = (fieldId: string) => {
        setAssignedExistingFieldIds(prev =>
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        )
    }

    const removeLocalField = (index: number) => {
        setLocalFields(prev => prev.filter((_, i) => i !== index))
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            system_prompt: "",
            temperature: 0.7,
        },
    })

    const agentName = form.watch('name')

    // Reset everything when dialog closes
    useEffect(() => {
        if (!open) {
            setStep(1)
            setAgentType(undefined)
            form.reset()
            setKnowledgeText("")
            setPendingKnowledge([])
            setTempFiles([])
            setLocalFields([]) // Clear local fields
            setCopilotSlug("") // Clear copilot slug
        }
    }, [open, form.reset])

    const handleNext = async () => {
        if (step === 1 && !agentType) return // Must select a type

        const fieldsToValidate = step === 2
            ? ['name', 'description'] as const
            : step === 4
                ? ['system_prompt'] as const
                : []

        if (fieldsToValidate.length > 0) {
            const isValid = await form.trigger(fieldsToValidate)
            if (!isValid) return
        }

        setStep(prev => Math.min(prev + 1, TOTAL_STEPS))
    }

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1))
    }

    // State for text input (simplified for robustness)
    // const [knowledgeText, setKnowledgeText] = useState("") // Moved up

    // AI Suggestions
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const lastFetchedSignature = useRef("")

    useEffect(() => {
        const textSignature = form.getValues().name + form.getValues().description

        // Only fetch if we represent step 3 AND the content has changed since last fetch
        if (step === 3 && textSignature && textSignature !== lastFetchedSignature.current) {
            setSuggestions([]) // Clear old suggestions
            fetchSuggestions()
            lastFetchedSignature.current = textSignature
        }
    }, [step])

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true)
        try {
            const { name, description } = form.getValues()
            const res = await api.post('/ai/training-suggestions', { role: name, description })
            if (res.data.success) {
                setSuggestions(res.data.data)
            }
        } catch (e) {
            console.error("Failed to fetch suggestions", e)
        } finally {
            setLoadingSuggestions(false)
        }
    }

    const addSuggestion = (text: string) => {
        const current = knowledgeText
        const separator = current ? "\n\n" : ""
        setKnowledgeText(current + separator + text + ":\n")
    }

    const handleProcessKnowledge = async () => {
        if (!knowledgeText.trim() && tempFiles.length === 0) return

        // Files only, no text → add directly
        if (!knowledgeText.trim() && tempFiles.length > 0) {
            const newItems: PendingKnowledgeItem[] = tempFiles.map(file => ({
                type: file.type,
                content: "",
                title: file.file_name,
                file_url: file.file_url,
                file_name: file.file_name,
                file_size: file.file_size,
                mime_type: file.mime_type
            }))
            setPendingKnowledge(prev => [...prev, ...newItems])
            setTempFiles([])
            if (fileInputRef.current) fileInputRef.current.value = ''
            toast.success("Archivos añadidos")
            return
        }

        setIsSegmenting(true)
        try {
            if (tempFiles.length > 0 && knowledgeText.trim()) {
                // Text + files → group semantically
                const fileNames = tempFiles.map(f => f.file_name)
                const res = await api.post('/ai/group-knowledge', { text: knowledgeText, file_names: fileNames })
                if (res.data.success && res.data.data?.length > 0) {
                    setSegmentedChunks(res.data.data.map((c: any) => ({
                        ...c,
                        _files: (c.file_names as string[])
                            .map((name: string) => tempFiles.find(f => f.file_name === name))
                            .filter(Boolean)
                    })))
                    setShowChunksPreview(true)
                } else {
                    addFilesWithTextFallback()
                }
            } else {
                // Text only → segment by topic
                const res = await api.post('/ai/segment-knowledge', { content: knowledgeText })
                if (res.data.success && res.data.data?.length > 0) {
                    setSegmentedChunks(res.data.data.map((c: any) => ({ ...c, _files: [] })))
                    setShowChunksPreview(true)
                } else {
                    addTextFallback()
                }
            }
        } catch {
            toast.error("No se pudo analizar, guardando como bloque único")
            tempFiles.length > 0 ? addFilesWithTextFallback() : addTextFallback()
        } finally {
            setIsSegmenting(false)
        }
    }

    const addTextFallback = () => {
        setPendingKnowledge(prev => [...prev, {
            type: 'text',
            content: knowledgeText,
            title: knowledgeText.substring(0, 50) + (knowledgeText.length > 50 ? '...' : ''),
        }])
        setKnowledgeText("")
    }

    const addFilesWithTextFallback = () => {
        const newItems: PendingKnowledgeItem[] = tempFiles.map(file => ({
            type: file.type,
            content: knowledgeText,
            title: knowledgeText.substring(0, 50) || file.file_name,
            file_url: file.file_url,
            file_name: file.file_name,
            file_size: file.file_size,
            mime_type: file.mime_type
        }))
        setPendingKnowledge(prev => [...prev, ...newItems])
        setKnowledgeText("")
        setTempFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const confirmSegmentedChunks = () => {
        const newItems: PendingKnowledgeItem[] = []
        for (const chunk of segmentedChunks) {
            const chunkFiles: any[] = chunk._files || []
            if (chunkFiles.length > 0) {
                for (const file of chunkFiles) {
                    newItems.push({
                        type: file.type,
                        content: chunk.content,
                        title: chunk.title,
                        file_url: file.file_url,
                        file_name: file.file_name,
                        file_size: file.file_size,
                        mime_type: file.mime_type
                    })
                }
            } else if (chunk.content?.trim()) {
                newItems.push({ type: 'text', content: chunk.content, title: chunk.title })
            }
        }
        setPendingKnowledge(prev => [...prev, ...newItems])
        setSegmentedChunks([])
        setShowChunksPreview(false)
        setKnowledgeText("")
        setTempFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        toast.success(`${newItems.length} ${newItems.length === 1 ? 'memoria creada' : 'memorias creadas'}`)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        setUploadProgress(0)
        let successCount = 0

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            // Update progress based on file count
            setUploadProgress(Math.round(((i) / files.length) * 100))

            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'knowledge')

                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                if (res.data.success) {
                    const url = res.data.url
                    const type = file.type.startsWith('image/') ? 'image' :
                        file.type.startsWith('video/') ? 'video' :
                            file.type === 'application/pdf' ? 'pdf' : 'document'

                    setTempFiles(prev => [...prev, {
                        type: type as any,
                        file_name: file.name,
                        file_url: url,
                        file_size: file.size,
                        mime_type: file.type
                    } as any])
                    successCount++
                }
            } catch (error) {
                console.error("Upload failed for file " + file.name, error)
            }
        }

        setUploading(false)
        setUploadProgress(0)

        if (successCount > 0) {
            toast.success(`${successCount} archivos adjuntados`)
        } else {
            toast.error("Error al subir archivos")
        }
    }

    // Kept for future use - can be used to remove items from pending knowledge
    void function removeKnowledge(index: number) {
        setPendingKnowledge(prev => prev.filter((_, i) => i !== index))
    }

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            // 1. Create the Agent FIRST to get an ID for the custom fields
            const payload = {
                ...values,
                agent_type: agentType || 'support',
                status: 'active',
                ...(agentType === 'copilot' ? { slug: copilotSlug, mode: 'copilot' as const } : {}),
                config: {
                    data_capture_fields: assignedExistingFieldIds // Start with existing ones
                }
            }
            const res = await api.post('/data/agents/me', payload)

            if (res.data.success) {
                const newAgentId = res.data.data.id

                // 2. Create NEW custom fields with agent_id
                const finalFieldIds = [...assignedExistingFieldIds]
                if (localFields.length > 0) {
                    for (const field of localFields) {
                        try {
                            const fRes = await api.post('/data/contact_custom_fields/me', {
                                ...field,
                                agent_id: newAgentId
                            })
                            if (fRes.data.data?.id) {
                                finalFieldIds.push(fRes.data.data.id)
                            }
                        } catch (err) {
                            console.error("Failed to create field:", field.label, err)
                        }
                    }
                    // Update agent config with the now-created fields
                    await api.patch(`/data/agents/me/${newAgentId}`, {
                        config: {
                            ...res.data.data.config,
                            data_capture_fields: finalFieldIds
                        }
                    })
                    await queryClient.invalidateQueries({ queryKey: ['contact-custom-fields'] })
                }

                // 3. Upload Pending Knowledge (if any)
                console.log("📦 Pending knowledge to upload:", pendingKnowledge.length, pendingKnowledge)

                if (pendingKnowledge.length > 0) {
                    toast.info("Sincronizando conocimiento a la base vectorial...")

                    // Process sequentially to avoid race conditions or rate limits
                    for (const item of pendingKnowledge) {
                        try {
                            // Prepare payload based on item type
                            const kPayload = {
                                agent_id: newAgentId,
                                source: 'initial-setup',
                                type: item.type,
                                content: item.content,
                                title: item.title,
                                file_url: item.file_url,
                                file_name: item.file_name,
                                file_size: item.file_size,
                                mime_type: item.mime_type
                            }

                            console.log("📤 Uploading knowledge item:", kPayload)
                            const uploadRes = await api.post('/ai/knowledge/upload', kPayload)
                            console.log("✅ Knowledge upload response:", uploadRes.data)
                        } catch (err: any) {
                            console.error("❌ Failed to upload knowledge item:", err);
                        }
                    }
                    toast.success("¡Base de conocimiento actualizada!")
                }

                toast.success("¡Tu agente ha cobrado vida!")
                setOpen(false)
                setStep(1)
                form.reset()
                setPendingKnowledge([])
                onSuccess?.()
            } else {
                toast.error(res.data.message || t('users.error_creating'))
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('users.error_creating')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
                setStep(1)
                setTempFiles([]) // Reset temp files on close
                setPendingKnowledge([]) // Reset pending knowledge on close
                setKnowledgeText("") // Reset knowledge text on close
                form.reset() // Reset form fields
            }
            setOpen(val)
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">

                {/* Header / Stepper UI */}
                <div className="bg-muted/30 border-b p-4 pb-6">
                    <DialogTitle className="sr-only">{t('agents.create_agent')}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Asistente para la creación y configuración de un nuevo agente de IA.
                    </DialogDescription>
                    <div className="flex justify-between items-center max-w-xl mx-auto relative cursor-default">
                        {/* Connecting Line */}
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-muted z-0">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-500 ease-in-out"
                                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
                            />
                        </div>

                        {STEPS.map((s) => {
                            const isActive = step >= s.id
                            return (
                                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                                            isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30" : "border-muted text-muted-foreground"
                                        )}
                                    >
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className={cn("text-xs font-bold uppercase tracking-wider transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>
                                            {s.title}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto h-full flex flex-col">

                            {/* STEP 1: TYPE SELECTION */}
                            {step === 1 && (
                                <div className="flex flex-col justify-center h-full animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="text-center space-y-1 mb-8">
                                        <h3 className="text-xl font-bold tracking-tight">{t('agents.select_type')}</h3>
                                        <p className="text-sm text-muted-foreground">{t('agents.select_type_description')}</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {AGENT_TYPE_OPTIONS.map(({ type, icon: Icon, color, bgColor }) => {
                                            const isSelected = agentType === type
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setAgentType(type)}
                                                    className={cn(
                                                        "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 text-center transition-all",
                                                        isSelected
                                                            ? "border-indigo-600 bg-indigo-500/10 shadow-sm"
                                                            : bgColor + " border"
                                                    )}
                                                >
                                                    <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border", isSelected ? "bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-600" : "bg-background")}>
                                                        <Icon className={cn("h-7 w-7", isSelected ? "text-indigo-600 dark:text-indigo-400" : color)} />
                                                    </div>
                                                    <div>
                                                        <p className={cn("font-semibold text-sm", isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-foreground")}>
                                                            {t(`agents.type_${type}`)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                                            {t(`agents.type_${type}_desc`)}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="absolute top-2.5 right-2.5 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: IDENTITY */}
                            {step === 2 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="text-center space-y-1 mb-6">
                                        <h3 className="text-xl font-bold tracking-tight">{t('agents.agent_identity')}</h3>
                                        <p className="text-sm text-muted-foreground">{t('agents.agent_identity_description')}</p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('agents.visible_name')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('agents.visible_name_placeholder')} className="h-10" {...field} />
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
                                                <FormLabel>{t('agents.purpose')}</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={t('agents.purpose_placeholder')}
                                                        className="resize-none text-sm min-h-[80px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {agentType === 'copilot' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Slug del agente</label>
                                            <Input
                                                placeholder="aurora"
                                                value={copilotSlug}
                                                onChange={(e) => setCopilotSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                                className="h-10"
                                            />
                                            <p className="text-xs text-muted-foreground">Será mencionado como @{copilotSlug || 'slug'} en WhatsApp</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: KNOWLEDGE */}
                            {step === 3 && (
                                <div className="flex flex-col h-full animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <h3 className="text-lg font-semibold tracking-tight">{t('agents.knowledge_base')}</h3>
                                        {pendingKnowledge.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-in zoom-in-50">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>
                                                    {new Set(pendingKnowledge.map(k => k.content)).size} {new Set(pendingKnowledge.map(k => k.content)).size === 1 ? 'memoria' : 'memorias'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Unifed Knowledge Form */}
                                    <div className="flex-1 flex flex-col gap-3">

                                        {/* AI Suggestions */}
                                        {(suggestions.length > 0 || loadingSuggestions) && (
                                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                                                {loadingSuggestions && (
                                                    <span className="text-xs text-muted-foreground flex items-center animate-pulse">
                                                        <Sparkles className="w-3 h-3 mr-1.5 text-indigo-500" />
                                                        Pensando ideas...
                                                    </span>
                                                )}
                                                {!loadingSuggestions && suggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => addSuggestion(s)}
                                                        className="text-[11px] border px-2.5 py-1 rounded-full bg-muted/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Lightbulb className="w-3 h-3 text-amber-500" />
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-3 flex-1 flex flex-col relative">
                                            <div className="relative flex-1">
                                                <Textarea
                                                    placeholder="Escribe aquí lo que tu agente debe saber. Ej: &quot;Nuestro horario es de 9am a 6pm&quot;. Si adjuntas un archivo, describe aquí su contenido."
                                                    className="w-full h-full resize-none p-4 text-sm leading-relaxed border-muted focus:border-indigo-500 bg-muted/10 transition-all rounded-xl"
                                                    value={knowledgeText}
                                                    onChange={(e) => setKnowledgeText(e.target.value)}
                                                />
                                                {tempFiles.length > 0 && (
                                                    <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 max-w-[95%]">
                                                        {tempFiles.map((file, idx) => (
                                                            <div key={idx} className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md shadow-sm opacity-90 animate-in zoom-in-50">
                                                                <div className="bg-emerald-100 text-emerald-600 rounded-sm p-0.5">
                                                                    {file.type === 'video' ? <Video className="w-3 h-3" /> :
                                                                        file.type === 'image' ? <Image className="w-3 h-3" /> :
                                                                            <File className="w-3 h-3" />}
                                                                </div>
                                                                <span className="text-[10px] font-medium truncate max-w-[80px]">
                                                                    {file.file_name}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        setTempFiles(prev => prev.filter((_, i) => i !== idx))
                                                                    }}
                                                                    className="text-muted-foreground hover:text-red-500 ml-1"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="flex-1 text-muted-foreground hover:text-foreground"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <UploadCloud className="w-4 h-4 mr-2" />
                                                    {uploading ? "..." : "Adjuntar"}
                                                </Button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        handleFileUpload(e)
                                                        // Reset input so same file can be selected again if needed,
                                                        // though normally we want to keep it. But since we store in state tempFiles,
                                                        // we can clear the input to allow selecting more files.
                                                        if (e.target) e.target.value = ''
                                                    }}
                                                />

                                                <Button
                                                    type="button"
                                                    onClick={handleProcessKnowledge}
                                                    disabled={uploading || isSegmenting || (!knowledgeText.trim() && tempFiles.length === 0)}
                                                    size="sm"
                                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white"
                                                >
                                                    {(uploading || isSegmenting) ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isSegmenting ? 'Analizando...' : '...'}</>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Memorizar
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chunks preview (text segmentation or text+files grouping) */}
                                    {showChunksPreview && (
                                        <div className="mt-3 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 bg-indigo-50/50 dark:bg-indigo-950/30 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                                    <BrainCircuit className="w-3.5 h-3.5" />
                                                    {segmentedChunks.length} {segmentedChunks.length === 1
                                                        ? ((segmentedChunks[0]?._files?.length ?? 0) > 0 ? 'grupo' : 'tema')
                                                        : (segmentedChunks.some((c: any) => c._files?.length > 0) ? 'grupos' : 'temas')} detectados
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowChunksPreview(false)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                                {segmentedChunks.map((chunk: any, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-slate-900 border rounded-lg p-2.5 group">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <input
                                                                    className="w-full text-xs font-semibold bg-transparent border-none outline-none text-indigo-700 dark:text-indigo-300"
                                                                    value={chunk.title}
                                                                    onChange={e => setSegmentedChunks((prev: any[]) => prev.map((c, i) => i === idx ? { ...c, title: e.target.value } : c))}
                                                                />
                                                                {chunk.content && (
                                                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{chunk.content}</p>
                                                                )}
                                                                {chunk._files?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                        {chunk._files.map((f: any, fi: number) => (
                                                                            <span key={fi} className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                                                {f.type === 'image' ? <Image className="w-3 h-3" /> : f.type === 'video' ? <Video className="w-3 h-3" /> : <File className="w-3 h-3" />}
                                                                                {f.file_name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSegmentedChunks((prev: any[]) => prev.filter((_, i) => i !== idx))}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0 mt-0.5"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={confirmSegmentedChunks}
                                                disabled={segmentedChunks.length === 0}
                                                size="sm"
                                                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                Confirmar {segmentedChunks.length} {segmentedChunks.length === 1 ? 'memoria' : 'memorias'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 4: BEHAVIOR */}
                            {step === 4 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300 h-full flex flex-col">
                                    <div className="text-center space-y-1 mb-2">
                                        <h3 className="text-xl font-bold tracking-tight">{t('agents.behavior')}</h3>
                                        <p className="text-sm text-muted-foreground">Define las reglas de juego.</p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="system_prompt"
                                        render={({ field }) => (
                                            <FormItem className="flex-1 flex flex-col">
                                                <FormLabel className="flex items-center justify-between">
                                                    {t('agents.system_instructions')}
                                                </FormLabel>
                                                <FormControl className="flex-1">
                                                    <Textarea
                                                        placeholder="Ej: Eres un asistente virtual profesional..."
                                                        className="flex-1 min-h-[200px] font-mono text-xs leading-relaxed p-4 bg-muted/20 resize-none focus:bg-background transition-colors"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div className="flex gap-2 pt-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-[10px] font-medium">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Define tono y estilo
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Reglas estrictas
                                                    </span>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {/* STEP 5: DATA CAPTURE (Vendedor only) */}
                            {step === 5 && agentType === 'seller' && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="text-center space-y-1 mb-6">
                                        <h3 className="text-xl font-bold tracking-tight">Recolección de Datos</h3>
                                        <p className="text-sm text-muted-foreground">Configura qué información debe capturar {agentName || 'el agente'} durante sus ventas.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-500" />
                                                Asignar Campos Existentes
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {existingFields?.map(field => {
                                                    const isSelected = assignedExistingFieldIds.includes(field.id)
                                                    return (
                                                        <Button
                                                            key={field.id}
                                                            type="button"
                                                            variant={isSelected ? "default" : "outline"}
                                                            size="sm"
                                                            className={cn(
                                                                "justify-start h-auto py-2 px-3 text-left transition-all",
                                                                isSelected ? "bg-indigo-600 border-indigo-600 hover:bg-indigo-700" : "bg-muted/10 hover:bg-indigo-500/10 hover:border-indigo-500/50"
                                                            )}
                                                            onClick={() => toggleExistingField(field.id)}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className={cn("text-xs font-medium truncate", isSelected ? "text-white" : "text-foreground")}>{field.label}</p>
                                                                    {!field.agent_id && (
                                                                        <Badge variant="outline" className={cn("text-[8px] h-3 px-1 border-indigo-200 font-normal", isSelected ? "border-indigo-400 text-indigo-100" : "text-indigo-500")}>Global</Badge>
                                                                    )}
                                                                </div>
                                                                <p className={cn("text-[10px] truncate", isSelected ? "text-indigo-100/70" : "text-muted-foreground")}>{field.key}</p>
                                                            </div>
                                                            {isSelected ? <CheckCircle2 className="w-3 h-3 ml-2 text-white" /> : <Plus className="w-3 h-3 ml-2 opacity-30" />}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Plus className="w-4 h-4 text-indigo-500" />
                                                Nuevo Campo para {agentName || 'el agente'}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">Crea datos que solo este agente se encargará de capturar.</p>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Nombre del nuevo dato (ej: RFC)..."
                                                    value={newFieldName}
                                                    onChange={e => setNewFieldName(e.target.value)}
                                                    className="h-10 text-sm bg-muted/10"
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Instrucciones para la IA..."
                                                        value={newFieldDesc}
                                                        onChange={e => setNewFieldDesc(e.target.value)}
                                                        className="h-10 text-xs flex-1 bg-muted/10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-10 px-4"
                                                        onClick={handleAddField}
                                                        disabled={!newFieldName.trim()}
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Añadir
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                                            <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                                    Campos a Crear
                                                </span>
                                                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                                                    {localFields.length}
                                                </Badge>
                                            </h4>
                                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                                {localFields.map((field, idx) => (
                                                    <div
                                                        key={`local-${idx}`}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-background shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                                <Tag className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold leading-none">{field.label}</p>
                                                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{field.description || 'Nuevo campo'}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                            onClick={() => removeLocalField(idx)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                {localFields.length === 0 && (
                                                    <div className="text-center py-6 px-4 bg-muted/5 rounded-lg border border-dashed border-indigo-500/20">
                                                        <p className="text-sm font-medium text-muted-foreground italic">No has definido campos nuevos</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                {/* Footer / Navigation */}
                <DialogFooter className="border-t p-4 bg-muted/10 shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={step === 1 ? () => setOpen(false) : handleBack}
                            disabled={isSubmitting}
                        >
                            {step === 1 ? t('common.cancel') : t('common.back')}
                        </Button>

                        <div className="flex gap-2">
                            {step < TOTAL_STEPS ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    size="sm"
                                    className="gap-2"
                                    disabled={step === 1 && !agentType}
                                >
                                    {t('common.next')}
                                    <ArrowRight className="w-3 h-3" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    size="sm"
                                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none min-w-[120px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            {t('agents.creating')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3 h-3" />
                                            {t('agents.create_agent')}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
