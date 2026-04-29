import { api } from '@/lib/api'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import {
    Loader2, Bot, Brain, FileText, Image, Video, File,
    Eye, ExternalLink, Sparkles, ZoomIn, Zap
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn, getImageUrl } from '@/lib/utils'

interface KnowledgeItem {
    id: string
    type: string
    content?: string
    title?: string
    file_url?: string
    file_name?: string
    created_at: string
}

interface ViewAgentDialogProps {
    agent: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewAgentDialog({ agent, open, onOpenChange }: ViewAgentDialogProps) {
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
    const [loadingKnowledge, setLoadingKnowledge] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [previewItem, setPreviewItem] = useState<KnowledgeItem | null>(null)
    const [tools, setTools] = useState<any[]>([])

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
                setTools(response.data.data || [])
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

    const renderPreview = (item: KnowledgeItem) => {
        if (item.type === 'image' && item.file_url) {
            return (
                <img
                    src={getImageUrl(item.file_url)}
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
                    className="sm:max-w-[700px] max-h-[90vh] p-0 gap-0 overflow-hidden"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">
                                    Detalles del Agente
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    Información de <span className="font-medium text-foreground">{agent?.name}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-3 h-11">
                                <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-background">
                                    <Bot className="h-4 w-4" />
                                    General
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
                                    {tools.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                            {tools.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* General Tab */}
                        <TabsContent value="general" className="mt-0 flex-1">
                            <ScrollArea className="h-[calc(90vh-280px)]">
                                <div className="px-6 py-4 space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight">{agent?.name}</h2>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Descripción / Rol</h4>
                                        <p className="text-sm leading-relaxed text-foreground/90">
                                            {agent?.description || "Sin descripción"}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                            Instrucciones del Sistema
                                        </h4>
                                        <div className="pl-3 border-l-2 border-primary/20">
                                            <p className="whitespace-pre-wrap leading-relaxed font-mono text-xs text-muted-foreground">
                                                {agent?.system_prompt || "Sin instrucciones definidas"}
                                            </p>
                                        </div>
                                    </div>


                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Knowledge Tab */}
                        <TabsContent value="knowledge" className="mt-0 flex-1">
                            <ScrollArea className="h-[calc(90vh-280px)]">
                                <div className="px-6 py-4 space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Brain className="h-5 w-5 text-purple-500" />
                                        <h4 className="font-semibold">Base de Conocimiento</h4>
                                    </div>

                                    {loadingKnowledge ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <p className="text-sm">Cargando...</p>
                                        </div>
                                    ) : knowledgeItems.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed rounded-xl">
                                            <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="text-sm font-medium text-muted-foreground">Sin conocimiento</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {knowledgeItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="group flex items-center gap-3 p-3 bg-card border rounded-xl hover:shadow-sm hover:border-primary/20 transition-all"
                                                >
                                                    <div
                                                        className="cursor-pointer flex-shrink-0"
                                                        onClick={() => (item.file_url || item.content) && setPreviewItem(item)}
                                                    >
                                                        {renderPreview(item)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {item.title || item.file_name || 'Sin título'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.content?.slice(0, 80) || item.file_name || item.type}
                                                            {item.content && item.content.length > 80 && '...'}
                                                        </p>
                                                    </div>

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
                                                                href={getImageUrl(item.file_url)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Tools Tab */}
                        <TabsContent value="tools" className="mt-0 flex-1">
                            <ScrollArea className="h-[calc(90vh-280px)]">
                                <div className="px-6 py-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap className="h-5 w-5 text-amber-500" />
                                        <h4 className="font-semibold">Herramientas Asociadas</h4>
                                    </div>

                                    {tools.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed rounded-xl">
                                            <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="text-sm font-medium text-muted-foreground">Sin herramientas asociadas</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {tools.map((tool) => (
                                                <div key={tool.id} className="p-4 border rounded-xl flex items-start gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                        <Zap className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium">{tool.name}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                                                        {tool.config && Object.keys(tool.config).length > 0 && (
                                                            <div className="mt-2 text-xs bg-muted p-2 rounded">
                                                                <span className="font-mono opacity-70">Config: </span>
                                                                {JSON.stringify(tool.config)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
                        <Button type="button" onClick={() => onOpenChange(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] p-0 flex flex-col">
                    <div className="px-6 py-4 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <ZoomIn className="h-5 w-5 shrink-0" />
                            <span className="truncate">{previewItem?.title || previewItem?.file_name || 'Vista previa'}</span>
                        </DialogTitle>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {previewItem?.type === 'image' && previewItem.file_url && (
                            <img
                                src={getImageUrl(previewItem.file_url)}
                                alt={previewItem.title || 'Preview'}
                                className="w-full object-contain rounded-lg bg-muted/50"
                            />
                        )}
                        {previewItem?.type === 'video' && previewItem.file_url && (
                            <video
                                src={getImageUrl(previewItem.file_url)}
                                controls
                                className="w-full rounded-lg"
                            />
                        )}
                        {previewItem?.type === 'pdf' && previewItem.file_url && (
                            <iframe
                                src={getImageUrl(previewItem.file_url)}
                                className="w-full h-full min-h-[50vh] rounded-lg border"
                            />
                        )}
                        {previewItem?.content && (
                            <div className={cn("mt-4", previewItem.file_url ? "" : "pt-0")}>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Contenido
                                </h4>
                                <div className="pl-3 border-l-2 border-primary/20">
                                    <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-mono text-xs">
                                        {previewItem.content}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
                        {previewItem?.file_url && (
                            <Button variant="outline" asChild>
                                <a href={getImageUrl(previewItem.file_url)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir
                                </a>
                            </Button>
                        )}
                        <Button onClick={() => setPreviewItem(null)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
