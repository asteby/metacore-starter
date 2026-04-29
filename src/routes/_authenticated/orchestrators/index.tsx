import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { CreateOrchestratorDialog } from './components/create-orchestrator-dialog'
import { EditOrchestratorDialog } from './components/edit-orchestrator-dialog'
import { ViewOrchestratorDialog } from './components/view-orchestrator-dialog'

export const Route = createFileRoute('/_authenticated/orchestrators/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const [refreshKey, setRefreshKey] = useState(0)
    const [editingOrchestrator, setEditingOrchestrator] = useState<any | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [viewingOrchestrator, setViewingOrchestrator] = useState<any | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1)
    }, [])

    const handleAction = (action: string, row: any) => {
        if (action === 'edit') {
            setEditingOrchestrator(row)
            setEditDialogOpen(true)
        } else if (action === 'view') {
            setViewingOrchestrator(row)
            setViewDialogOpen(true)
        }
    }

    return (
        <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
            <div className='flex items-center justify-between shrink-0'>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>{t('orchestrators.title')}</h1>
                    <p className="text-muted-foreground">{t('orchestrators.description')}</p>
                </div>
                <CreateOrchestratorDialog onSuccess={handleRefresh} />
            </div>
            <div className='flex-1 min-h-0'>
                <DynamicTable
                    model="orchestrators"
                    endpoint="/data/orchestrators/me"
                    refreshTrigger={refreshKey}
                    onAction={handleAction}
                />
            </div>

            <EditOrchestratorDialog
                orchestrator={editingOrchestrator}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={handleRefresh}
            />

            <ViewOrchestratorDialog
                orchestrator={viewingOrchestrator}
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
            />
        </div>
    )
}
