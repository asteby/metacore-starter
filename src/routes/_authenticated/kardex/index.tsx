import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import { Download, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

type KardexSearch = {
  product_variant_id?: string
  from?: string
  to?: string
}

export const Route = createFileRoute('/_authenticated/kardex/')({
  component: KardexPage,
  validateSearch: (search: Record<string, unknown>): KardexSearch => ({
    product_variant_id: search.product_variant_id as string | undefined,
    from: search.from as string | undefined,
    to: search.to as string | undefined,
  }),
})

interface KardexEntry {
  id: string
  moved_at: string
  movement_type: string
  reference_type: string
  reference_id: string | null
  lot_number: string
  qty_in: number
  qty_out: number
  balance: number
  unit_cost: number
  total_cost: number
  cost_balance: number
  notes: string
}

const movementTypeBadge: Record<string, { label: string; class: string }> = {
  receipt: { label: 'Entrada', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  delivery: { label: 'Salida', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  transfer: { label: 'Transferencia', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  adjustment: { label: 'Ajuste', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  return: { label: 'Devolución', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
}

function KardexPage() {
  const search = useSearch({ from: '/_authenticated/kardex/' })
  const variantId = search.product_variant_id || ''

  const [entries, setEntries] = useState<KardexEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [productName, setProductName] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dateFrom, setDateFrom] = useState(search.from || '')
  const [dateTo, setDateTo] = useState(search.to || '')

  const fetchKardex = useCallback(async () => {
    if (!variantId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ product_variant_id: variantId, page: String(page), per_page: '50' })
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await api.get(`/kardex?${params}`)
      if (res.data.success) {
        setEntries(res.data.data || [])
        setTotalPages(res.data.meta?.total_pages || 1)
        setTotal(res.data.meta?.total || 0)
      }
    } catch (err) {
      console.error('Error fetching kardex', err)
    } finally {
      setLoading(false)
    }
  }, [variantId, page, dateFrom, dateTo])

  // Fetch product name
  useEffect(() => {
    if (!variantId) return
    api.get(`/data/product_variants/me/${variantId}`).then(res => {
      const data = res.data?.data ?? res.data
      setProductName(data?.name || variantId)
    }).catch(() => setProductName(variantId))
  }, [variantId])

  useEffect(() => { fetchKardex() }, [fetchKardex])

  const handleExport = async () => {
    const params = new URLSearchParams({ product_variant_id: variantId })
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)

    try {
      const res = await api.get(`/kardex/export?${params}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `kardex-${productName || 'export'}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting kardex', err)
    }
  }

  if (!variantId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <ScrollText className="h-12 w-12" />
        <p>Selecciona un producto desde Stock para ver su Kardex</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-8 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kardex</h1>
          <p className="text-muted-foreground">{productName} &middot; {total} movimientos</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            placeholder="Desde" className="w-36 h-8" />
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
            placeholder="Hasta" className="w-36 h-8" />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead className="text-right">Entrada</TableHead>
              <TableHead className="text-right">Salida</TableHead>
              <TableHead className="text-right font-bold">Saldo</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Costo Total</TableHead>
              <TableHead className="text-right font-bold">Saldo Costo</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Sin movimientos</TableCell></TableRow>
            ) : entries.map(e => {
              const badge = movementTypeBadge[e.movement_type] || { label: e.movement_type, class: 'bg-gray-100 text-gray-800' }
              return (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(e.moved_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell><Badge className={badge.class}>{badge.label}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.reference_type}</TableCell>
                  <TableCell>{e.lot_number || '-'}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">{e.qty_in > 0 ? e.qty_in.toFixed(2) : ''}</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">{e.qty_out > 0 ? e.qty_out.toFixed(2) : ''}</TableCell>
                  <TableCell className="text-right font-bold">{e.balance.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{e.unit_cost > 0 ? `$${e.unit_cost.toFixed(4)}` : ''}</TableCell>
                  <TableCell className="text-right">{e.total_cost > 0 ? `$${e.total_cost.toFixed(2)}` : ''}</TableCell>
                  <TableCell className="text-right font-bold">${e.cost_balance.toFixed(2)}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{e.notes}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 shrink-0">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  )
}
