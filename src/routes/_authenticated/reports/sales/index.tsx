import { createFileRoute } from '@tanstack/react-router'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/reports/sales/')({
  component: SalesReportsPage,
})

function SalesReportsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 p-8 gap-6 overflow-hidden">
        <h1 className="text-2xl font-bold tracking-tight shrink-0">
          {t('sidebar.reports_sales')}
        </h1>

        <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto">
          <section>
            <h2 className="text-lg font-semibold mb-3">
              {t('sidebar.sales_orders')}
            </h2>
            <DynamicTable
              model="sales_orders"
              endpoint="/data/sales_orders/me"
              refreshTrigger={0}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {t('sidebar.invoices')}
            </h2>
            <DynamicTable
              model="invoices"
              endpoint="/data/invoices/me"
              refreshTrigger={0}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
