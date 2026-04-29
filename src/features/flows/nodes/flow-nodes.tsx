import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
    Zap, MessageSquare, GitBranch, Play, Bot, Clock, Mail, Globe,
    Code, Filter, Split, Merge, AlertTriangle, Database, Repeat, Settings,
    Sparkles, BarChart, FileCode
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRIGGER_CONFIGS, TRIGGER_ICONS } from '../types/trigger-configs'

// Node type definitions (imported from flow-types.ts)
export type { FlowNodeData } from '../types/flow-types'

// Import FlowNodeType from flow-types
import { FlowNodeType } from '../types/flow-types'

// Icon mapping
const nodeIcons: Record<FlowNodeType, React.ReactNode> = {
    // Triggers
    trigger: <Zap className="w-4 h-4" />,

    // Actions
    message: <MessageSquare className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    http_request: <Globe className="w-4 h-4" />,
    set_variable: <Code className="w-4 h-4" />,
    transform_data: <Settings className="w-4 h-4" />,
    wait: <Clock className="w-4 h-4" />,

    // Logic
    condition: <GitBranch className="w-4 h-4" />,
    switch: <GitBranch className="w-4 h-4" />,
    loop: <Repeat className="w-4 h-4" />,
    filter: <Filter className="w-4 h-4" />,

    // AI
    ai_chat: <Bot className="w-4 h-4" />,
    ai_analyze: <BarChart className="w-4 h-4" />,
    ai_generate: <Sparkles className="w-4 h-4" />,

    // Integration
    database: <Database className="w-4 h-4" />,
    webhook: <Globe className="w-4 h-4" />,
    api_call: <Globe className="w-4 h-4" />,

    // Utilities
    delay: <Clock className="w-4 h-4" />,
    split: <Split className="w-4 h-4" />,
    merge: <Merge className="w-4 h-4" />,
    error_handler: <AlertTriangle className="w-4 h-4" />,
}

// Base node component
function BaseNode({
    data,
    selected,
    nodeType
}: NodeProps & { nodeType: FlowNodeType }) {
    const isLogicNode = ['condition', 'switch', 'filter'].includes(nodeType)
    const isTrigger = nodeType === 'trigger'
    const hasMultipleOutputs = ['switch', 'split'].includes(nodeType)

    // Cast data to any to avoid type issues with dynamic properties
    const nodeData = data as any

    // Determine icon
    let icon = nodeIcons[nodeType]

    if (isTrigger && nodeData.triggerType) {
        try {
            const config = TRIGGER_CONFIGS[nodeData.triggerType as keyof typeof TRIGGER_CONFIGS]
            if (config && config.icon) {
                const IconComponent = TRIGGER_ICONS[config.icon as keyof typeof TRIGGER_ICONS]
                if (IconComponent) {
                    icon = <IconComponent className="w-4 h-4" />
                }
            }
        } catch (e) {
            console.warn('Error rendering trigger icon:', e)
            // Fallback to default icon is already set
        }
    }

    // Determine class for background color
    const nodeClass = isTrigger && nodeData.triggerType
        ? `flow-node-trigger-${nodeData.triggerType}`
        : `flow-node-${nodeType}`

    return (
        <div className={cn(
            'flow-node',
            nodeClass,
            selected && 'selected'
        )}>
            {/* Input handle on left (not for trigger) */}
            {!isTrigger && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!bg-white/80"
                    isConnectable={true}
                />
            )}

            {/* Node content */}
            <div className="flow-node-header">
                <span className="flow-node-icon">{icon}</span>
                <span>{String(nodeData.label)}</span>
            </div>

            {nodeData.description && (
                <div className="flow-node-content">
                    {String(nodeData.description)}
                </div>
            )}

            {/* Show output variables indicator */}
            {nodeData.outputVariables && Array.isArray(nodeData.outputVariables) && nodeData.outputVariables.length > 0 && (
                <div className="flow-node-variables">
                    <FileCode className="w-3 h-3 opacity-60" />
                    <span className="text-xs opacity-75">
                        {nodeData.outputVariables.length} var{nodeData.outputVariables.length > 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Output handles */}
            {!isLogicNode && !hasMultipleOutputs && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-white/80"
                    isConnectable={true}
                />
            )}

            {/* Condition node has two outputs (yes/no) */}
            {(nodeType === 'condition' || nodeType === 'filter') && (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="true"
                        style={{ top: '35%' }}
                        className="!bg-green-400"
                        isConnectable={true}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="false"
                        style={{ top: '65%' }}
                        className="!bg-red-400"
                        isConnectable={true}
                    />
                </>
            )}

            {/* Switch node has multiple outputs */}
            {nodeType === 'switch' && (
                <>
                    {[0, 1, 2, 3].map((index) => (
                        <Handle
                            key={index}
                            type="source"
                            position={Position.Right}
                            id={`case-${index}`}
                            style={{ top: `${20 + index * 20}%` }}
                            className="!bg-blue-400"
                            isConnectable={true}
                        />
                    ))}
                </>
            )}

            {/* Split node has multiple outputs */}
            {nodeType === 'split' && (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="output-1"
                        style={{ top: '35%' }}
                        className="!bg-purple-400"
                        isConnectable={true}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="output-2"
                        style={{ top: '65%' }}
                        className="!bg-purple-400"
                        isConnectable={true}
                    />
                </>
            )}

            {/* Merge node has multiple inputs */}
            {nodeType === 'merge' && (
                <>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="input-1"
                        style={{ top: '35%' }}
                        className="!bg-orange-400"
                        isConnectable={true}
                    />
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="input-2"
                        style={{ top: '65%' }}
                        className="!bg-orange-400"
                        isConnectable={true}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="!bg-white/80"
                        isConnectable={true}
                    />
                </>
            )}
        </div>
    )
}

// Generate all node components
export const TriggerNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="trigger" />)
TriggerNode.displayName = 'TriggerNode'

export const MessageNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="message" />)
MessageNode.displayName = 'MessageNode'

export const EmailNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="email" />)
EmailNode.displayName = 'EmailNode'

export const HttpRequestNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="http_request" />)
HttpRequestNode.displayName = 'HttpRequestNode'

export const SetVariableNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="set_variable" />)
SetVariableNode.displayName = 'SetVariableNode'

export const TransformDataNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="transform_data" />)
TransformDataNode.displayName = 'TransformDataNode'

export const WaitNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="wait" />)
WaitNode.displayName = 'WaitNode'

export const ConditionNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="condition" />)
ConditionNode.displayName = 'ConditionNode'

export const SwitchNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="switch" />)
SwitchNode.displayName = 'SwitchNode'

export const LoopNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="loop" />)
LoopNode.displayName = 'LoopNode'

export const FilterNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="filter" />)
FilterNode.displayName = 'FilterNode'

export const AIChatNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="ai_chat" />)
AIChatNode.displayName = 'AIChatNode'

export const AIAnalyzeNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="ai_analyze" />)
AIAnalyzeNode.displayName = 'AIAnalyzeNode'

export const AIGenerateNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="ai_generate" />)
AIGenerateNode.displayName = 'AIGenerateNode'

export const DatabaseNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="database" />)
DatabaseNode.displayName = 'DatabaseNode'

export const WebhookNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="webhook" />)
WebhookNode.displayName = 'WebhookNode'

export const APICallNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="api_call" />)
APICallNode.displayName = 'APICallNode'

export const DelayNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="delay" />)
DelayNode.displayName = 'DelayNode'

export const SplitNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="split" />)
SplitNode.displayName = 'SplitNode'

export const MergeNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="merge" />)
MergeNode.displayName = 'MergeNode'

export const ErrorHandlerNode = memo((props: NodeProps) => <BaseNode {...props} nodeType="error_handler" />)
ErrorHandlerNode.displayName = 'ErrorHandlerNode'

// Export all node types for registration
export const nodeTypes = {
    trigger: TriggerNode,
    message: MessageNode,
    email: EmailNode,
    http_request: HttpRequestNode,
    set_variable: SetVariableNode,
    transform_data: TransformDataNode,
    wait: WaitNode,
    condition: ConditionNode,
    switch: SwitchNode,
    loop: LoopNode,
    filter: FilterNode,
    ai_chat: AIChatNode,
    ai_analyze: AIAnalyzeNode,
    ai_generate: AIGenerateNode,
    database: DatabaseNode,
    webhook: WebhookNode,
    api_call: APICallNode,
    delay: DelayNode,
    split: SplitNode,
    merge: MergeNode,
    error_handler: ErrorHandlerNode,
}

// Node palette items for sidebar - organized by category
export const nodePaletteItems = [
    // Actions
    {
        type: 'message' as const,
        label: 'Mensaje',
        description: 'Enviar mensaje',
        icon: MessageSquare,
        color: 'bg-blue-500',
        category: 'actions',
    },
    {
        type: 'email' as const,
        label: 'Email',
        description: 'Enviar email',
        icon: Mail,
        color: 'bg-sky-500',
        category: 'actions',
    },
    {
        type: 'set_variable' as const,
        label: 'Establecer Variable',
        description: 'Definir variable',
        icon: Code,
        color: 'bg-cyan-500',
        category: 'actions',
    },
    {
        type: 'transform_data' as const,
        label: 'Transformar Datos',
        description: 'Modificar datos',
        icon: Settings,
        color: 'bg-teal-500',
        category: 'actions',
    },

    // Logic
    {
        type: 'condition' as const,
        label: 'Condición',
        description: 'Si/Entonces',
        icon: GitBranch,
        color: 'bg-purple-500',
        category: 'logic',
    },
    {
        type: 'switch' as const,
        label: 'Switch',
        description: 'Múltiples casos',
        icon: GitBranch,
        color: 'bg-violet-500',
        category: 'logic',
    },
    {
        type: 'filter' as const,
        label: 'Filtro',
        description: 'Filtrar datos',
        icon: Filter,
        color: 'bg-fuchsia-500',
        category: 'logic',
    },
    {
        type: 'loop' as const,
        label: 'Bucle',
        description: 'Repetir acción',
        icon: Repeat,
        color: 'bg-pink-500',
        category: 'logic',
    },

    // AI
    {
        type: 'ai_chat' as const,
        label: 'Chat IA',
        description: 'Conversar con IA',
        icon: Bot,
        color: 'bg-indigo-500',
        category: 'ai',
    },
    {
        type: 'ai_analyze' as const,
        label: 'Analizar IA',
        description: 'Analizar texto',
        icon: BarChart,
        color: 'bg-blue-600',
        category: 'ai',
    },
    {
        type: 'ai_generate' as const,
        label: 'Generar IA',
        description: 'Generar contenido',
        icon: Sparkles,
        color: 'bg-purple-600',
        category: 'ai',
    },

    // Integration
    {
        type: 'http_request' as const,
        label: 'HTTP Request',
        description: 'Llamada HTTP',
        icon: Globe,
        color: 'bg-green-500',
        category: 'integration',
    },
    {
        type: 'database' as const,
        label: 'Base de Datos',
        description: 'Consulta DB',
        icon: Database,
        color: 'bg-emerald-500',
        category: 'integration',
    },
    {
        type: 'webhook' as const,
        label: 'Webhook',
        description: 'Enviar webhook',
        icon: Globe,
        color: 'bg-lime-500',
        category: 'integration',
    },

    // Utilities
    {
        type: 'delay' as const,
        label: 'Espera',
        description: 'Pausar X segundos',
        icon: Clock,
        color: 'bg-slate-500',
        category: 'utilities',
    },
    {
        type: 'split' as const,
        label: 'Dividir',
        description: 'Dividir flujo',
        icon: Split,
        color: 'bg-gray-500',
        category: 'utilities',
    },
    {
        type: 'merge' as const,
        label: 'Combinar',
        description: 'Unir flujos',
        icon: Merge,
        color: 'bg-zinc-500',
        category: 'utilities',
    },
    {
        type: 'error_handler' as const,
        label: 'Manejo de Errores',
        description: 'Capturar errores',
        icon: AlertTriangle,
        color: 'bg-red-500',
        category: 'utilities',
    },
]

export const nodeCategories = [
    { id: 'actions', label: 'Acciones', icon: Play },
    { id: 'logic', label: 'Lógica', icon: GitBranch },
    { id: 'ai', label: 'Inteligencia Artificial', icon: Bot },
    { id: 'integration', label: 'Integraciones', icon: Globe },
    { id: 'utilities', label: 'Utilidades', icon: Settings },
]
