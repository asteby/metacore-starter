import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { CreateUserDialog } from './components/create-user-dialog'

export const Route = createFileRoute('/_authenticated/users/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleAction = (action: string, row: any) => {
    console.log('Action:', action, row)
    // Placeholder for edit/delete
  }

  return (
    <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
      <div className='flex items-center justify-between shrink-0'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.description')}</p>
        </div>
        <CreateUserDialog onSuccess={handleRefresh} />
      </div>
      <div className='flex-1 min-h-0'>
        <DynamicTable
          model="users"
          endpoint="/data/users/me"
          refreshTrigger={refreshKey}
          onAction={handleAction}
        />
      </div>
    </div>
  )
}
