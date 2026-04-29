import { memo } from 'react'
import {
    type Node
} from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Settings, X, Braces } from 'lucide-react'
import { VariableEditor, VariableManager } from './variable-editor'
import { TemplateEditor } from './template-editor'
import { type FlowNodeData } from '../nodes/flow-nodes'

interface FlowPropertiesSidebarProps {
    selectedNode: Node | null
    updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void
    deleteSelectedNode: () => void
    onClose: () => void
}

export const FlowPropertiesSidebar = memo(function FlowPropertiesSidebar({
    selectedNode,
    updateNodeData,
    deleteSelectedNode,
    onClose
}: FlowPropertiesSidebarProps) {
    if (!selectedNode) return null

    return (
        <div className="w-80 bg-card border-l border-border flex flex-col h-full overflow-hidden shadow-xl z-10">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card z-20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Propiedades
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 min-h-0 relative bg-card/50">
                <ScrollArea className="h-full w-full">
                    <div className="p-4 space-y-6 pb-20">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Etiqueta</Label>
                                <Input
                                    value={(selectedNode.data as unknown as FlowNodeData).label || ''}
                                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={(selectedNode.data as unknown as FlowNodeData).description || ''}
                                    onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Node Configuration */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Configuración
                            </h4>

                            {/* Message Node */}
                            {selectedNode.type === 'message' && (
                                <TemplateEditor
                                    label="Mensaje"
                                    value={(selectedNode.data as unknown as FlowNodeData).config?.message || ''}
                                    onChange={(value) => updateNodeData(selectedNode.id, {
                                        config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), message: value }
                                    })}
                                />
                            )}

                            {/* Set Variable Node */}
                            {selectedNode.type === 'set_variable' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Nombre de Variable</Label>
                                        <Input
                                            value={(selectedNode.data as unknown as FlowNodeData).config?.variableName || ''}
                                            onChange={(e) => updateNodeData(selectedNode.id, {
                                                config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), variableName: e.target.value }
                                            })}
                                            placeholder="Ej: client_name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <VariableEditor
                                            label="Valor"
                                            value={(selectedNode.data as unknown as FlowNodeData).config?.value || ''}
                                            onChange={(value) => updateNodeData(selectedNode.id, {
                                                config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), value }
                                            })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Condition Node */}
                            {selectedNode.type === 'condition' && (
                                <div className="space-y-2">
                                    <Label>Condición (Expresión)</Label>
                                    <VariableEditor
                                        value={(selectedNode.data as unknown as FlowNodeData).config?.condition || ''}
                                        onChange={(value) => updateNodeData(selectedNode.id, {
                                            config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), condition: value }
                                        })}
                                        placeholder="Ej: {{variable}} == 'valor'"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Usa <code className="bg-muted px-1 rounded">true</code> para el camino verde y <code className="bg-muted px-1 rounded">false</code> para el rojo.
                                    </p>
                                </div>
                            )}

                            {/* Delay Node */}
                            {selectedNode.type === 'delay' && (
                                <div className="space-y-2">
                                    <Label>Tiempo de espera (segundos)</Label>
                                    <Input
                                        type="number"
                                        value={(selectedNode.data as unknown as FlowNodeData).config?.seconds || 5}
                                        onChange={(e) => updateNodeData(selectedNode.id, {
                                            config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), seconds: parseInt(e.target.value) }
                                        })}
                                    />
                                </div>
                            )}

                            {/* HTTP Request Node */}
                            {selectedNode.type === 'http_request' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Método</Label>
                                        <Select
                                            value={(selectedNode.data as unknown as FlowNodeData).config?.method || 'GET'}
                                            onValueChange={(value) => updateNodeData(selectedNode.id, {
                                                config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), method: value }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GET">GET</SelectItem>
                                                <SelectItem value="POST">POST</SelectItem>
                                                <SelectItem value="PUT">PUT</SelectItem>
                                                <SelectItem value="DELETE">DELETE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>URL</Label>
                                        <VariableEditor
                                            value={(selectedNode.data as unknown as FlowNodeData).config?.url || ''}
                                            onChange={(value) => updateNodeData(selectedNode.id, {
                                                config: { ...((selectedNode.data as unknown as FlowNodeData).config || {}), url: value }
                                            })}
                                            placeholder="https://api.example.com/..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <Separator />

                        {/* Local Variables Management */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Braces className="w-4 h-4 text-muted-foreground" />
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Variables Generadas
                                </h4>
                            </div>
                            <VariableManager
                                variables={(selectedNode.data as unknown as FlowNodeData).variables || []}
                                onChange={(variables) => updateNodeData(selectedNode.id, { variables })}
                            />
                        </div>
                    </div>
                </ScrollArea>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 shrink-0 z-20">
                <Button variant="destructive" onClick={deleteSelectedNode} className="w-full">
                    Eliminar Nodo
                </Button>
            </div>
        </div>
    )
})
