import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/reports/financial/profit-loss',
)({
  component: ProfitLossPage,
})

function AccountSection({
  title,
  section,
  fmt,
}: {
  title: string
  section: any
  fmt: (n: number) => string
}) {
  if (!section) return null
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {section.accounts?.map((a: any) => (
            <tr key={a.account_id} className="border-b">
              <td className="p-2 font-mono">{a.account_code}</td>
              <td className="p-2">{a.account_name}</td>
              <td className="p-2 text-right">{fmt(a.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold border-t">
            <td className="p-2" colSpan={2}>
              Total {title}
            </td>
            <td className="p-2 text-right">{fmt(section.total ?? 0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ProfitLossPage() {
  const { t } = useTranslation()
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-12-31`)

  const { data, isLoading } = useQuery({
    queryKey: ['profit-loss', startDate, endDate],
    queryFn: () =>
      api
        .get('/reports/financial/profit-loss', {
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
            {t(
              'reports.financial.profit-loss.title',
              'Estado de Resultados',
            )}
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
            <div className="space-y-2">
              <AccountSection
                title="Ingresos"
                section={data?.revenue}
                fmt={fmt}
              />
              <AccountSection
                title="Costo de Venta"
                section={data?.cogs}
                fmt={fmt}
              />

              <div className="border-t-2 py-2 flex justify-between font-bold text-base">
                <span>Utilidad Bruta</span>
                <span>{fmt(data?.gross_profit ?? 0)}</span>
              </div>

              <AccountSection
                title="Gastos"
                section={data?.expenses}
                fmt={fmt}
              />

              <div className="border-t-2 border-double pt-4 flex justify-between font-bold text-lg">
                <span>Utilidad Neta</span>
                <span
                  className={
                    (data?.net_income ?? 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {fmt(data?.net_income ?? 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
