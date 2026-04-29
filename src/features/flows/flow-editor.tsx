import { useState, useCallback, useRef, useMemo } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    type Connection,
    type Edge,
    type Node,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react'
import { nodeTypes, nodePaletteItems, type FlowNodeData } from './nodes/flow-nodes'
import { TRIGGER_CONFIGS } from './types/trigger-configs'
import { TriggerType, FlowVariable } from './types/flow-types'
import './flow-editor.css'
import { FlowPaletteSidebar } from './components/flow-palette-sidebar'
import { FlowPropertiesSidebar } from './components/flow-properties-sidebar'

interface FlowEditorProps {
    flowId?: string
    initialNodes?: Node[]
    initialEdges?: Edge[]
    flowName?: string
    flowDescription?: string
    initialTriggerType?: TriggerType
    initialTriggerConfig?: Record<string, any>
    initialVariables?: FlowVariable[]
    onSave?: (data: {
        name: string
        description: string
        triggerType: TriggerType
        triggerConfig: Record<string, any>
        nodes: Node[]
        edges: Edge[]
        variables?: FlowVariable[]
        viewport?: { x: number; y: number; zoom: number }
    }) => void
    onClose?: () => void
}

// Initial nodes for a new flow
const defaultNodes: Node[] = [
    {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: {
            label: 'Inicio',
            description: 'Palabra clave',
            // Default trigger config
            triggerType: 'keyword',
            config: { keyword: 'hola' }
        },
    },
]

const NODE_COLORS: Record<string, string> = {
    trigger: '#f97316',
    message: '#3b82f6',
    condition: '#a855f7',
    action: '#22c55e',
    ai: '#6366f1',
    delay: '#64748b',
}

const getNodeColor = (node: Node) => NODE_COLORS[node.type || 'default'] || '#888'

function FlowEditorContent({
    flowId: _flowId,
    initialNodes = defaultNodes,
    initialEdges = [],
    flowName = '',
    flowDescription = '',
    initialTriggerType = 'keyword',
    initialTriggerConfig = { keyword: '' },
    initialVariables = [],
    onSave,
    onClose,
}: FlowEditorProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const { screenToFlowPosition, getViewport } = useReactFlow()

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)

    // Flow metadata
    const [name, setName] = useState(flowName || 'Nuevo Flujo')
    const [description, setDescription] = useState(flowDescription)

    // Advanced Trigger State
    const [triggerType, setTriggerType] = useState<TriggerType>(initialTriggerType)
    const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(initialTriggerConfig)

    // Global Flow Variables
    const [globalVariables] = useState<FlowVariable[]>(initialVariables)

    // Validate connections
    const isValidConnection = useCallback((connection: Connection) => {
        // Prevent self-connections
        if (connection.source === connection.target) return false

        // Ensure both source and target exist
        if (!connection.source || !connection.target) return false

        // All other connections are valid
        return true
    }, [])

    // Connect nodes
    const onConnect = useCallback(
        (params: Connection) => {
            console.log('Connection created:', params)
            setEdges((eds) => addEdge(params, eds))
        },
        [setEdges]
    )

    // Handle node selection
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
    }, [])

    // Handle pane click (deselect)
    const onPaneClick = useCallback(() => {
        setSelectedNode(null)
    }, [])

    // Drag and drop from palette
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()

            const type = event.dataTransfer.getData('application/reactflow')
            if (!type) return

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            })

            const paletteItem = nodePaletteItems.find(item => item.type === type)

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: {
                    label: paletteItem?.label || type,
                    description: paletteItem?.description || '',
                },
            }

            setNodes((nds) => nds.concat(newNode))
        },
        [screenToFlowPosition, setNodes]
    )

    // Update node data
    const updateNodeData = useCallback((nodeId: string, newData: Partial<FlowNodeData>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, ...newData },
                    }
                }
                return node
            })
        )
        // Update selected node too
        if (selectedNode?.id === nodeId) {
            setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...newData } } : null)
        }
    }, [setNodes, selectedNode])

    // Handle keyboard deletion
    const onNodesDelete = useCallback((deletedNodes: Node[]) => {
        // Remove connected edges
        setEdges((eds) =>
            eds.filter(
                (edge) =>
                    !deletedNodes.some(
                        (node) => node.id === edge.source || node.id === edge.target
                    )
            )
        )

        // Clear selection if the selected node was deleted
        if (selectedNode && deletedNodes.some((n) => n.id === selectedNode.id)) {
            setSelectedNode(null)
        }
    }, [selectedNode, setEdges])

    // Delete selected node (Function button)
    const deleteSelectedNode = useCallback(() => {
        if (!selectedNode) return

        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
        setSelectedNode(null)
    }, [selectedNode, setNodes, setEdges])

    // Save flow
    const handleSave = useCallback(() => {
        const viewport = getViewport()
        onSave?.({
            name,
            description,
            triggerType,
            triggerConfig,
            nodes,
            edges,
            variables: globalVariables,
            viewport: {
                x: viewport.x,
                y: viewport.y,
                zoom: viewport.zoom,
            },
        })
    }, [name, description, triggerType, triggerConfig, nodes, edges, globalVariables, getViewport, onSave])

    const handleTriggerChange = useCallback((type: TriggerType, config: Record<string, any>) => {
        setTriggerType(type)
        setTriggerConfig(config)

        // We find the trigger node without depending on 'nodes' for the render of the sidebar
        // by using the functional update pattern or just searching current nodes if we are in a callback
        // However, 'nodes' is a dependency of this callback anyway.

        setNodes(currentNodes => {
            const triggerNodeIndex = currentNodes.findIndex(n => n.type === 'trigger');
            if (triggerNodeIndex >= 0) {
                const triggerNode = currentNodes[triggerNodeIndex];
                const triggerMeta = TRIGGER_CONFIGS[type];

                const updatedNode = {
                    ...triggerNode,
                    data: {
                        ...triggerNode.data,
                        triggerType: type,
                        config,
                        label: triggerMeta?.label || 'Inicio',
                        description: triggerMeta?.description || 'Disparador'
                    }
                };

                const newNodes = [...currentNodes];
                newNodes[triggerNodeIndex] = updatedNode;

                // Also update selectedNode if it is the trigger node
                if (selectedNode?.id === triggerNode.id) {
                    setSelectedNode(updatedNode); // This might be stale if selectedNode in closure is stale, but we use the one from state in render
                    // Actually, we can't easily update 'selectedNode' state from inside setNodes callback.
                }

                return newNodes;
            }
            return currentNodes;
        });

        // We need to update selectedNode separately if needed.
        // But since this callback depends on 'nodes' (to find it) or we use setNodes functional update.
        // Ideally we shouldn't depend on 'nodes' to avoid re-creating this callback often.
        // Functional update is best.

    }, [setNodes, selectedNode])

    // Note: handleTriggerChange still depends on selectedNode for the if check?
    // Actually, if we use setNodes functional update, we don't need 'nodes' dependency.
    // But we might need 'selectedNode' dependency if we want to update it.
    // Let's optimize: Selected Node update is secondary. ReactFlow keeps node data in sync via nodes array. 
    // The Sidebar uses 'selectedNode' state. If we update nodes array, we should also update selectedNodes if matched.
    // Or we can rely on onNodeClick to refresh it? No.

    // Let's keep it simple. dependencies: [setNodes, selectedNode].
    // This implies FlowPaletteSidebar will re-render when selectedNode changes. This is fine. 
    // It WON'T re-render when 'nodes' changes (dragging), which is the goal.

    const defaultEdgeOptions = useMemo(() => ({
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
    }), []);

    return (
        <div className="flex h-full w-full">
            <FlowPaletteSidebar
                name={name}
                setName={setName}
                description={description}
                setDescription={setDescription}
                triggerType={triggerType}
                triggerConfig={triggerConfig}
                onTriggerChange={handleTriggerChange}
                onClose={onClose || (() => { })}
                onSave={handleSave}
            />

            {/* Main Editor */}
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                    deleteKeyCode={['Backspace', 'Delete']}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    isValidConnection={isValidConnection as any}
                    connectionLineType={"smoothstep" as any}
                    connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
                    defaultEdgeOptions={defaultEdgeOptions}
                    fitView
                    fitViewOptions={{ padding: 0.5, maxZoom: 1 }}
                    minZoom={0.1}
                    maxZoom={2}
                    snapToGrid
                    snapGrid={[15, 15]}
                    className="flow-editor"
                    onlyRenderVisibleElements={true}
                >
                    <Background gap={25} size={1} />
                    <Controls />
                    <MiniMap
                        nodeColor={getNodeColor}
                    />
                </ReactFlow>
            </div>

            <FlowPropertiesSidebar
                selectedNode={selectedNode}
                updateNodeData={updateNodeData}
                deleteSelectedNode={deleteSelectedNode}
                onClose={() => setSelectedNode(null)}
            />
        </div>
    )
}

// Wrap with provider
export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <FlowEditorContent {...props} />
        </ReactFlowProvider>
    )
}
