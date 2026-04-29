import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/_authenticated/events/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  return (
    <ComingSoon 
      title={t('audit.title')}
      description={t('audit.description')}
      icon="construction"
    />
  )
}
