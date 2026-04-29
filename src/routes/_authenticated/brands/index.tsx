import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { BrandCreateDialog } from '@/components/dynamic/brand-create-dialog'

export const Route = createFileRoute('/_authenticated/brands/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const [refreshKey, setRefreshKey] = useState(0)
    const [openCreate, setOpenCreate] = useState(false)

    return (
        <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
            <div className='flex items-center justify-between shrink-0'>
                <h1 className='text-2xl font-bold tracking-tight'>{t('brands.title')}</h1>
                <Button onClick={() => setOpenCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('brands.new_brand')}
                </Button>
            </div>
            <div className='flex-1 min-h-0'>
                <DynamicTable
                    model="brands"
                    endpoint="/data/brands/me"
                    refreshTrigger={refreshKey}
                />
            </div>

            <BrandCreateDialog
                open={openCreate}
                onOpenChange={setOpenCreate}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </div>
    )
}
