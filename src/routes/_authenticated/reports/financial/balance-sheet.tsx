import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/reports/financial/balance-sheet',
)({
  component: BalanceSheetPage,
})

function BalanceSheetSection({
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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
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
          <tr className="font-bold border-t">
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

function BalanceSheetPage() {
  const { t } = useTranslation()
  const now = new Date()
  const [endDate, setEndDate] = useState(
    now.toISOString().split('T')[0],
  )

  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', endDate],
    queryFn: () =>
      api
        .get('/reports/financial/balance-sheet', {
          params: { end_date: endDate, start_date: '2000-01-01' },
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
            {t('reports.financial.balance-sheet.title', 'Balance General')}
          </h1>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <label className="text-sm text-muted-foreground">Al:</label>
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
            <div className="space-y-4">
              <BalanceSheetSection
                title="Activos"
                section={data?.assets}
                fmt={fmt}
              />
              <BalanceSheetSection
                title="Pasivos"
                section={data?.liabilities}
                fmt={fmt}
              />
              <BalanceSheetSection
                title="Capital"
                section={data?.equity}
                fmt={fmt}
              />
              <div className="border-t-2 pt-4 flex justify-between font-bold text-lg">
                <span>Pasivo + Capital</span>
                <span>
                  {fmt(
                    (data?.liabilities?.total ?? 0) +
                      (data?.equity?.total ?? 0),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
