import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { AgentBuilderDialog } from './components/agent-builder-dialog'
import { EditAgentDialog } from './components/edit-agent-dialog'
import { ViewAgentDialog } from './components/view-agent-dialog'

export default function BotsPage() {
    const { t } = useTranslation()
    const [refreshKey, setRefreshKey] = useState(0)
    const [editingAgent, setEditingAgent] = useState<any | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [builderOpen, setBuilderOpen] = useState(false)

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleAction = (action: string, row: any) => {
        if (action === 'edit') {
            setEditingAgent(row)
            setEditDialogOpen(true)
        }
        if (action === 'view') {
            setEditingAgent(row)
            setViewDialogOpen(true)
        }
        // Delete is handled internally by DynamicTable
    }

    return (
        <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
            <div className='flex items-center justify-between shrink-0'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>{t('agents.title')}</h2>
                </div>
                <Button onClick={() => setBuilderOpen(true)} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('agents.create_agent')}
                </Button>
            </div>
            <div className='flex-1 min-h-0'>
                <DynamicTable
                    model="agents"
                    endpoint="/data/agents/me"
                    refreshTrigger={refreshKey}
                    onAction={handleAction}
                />
            </div>

            {/* Edit Agent Modal */}
            <EditAgentDialog
                agent={editingAgent}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={handleRefresh}
            />

            {/* View Agent Modal */}
            <ViewAgentDialog
                agent={editingAgent}
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
            />

            {/* Agent Builder */}
            <AgentBuilderDialog
                open={builderOpen}
                onOpenChange={setBuilderOpen}
                onSuccess={handleRefresh}
            />
        </div>
    )
}
