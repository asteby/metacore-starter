import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@asteby/metacore-ui/primitives'
import { useTranslation } from 'react-i18next'

export function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          {t('dashboard.title', 'Dashboard')}
        </h1>
        <p className='text-muted-foreground'>
          {t(
            'dashboard.subtitle',
            'Welcome to your metacore-powered application.'
          )}
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.placeholder.title', 'Welcome')}</CardTitle>
            <CardDescription>
              {t(
                'dashboard.placeholder.description',
                'Replace this with your own widgets, charts, or KPIs.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm'>
              {t(
                'dashboard.placeholder.body',
                'The metacore SDK ships primitives, layouts, data-table and more — pull them from `@asteby/metacore-ui` and `@asteby/metacore-starter-core`.'
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
