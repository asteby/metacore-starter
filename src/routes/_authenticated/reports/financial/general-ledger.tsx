import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/reports/financial/general-ledger',
)({
  component: GeneralLedgerPage,
})

function GeneralLedgerPage() {
  const { t } = useTranslation()
  const now = new Date()
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-01-01`)
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-12-31`)
  const [accountId, setAccountId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Search accounts for picker
  const { data: accounts } = useQuery({
    queryKey: ['search-accounts', searchTerm],
    queryFn: () =>
      api
        .get('/search/accounts', { params: { q: searchTerm } })
        .then((r: { data: { data: any } }) => r.data.data ?? []),
    enabled: searchTerm.length > 0,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['general-ledger', accountId, startDate, endDate],
    queryFn: () =>
      api
        .get('/reports/financial/general-ledger', {
          params: {
            account_id: accountId,
            start_date: startDate,
            end_date: endDate,
          },
        })
        .then((r: { data: { data: any } }) => r.data.data),
    enabled: !!accountId,
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
              'reports.financial.general-ledger.title',
              'Libro Mayor',
            )}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative">
            <Input
              placeholder="Buscar cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            {accounts && accounts.length > 0 && searchTerm && (
              <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                {accounts.map((a: any) => (
                  <button
                    key={a.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                    onClick={() => {
                      setAccountId(a.id)
                      setSearchTerm(`${a.code} - ${a.name}`)
                    }}
                  >
                    <span className="font-mono">{a.code}</span> - {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          {!accountId ? (
            <p className="text-muted-foreground">
              Selecciona una cuenta para ver el libro mayor.
            </p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : (
            <div>
              <div className="mb-4">
                <span className="font-semibold">
                  {data?.account?.code} - {data?.account?.name}
                </span>
                <span className="ml-4 text-muted-foreground">
                  Saldo Inicial: {fmt(data?.opening_balance ?? 0)}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Poliza</th>
                    <th className="text-left p-2">Referencia</th>
                    <th className="text-left p-2">Descripcion</th>
                    <th className="text-right p-2">Debe</th>
                    <th className="text-right p-2">Haber</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.entries?.map((e: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        {new Date(e.date).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-2 font-mono">{e.entry_number}</td>
                      <td className="p-2">{e.reference}</td>
                      <td className="p-2">{e.description}</td>
                      <td className="p-2 text-right">{fmt(e.debit)}</td>
                      <td className="p-2 text-right">{fmt(e.credit)}</td>
                      <td className="p-2 text-right font-semibold">
                        {fmt(e.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 font-bold">
                  <tr>
                    <td className="p-2" colSpan={6}>
                      Saldo Final
                    </td>
                    <td className="p-2 text-right">
                      {fmt(data?.closing_balance ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
