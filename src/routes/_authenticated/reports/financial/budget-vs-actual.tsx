import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/reports/financial/budget-vs-actual',
)({
  component: BudgetVsActualPage,
})

function BudgetVsActualPage() {
  const { t } = useTranslation()
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-12-31`)
  const [budgetId, setBudgetId] = useState('')

  // Fetch available budgets
  const { data: budgets } = useQuery({
    queryKey: ['budgets-list'],
    queryFn: () =>
      api.get('/data/budgets/me').then((r: { data: { data: any } }) => r.data.data ?? []),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['budget-vs-actual', budgetId, startDate, endDate],
    queryFn: () =>
      api
        .get('/reports/financial/budget-vs-actual', {
          params: {
            budget_id: budgetId,
            start_date: startDate,
            end_date: endDate,
          },
        })
        .then((r: { data: { data: any } }) => r.data.data),
    enabled: !!budgetId,
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
            {t(
              'reports.financial.budget-vs-actual.title',
              'Presupuesto vs Real',
            )}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <select
            value={budgetId}
            onChange={(e) => setBudgetId(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">Seleccionar presupuesto...</option>
            {budgets?.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
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
          {!budgetId ? (
            <p className="text-muted-foreground">
              Selecciona un presupuesto para ver la variacion.
            </p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">Codigo</th>
                  <th className="text-left p-2">Cuenta</th>
                  <th className="text-right p-2">Presupuesto</th>
                  <th className="text-right p-2">Real</th>
                  <th className="text-right p-2">Variacion</th>
                  <th className="text-right p-2">%</th>
                </tr>
              </thead>
              <tbody>
                {data?.lines?.map((l: any) => (
                  <tr key={l.account_id} className="border-b">
                    <td className="p-2 font-mono">{l.account_code}</td>
                    <td className="p-2">{l.account_name}</td>
                    <td className="p-2 text-right">
                      {fmt(l.planned_amount)}
                    </td>
                    <td className="p-2 text-right">
                      {fmt(l.actual_amount)}
                    </td>
                    <td
                      className={`p-2 text-right font-semibold ${l.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {fmt(l.variance)}
                    </td>
                    <td
                      className={`p-2 text-right ${l.variance_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {l.variance_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
