import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { FlowEditor } from '@/features/flows/flow-editor'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { Node, Edge } from '@xyflow/react'
import { TriggerType } from '@/features/flows/types/flow-types'

// Types matching the new backend model
interface FlowNode {
    id: string
    type: string
    position: { x: number; y: number }
    data: {
        label: string
        description?: string
        triggerType?: string
        config?: Record<string, any>
        nodeConfig?: Record<string, any>
        inputVariables?: string[]
        outputVariables?: any[]
        timeout?: number
        retryCount?: number
        retryDelay?: number
        continueOnError?: boolean
        notes?: string
    }
    width?: number
    height?: number
    selected?: boolean
    dragging?: boolean
}

interface FlowEdge {
    id: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
    type?: string
    animated?: boolean
    style?: Record<string, any>
    label?: string
    condition?: {
        field: string
        operator: string
        value: any
    }
}

interface FlowVariable {
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'json'
    value?: any
    description?: string
    source?: string
    isSecret?: boolean
}

interface FlowPayload {
    name: string
    description: string
    trigger_type: string
    trigger_config: Record<string, any>
    status: string
    nodes: FlowNode[]
    edges: FlowEdge[]
    variables?: FlowVariable[]
    settings?: Record<string, any>
    viewport?: { x: number; y: number; zoom: number }
}

interface FlowData {
    id?: string
    name: string
    description: string
    trigger_type?: string
    trigger?: string // Legacy support
    trigger_config?: Record<string, any>
    trigger_value?: string // Legacy support
    status: string
    nodes?: FlowNode[] | Record<string, FlowNode>
    edges?: FlowEdge[] | Record<string, FlowEdge>
    variables?: FlowVariable[]
    settings?: Record<string, any>
    viewport?: { x: number; y: number; zoom: number }
    execution_count?: number
    success_count?: number
    failure_count?: number
}

export const Route = createFileRoute('/_authenticated/flows/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const [refreshKey, setRefreshKey] = useState(0)
    const [showEditor, setShowEditor] = useState(false)
    const [editingFlow, setEditingFlow] = useState<FlowData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleAction = async (action: string, row: FlowData) => {
        if (action === 'edit' || action === 'view') {
            // Fetch the full flow data including nodes and edges
            setIsLoading(true)
            try {
                const response = await api.get(`/data/flows/me/${row.id}`)
                const fullFlow = response.data?.data || response.data
                console.log('Loaded full flow:', fullFlow)
                setEditingFlow(fullFlow)
                setShowEditor(true)
            } catch (error) {
                console.error('Error loading flow:', error)
                toast.error(t('common.error'))
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleCreateNew = () => {
        setEditingFlow(null)
        setShowEditor(true)
    }

    // Convert React Flow nodes to API format
    const convertNodesToAPIFormat = (nodes: Node[]): FlowNode[] => {
        return nodes.map(node => ({
            id: node.id,
            type: node.type || 'message',
            position: {
                x: node.position.x,
                y: node.position.y,
            },
            data: {
                label: (node.data as any).label || '',
                description: (node.data as any).description,
                triggerType: (node.data as any).triggerType,
                config: (node.data as any).config,
                nodeConfig: (node.data as any).nodeConfig,
                inputVariables: (node.data as any).inputVariables,
                outputVariables: (node.data as any).outputVariables,
                timeout: (node.data as any).timeout,
                retryCount: (node.data as any).retryCount,
                retryDelay: (node.data as any).retryDelay,
                continueOnError: (node.data as any).continueOnError,
                notes: (node.data as any).notes,
            },
            width: node.measured?.width,
            height: node.measured?.height,
        }))
    }

    // Convert React Flow edges to API format
    const convertEdgesToAPIFormat = (edges: Edge[]): FlowEdge[] => {
        return edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined,
            type: edge.type,
            animated: edge.animated,
            style: edge.style as Record<string, any>,
            label: typeof edge.label === 'string' ? edge.label : undefined,
        }))
    }

    const handleSaveFlow = useCallback(async (data: {
        name: string
        description: string
        triggerType: string
        triggerConfig: Record<string, any>
        nodes: Node[]
        edges: Edge[]
        variables?: FlowVariable[]
        viewport?: { x: number; y: number; zoom: number }
    }) => {
        try {
            const payload: FlowPayload = {
                name: data.name,
                description: data.description,
                trigger_type: data.triggerType,
                trigger_config: data.triggerConfig || {},
                status: 'draft',
                nodes: convertNodesToAPIFormat(data.nodes),
                edges: convertEdgesToAPIFormat(data.edges),
                variables: data.variables || [],
                viewport: data.viewport,
            }

            console.log('Saving flow payload:', payload)

            if (editingFlow?.id) {
                // Update existing flow
                await api.patch(`/data/flows/me/${editingFlow.id}`, payload)
                toast.success(t('flows.flow_updated'))
            } else {
                // Create new flow
                await api.post('/data/flows/me', payload)
                toast.success(t('flows.flow_created'))
            }

            setShowEditor(false)
            setEditingFlow(null)
            handleRefresh()
        } catch (error) {
            console.error('Error saving flow:', error)
            toast.error(t('common.error'))
        }
    }, [editingFlow, t])

    const handleCloseEditor = () => {
        setShowEditor(false)
        setEditingFlow(null)
    }

    // Parse nodes and edges from flow data (handles both array and object formats)
    const parseNodesFromFlow = (flow: FlowData | null): Node[] | undefined => {
        if (!flow?.nodes) return undefined

        // If it's already an array, convert to React Flow format
        if (Array.isArray(flow.nodes)) {
            return flow.nodes.map(node => ({
                id: node.id,
                type: node.type,
                position: node.position,
                data: node.data,
            }))
        }

        // If it's an object (legacy format), convert to array
        return Object.values(flow.nodes).map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
        }))
    }

    const parseEdgesFromFlow = (flow: FlowData | null): Edge[] | undefined => {
        if (!flow?.edges) return undefined

        // If it's already an array, convert to React Flow format
        if (Array.isArray(flow.edges)) {
            return flow.edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                type: edge.type,
                animated: edge.animated,
                style: edge.style,
                label: edge.label,
            }))
        }

        // If it's an object (legacy format), convert to array
        return Object.values(flow.edges).map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type,
            animated: edge.animated,
            style: edge.style,
            label: edge.label,
        }))
    }

    // Show editor in full screen mode
    if (showEditor) {
        return (
            <div className="fixed inset-0 z-50 bg-background">
                <FlowEditor
                    flowId={editingFlow?.id}
                    flowName={editingFlow?.name}
                    flowDescription={editingFlow?.description}
                    initialTriggerType={(editingFlow?.trigger_type || editingFlow?.trigger || 'keyword') as TriggerType}
                    initialTriggerConfig={
                        editingFlow?.trigger_config ||
                        (editingFlow?.trigger_value ? { value: editingFlow.trigger_value } : {})
                    }
                    initialNodes={parseNodesFromFlow(editingFlow)}
                    initialEdges={parseEdgesFromFlow(editingFlow)}
                    initialVariables={editingFlow?.variables as FlowVariable[]}
                    onSave={handleSaveFlow}
                    onClose={handleCloseEditor}
                />
            </div>
        )
    }

    return (
        <div className='flex flex-col h-full p-8 gap-4 overflow-hidden relative'>
            {/* Loading overlay - fixed to cover entire screen including sidebar */}
            {isLoading && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground font-medium">{t('common.loading')}</span>
                    </div>
                </div>
            )}

            <div className='flex items-center justify-between shrink-0'>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>{t('flows.title')}</h1>
                    <p className='text-muted-foreground mt-1'>
                        {t('flows.description')}
                    </p>
                </div>
                <Button onClick={handleCreateNew} size="lg" disabled={isLoading}>
                    <Plus className="w-5 h-5 mr-2" />
                    {t('flows.create_flow')}
                </Button>
            </div>
            <div className='flex-1 min-h-0'>
                <DynamicTable
                    model="flows"
                    endpoint="/data/flows/me"
                    refreshTrigger={refreshKey}
                    onAction={handleAction}
                />
            </div>
        </div>
    )
}
