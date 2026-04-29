import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { CategoryDialog } from './components/category-dialog'

export const Route = createFileRoute('/_authenticated/categories/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const [refreshKey, setRefreshKey] = useState(0)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
        setEditingCategory(null)
    }

    const handleAction = (action: string, row: any) => {
        if (action === 'edit') {
            setEditingCategory(row)
            setIsDialogOpen(true)
        }
    }

    return (
        <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
            <div className='flex items-center justify-between shrink-0'>
                <h1 className='text-2xl font-bold tracking-tight'>{t('categories.title')}</h1>
                <CategoryDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    category={editingCategory}
                    onSuccess={handleRefresh}
                />
            </div>
            <div className='flex-1 min-h-0'>
                <DynamicTable
                    model="categories"
                    endpoint="/data/categories/me"
                    refreshTrigger={refreshKey}
                    onAction={handleAction}
                />
            </div>
        </div>
    )
}
