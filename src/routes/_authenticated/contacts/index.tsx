import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { CreateContactDialog } from './components/create-contact-dialog'

export const Route = createFileRoute('/_authenticated/contacts/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
      <div className='flex items-center justify-between shrink-0'>
        <h1 className='text-2xl font-bold tracking-tight'>{t('contacts.title')}</h1>
        <CreateContactDialog onSuccess={handleRefresh} />
      </div>
      <div className='flex-1 min-h-0'>
        <DynamicTable model="contacts" endpoint="/data/contacts/me" refreshTrigger={refreshKey} defaultFilters={{ phone: 'NOT_IN:+1234567890' }} />
      </div>
    </div>
  )
}
