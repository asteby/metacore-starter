import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'

export const Route = createFileRoute('/_authenticated/tickets/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
      <div className='flex items-center justify-between shrink-0'>
        <h1 className='text-2xl font-bold tracking-tight'>{t('tickets.title')}</h1>
      </div>
      <div className='flex-1 min-h-0'>
        <DynamicTable model="tickets" endpoint="/data/tickets/me" />
      </div>
    </div>
  )
}
