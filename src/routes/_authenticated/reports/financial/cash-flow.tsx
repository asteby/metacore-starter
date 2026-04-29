import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/reports/financial/cash-flow',
)({
  component: CashFlowPage,
})

function CashFlowPage() {
  const { t } = useTranslation()
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-12-31`)

  const { data, isLoading } = useQuery({
    queryKey: ['cash-flow', startDate, endDate],
    queryFn: () =>
      api
        .get('/reports/financial/cash-flow', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then((r: { data: { data: any } }) => r.data.data),
  })

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(n)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 p-8 gap-6 overflow-hidden">
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/reports/financial">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('reports.financial.cash-flow.title', 'Flujo de Efectivo')}
          </h1>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Actividades Operativas
                </h3>
                <div className="flex justify-between p-2 border-b">
                  <span>Utilidad Neta</span>
                  <span className="font-semibold">
                    {fmt(data?.operating?.net_income ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Flujos por Diario
                </h3>
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Diario</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-right p-2">Entradas</th>
                      <th className="text-right p-2">Salidas</th>
                      <th className="text-right p-2">Flujo Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.journal_flows?.map((f: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{f.journal_name}</td>
                        <td className="p-2">{f.journal_type}</td>
                        <td className="p-2 text-right">
                          {fmt(f.total_debit)}
                        </td>
                        <td className="p-2 text-right">
                          {fmt(f.total_credit)}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {fmt(f.net_flow)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 pt-4 flex justify-between font-bold text-lg">
                <span>Flujo de Efectivo Total</span>
                <span
                  className={
                    (data?.total_cash_flow ?? 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {fmt(data?.total_cash_flow ?? 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
