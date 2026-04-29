import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/reports/financial/trial-balance',
)({
  component: TrialBalancePage,
})

function TrialBalancePage() {
  const { t } = useTranslation()
  const now = new Date()
  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-01-01`,
  )
  const [endDate, setEndDate] = useState(
    `${now.getFullYear()}-12-31`,
  )

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance', startDate, endDate],
    queryFn: () =>
      api
        .get('/reports/financial/trial-balance', {
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
            {t('reports.financial.trial-balance.title', 'Balanza de Comprobacion')}
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
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">Codigo</th>
                  <th className="text-left p-2">Cuenta</th>
                  <th className="text-right p-2">Debe</th>
                  <th className="text-right p-2">Haber</th>
                  <th className="text-right p-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {data?.accounts?.map((a: any) => (
                  <tr key={a.account_id} className="border-b">
                    <td className="p-2 font-mono">{a.account_code}</td>
                    <td className="p-2">{a.account_name}</td>
                    <td className="p-2 text-right">{fmt(a.total_debit)}</td>
                    <td className="p-2 text-right">{fmt(a.total_credit)}</td>
                    <td className="p-2 text-right font-semibold">
                      {fmt(a.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 font-bold">
                <tr>
                  <td className="p-2" colSpan={2}>
                    Total
                  </td>
                  <td className="p-2 text-right">
                    {fmt(data?.total_debit ?? 0)}
                  </td>
                  <td className="p-2 text-right">
                    {fmt(data?.total_credit ?? 0)}
                  </td>
                  <td className="p-2 text-right">
                    {fmt((data?.total_debit ?? 0) - (data?.total_credit ?? 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
