import { createFileRoute } from '@tanstack/react-router'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/reports/inventory/')({
  component: InventoryReportsPage,
})

function InventoryReportsPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 p-8 gap-6 overflow-hidden">
        <h1 className="text-2xl font-bold tracking-tight shrink-0">
          {t('sidebar.reports_inventory')}
        </h1>

        <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto">
          <section>
            <h2 className="text-lg font-semibold mb-3">
              {t('sidebar.stock_levels')}
            </h2>
            <DynamicTable
              model="stock_levels"
              endpoint="/data/stock_levels/me"
              refreshTrigger={0}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {t('sidebar.adjustments')}
            </h2>
            <DynamicTable
              model="inventory_adjustments"
              endpoint="/data/inventory_adjustments/me"
              refreshTrigger={0}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
