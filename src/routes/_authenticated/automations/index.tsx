import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/automations/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  
  return (
    <ComingSoon 
      title={t('automations.title')}
      description={t('automations.description')}
      icon="sparkles"
    />
  )
}
