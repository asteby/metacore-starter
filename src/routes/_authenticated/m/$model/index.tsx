import { useState, useCallback, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { DynamicRecordDialog } from '@/components/dynamic/dynamic-record-dialog'
import { getModelExtension } from '@/components/dynamic/model-extensions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useMetadataCache } from '@/stores/metadata-cache'

export const Route = createFileRoute('/_authenticated/m/$model/')({
  component: DynamicModelPage,
})

function DynamicModelPage() {
  const { model } = Route.useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [openCreate, setOpenCreate] = useState(false)
  const cachedMeta = useMetadataCache((s) => s.getMetadata(model))
  const [title, setTitle] = useState(cachedMeta?.title || '')
  const [enableCRUD, setEnableCRUD] = useState(cachedMeta?.enableCRUDActions ?? false)
  const extension = useMemo(() => getModelExtension(model), [model])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // Use cached metadata first, fetch from API as fallback
  useEffect(() => {
    if (cachedMeta) {
      setTitle(cachedMeta.title || model)
      setEnableCRUD(cachedMeta.enableCRUDActions ?? false)
      return
    }
    let cancelled = false
    api.get(`/metadata/table/${model}`).then(res => {
      if (cancelled) return
      const meta = res.data?.data ?? res.data
      setTitle(meta?.title || model)
      setEnableCRUD(meta?.enableCRUDActions ?? false)
    }).catch(() => {
      if (!cancelled) setTitle(model)
    })
    return () => { cancelled = true }
  }, [model, cachedMeta])

  const HeaderComponent = extension?.header
  const showCreate = enableCRUD && !extension?.hideCreate

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {HeaderComponent && <HeaderComponent />}
      <div className='flex flex-col flex-1 p-8 gap-4 overflow-hidden'>
      <div className='flex items-center justify-between shrink-0'>
        {title ? (
          <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
        ) : (
          <Skeleton className='h-8 w-48' />
        )}
        {showCreate && (
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear
          </Button>
        )}
      </div>
      <div className='flex-1 min-h-0'>
        <DynamicTable
          key={model}
          model={model}
          endpoint={`/data/${model}/me`}
          refreshTrigger={refreshKey}
        />
      </div>

      {enableCRUD && (
        <DynamicRecordDialog
          open={openCreate}
          onOpenChange={setOpenCreate}
          mode="create"
          model={model}
          endpoint={`/data/${model}/me`}
          onSaved={handleRefresh}
        />
      )}
      </div>
    </div>
  )
}
