import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Loader2, UploadCloud, Sparkles, Image, Video, File, X, Save, BrainCircuit, CheckCircle2
} from 'lucide-react'

interface KnowledgeUploaderProps {
    agentId: string
    onSuccess?: () => void
    editingItem?: any
}

interface TempFile {
    type: string
    file_url: string
    file_name: string
    file_size: number
    mime_type: string
}

interface PreviewChunk {
    title: string
    content: string
    // for grouped: which TempFiles belong here
    files: TempFile[]
}

export function KnowledgeUploader({ agentId, onSuccess, editingItem }: KnowledgeUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [knowledgeText, setKnowledgeText] = useState("")
    const [tempFiles, setTempFiles] = useState<TempFile[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Preview state
    const [previewChunks, setPreviewChunks] = useState<PreviewChunk[]>([])
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        if (editingItem) {
            setKnowledgeText(editingItem.content || "")
            if (editingItem.file_url) {
                setTempFiles([{
                    type: editingItem.type,
                    file_url: editingItem.file_url,
                    file_name: editingItem.file_name || "Archivo adjunto",
                    file_size: editingItem.file_size || 0,
                    mime_type: editingItem.mime_type || ""
                }])
            } else {
                setTempFiles([])
            }
        }
    }, [editingItem])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        let successCount = 0

        const filesToProcess = editingItem ? [files[0]] : Array.from(files)

        for (const file of filesToProcess) {
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'knowledge')

                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                if (res.data.success) {
                    const type = file.type.startsWith('image/') ? 'image' :
                        file.type.startsWith('video/') ? 'video' :
                            file.type === 'application/pdf' ? 'pdf' : 'document'

                    const newFile: TempFile = {
                        type,
                        file_url: res.data.url,
                        file_name: file.name,
                        file_size: file.size,
                        mime_type: file.type
                    }

                    if (editingItem) {
                        setTempFiles([newFile])
                    } else {
                        setTempFiles(prev => [...prev, newFile])
                    }
                    successCount++
                }
            } catch (error) {
                console.error("Upload failed:", error)
            }
        }

        setIsUploading(false)
        if (successCount > 0) {
            toast.success(editingItem ? "Archivo actualizado" : `${successCount} archivo(s) adjuntado(s)`)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeFile = (index: number) => {
        setTempFiles(prev => prev.filter((_, i) => i !== index))
    }

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'image': return <Image className="w-3 h-3" />
            case 'video': return <Video className="w-3 h-3" />
            default: return <File className="w-3 h-3" />
        }
    }

    // Generate a title via AI using segment-knowledge endpoint
    const generateAITitle = async (content: string): Promise<string> => {
        try {
            const res = await api.post('/ai/segment-knowledge', { content })
            if (res.data.success && res.data.data?.length > 0) {
                return res.data.data[0].title || content.substring(0, 50)
            }
        } catch {
            // Fallback silently
        }
        return content.substring(0, 50)
    }

    // Determine processing mode and call the right endpoint
    const handleAnalyze = async () => {
        if (!knowledgeText.trim() && tempFiles.length === 0) return

        // Edit mode: generate AI title then save
        if (editingItem) {
            if (knowledgeText.trim()) {
                setIsProcessing(true)
                try {
                    const aiTitle = await generateAITitle(knowledgeText)
                    await saveDirectly(aiTitle)
                } finally {
                    setIsProcessing(false)
                }
            } else {
                await saveDirectly()
            }
            return
        }

        // Files-only (no text): save directly
        if (!knowledgeText.trim() && tempFiles.length > 0) {
            await saveDirectly()
            return
        }

        setIsProcessing(true)
        try {
            if (tempFiles.length > 0 && knowledgeText.trim()) {
                // Text + files → group them semantically
                const fileNames = tempFiles.map(f => f.file_name)
                const res = await api.post('/ai/group-knowledge', {
                    text: knowledgeText,
                    file_names: fileNames
                })
                if (res.data.success && res.data.data?.length > 0) {
                    // Map file_names back to actual TempFile objects
                    const chunks: PreviewChunk[] = res.data.data.map((chunk: any) => ({
                        title: chunk.title,
                        content: chunk.content,
                        files: (chunk.file_names as string[])
                            .map(name => tempFiles.find(f => f.file_name === name))
                            .filter(Boolean) as TempFile[]
                    }))
                    setPreviewChunks(chunks)
                    setShowPreview(true)
                } else {
                    await saveDirectly()
                }
            } else {
                // Text only → segment by topic
                const res = await api.post('/ai/segment-knowledge', { content: knowledgeText })
                if (res.data.success && res.data.data?.length > 0) {
                    const chunks: PreviewChunk[] = res.data.data.map((chunk: any) => ({
                        title: chunk.title,
                        content: chunk.content,
                        files: []
                    }))
                    setPreviewChunks(chunks)
                    setShowPreview(true)
                } else {
                    await saveDirectly()
                }
            }
        } catch {
            toast.error("No se pudo analizar, guardando como bloque único")
            await saveDirectly()
        } finally {
            setIsProcessing(false)
        }
    }

    const saveDirectly = async (aiTitle?: string) => {
        setIsUploading(true)
        try {
            if (editingItem) {
                const file = tempFiles[0]
                const payload: any = {
                    title: aiTitle || knowledgeText.substring(0, 50) || (file ? file.file_name : "Sin título"),
                    content: knowledgeText,
                }
                if (file) {
                    payload.file_url = file.file_url
                    payload.file_name = file.file_name
                    payload.file_size = file.file_size
                    payload.mime_type = file.mime_type
                    payload.type = file.type
                } else {
                    payload.file_url = null
                    payload.file_name = null
                    payload.file_size = null
                    payload.mime_type = null
                    payload.type = 'text'
                }
                await api.patch(`/knowledge/${editingItem.id}`, payload)
                toast.success("Conocimiento actualizado")
            } else if (tempFiles.length > 0) {
                for (const file of tempFiles) {
                    await api.post('/ai/knowledge/upload', {
                        agent_id: agentId,
                        type: file.type,
                        content: knowledgeText,
                        title: knowledgeText.substring(0, 50) || file.file_name,
                        file_url: file.file_url,
                        file_name: file.file_name,
                        file_size: file.file_size,
                        mime_type: file.mime_type,
                        source: 'manual'
                    })
                }
                toast.success("✨ Conocimiento memorizado")
            } else {
                await api.post('/ai/knowledge/upload', {
                    agent_id: agentId,
                    type: 'text',
                    content: knowledgeText,
                    title: knowledgeText.substring(0, 50),
                    source: 'manual'
                })
                toast.success("✨ Conocimiento memorizado")
            }
            resetForm()
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar")
        } finally {
            setIsUploading(false)
        }
    }

    const confirmPreview = async () => {
        if (previewChunks.length === 0) return
        setIsUploading(true)
        try {
            for (const chunk of previewChunks) {
                if (chunk.files.length > 0) {
                    // Save each file with the chunk's contextual text
                    for (const file of chunk.files) {
                        await api.post('/ai/knowledge/upload', {
                            agent_id: agentId,
                            type: file.type,
                            content: chunk.content,
                            title: chunk.title,
                            file_url: file.file_url,
                            file_name: file.file_name,
                            file_size: file.file_size,
                            mime_type: file.mime_type,
                            source: 'manual'
                        })
                    }
                    // If chunk also has text beyond the file, save a companion text item
                    if (chunk.content.trim() && chunk.files.length > 0) {
                        // the text is already stored as content of the file item above — no duplicate needed
                    }
                } else if (chunk.content.trim()) {
                    await api.post('/ai/knowledge/upload', {
                        agent_id: agentId,
                        type: 'text',
                        content: chunk.content,
                        title: chunk.title,
                        source: 'manual'
                    })
                }
            }
            const count = previewChunks.length
            toast.success(`✨ ${count} ${count === 1 ? 'memoria guardada' : 'memorias guardadas'}`)
            resetForm()
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar")
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setKnowledgeText("")
        setTempFiles([])
        setPreviewChunks([])
        setShowPreview(false)
    }

    const isAnalyzeMode = !editingItem && (knowledgeText.trim().length > 0)
    const buttonLabel = editingItem ? "Guardar Cambios" : (isAnalyzeMode ? "Analizar" : "Memorizar")
    const buttonIcon = editingItem ? <Save className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />

    return (
        <div className="flex flex-col h-full gap-3">
            {/* Textarea with attached files */}
            <div className="relative flex-1 flex flex-col min-h-0">
                <Textarea
                    placeholder={editingItem
                        ? "Edita el contenido del conocimiento..."
                        : "Escribe aquí lo que tu agente debe saber. Puedes mezclar temas — la IA los separará automáticamente.\n\nEj: 'Horario 9-6. Envíos tardan 3 días. Sin devoluciones.'"
                    }
                    className="flex-1 min-h-[160px] resize-none pr-4 pb-12"
                    value={knowledgeText}
                    onChange={(e) => setKnowledgeText(e.target.value)}
                />

                {tempFiles.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
                        {tempFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-md text-xs shadow-sm"
                            >
                                <div className="bg-emerald-100 text-emerald-600 rounded-sm p-0.5">
                                    {getFileIcon(file.type)}
                                </div>
                                <span className="truncate max-w-[120px] font-medium">{file.file_name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chunks preview */}
            {showPreview && (
                <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 bg-indigo-50/50 dark:bg-indigo-950/30 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                            <BrainCircuit className="w-3.5 h-3.5" />
                            {tempFiles.length > 0
                                ? `${previewChunks.length} grupos detectados`
                                : `${previewChunks.length} temas detectados`}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowPreview(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {previewChunks.map((chunk, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 border rounded-lg p-2.5 group">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <input
                                            className="w-full text-xs font-semibold bg-transparent border-none outline-none text-indigo-700 dark:text-indigo-300"
                                            value={chunk.title}
                                            onChange={e => setPreviewChunks(prev =>
                                                prev.map((c, i) => i === idx ? { ...c, title: e.target.value } : c)
                                            )}
                                        />
                                        {chunk.content && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                                {chunk.content}
                                            </p>
                                        )}
                                        {chunk.files.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {chunk.files.map((f, fi) => (
                                                    <span key={fi} className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                        {getFileIcon(f.type)}
                                                        {f.file_name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewChunks(prev => prev.filter((_, i) => i !== idx))}
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
                        onClick={confirmPreview}
                        disabled={isUploading || previewChunks.length === 0}
                        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                    >
                        {isUploading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        }
                        Guardar {previewChunks.length} {previewChunks.length === 1 ? 'memoria' : 'memorias'}
                    </Button>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isProcessing}
                >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {editingItem ? "Reemplazar" : "Adjuntar"}
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={!editingItem}
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <Button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isUploading || isProcessing || (!knowledgeText.trim() && tempFiles.length === 0)}
                    className="flex-[2]"
                >
                    {(isUploading || isProcessing) ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            {isProcessing ? 'Analizando...' : 'Guardando...'}
                        </>
                    ) : (
                        <>{buttonIcon}{buttonLabel}</>
                    )}
                </Button>
            </div>
        </div>
    )
}
