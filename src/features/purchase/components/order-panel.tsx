import { ClipboardList } from 'lucide-react'
import { usePurchaseStore } from '@/features/purchase/store/purchase-store'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OrderItemsList } from './order-items-list'
import { OrderTotals } from './order-totals'
import { CreateOrderButton } from './create-order-button'

export function OrderPanel() {
  const supplierName = usePurchaseStore((s) => s.supplierName)
  const warehouseName = usePurchaseStore((s) => s.warehouseName)
  const notes = usePurchaseStore((s) => s.notes)
  const expectedDate = usePurchaseStore((s) => s.expectedDate)
  const setNotes = usePurchaseStore((s) => s.setNotes)
  const setExpectedDate = usePurchaseStore((s) => s.setExpectedDate)

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0">
        <ClipboardList className="size-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Orden de Compra</h2>
      </div>

      {/* Supplier & warehouse info */}
      {(supplierName || warehouseName) && (
        <div className="flex flex-wrap gap-2 px-3 pt-2 shrink-0">
          {supplierName && (
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {supplierName}
            </span>
          )}
          {warehouseName && (
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {warehouseName}
            </span>
          )}
        </div>
      )}

      {/* Notes & expected date */}
      <div className="flex flex-col gap-2 px-3 py-2 shrink-0">
        <Textarea
          placeholder="Notas..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-0 resize-none text-sm"
        />
        <Input
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
          className="h-8 text-sm"
          aria-label="Fecha esperada"
        />
      </div>

      {/* Items list - scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
        <OrderItemsList />
      </div>

      {/* Footer: Totals + Actions - always visible */}
      <div className="shrink-0 border-t bg-card px-3 py-3 space-y-3">
        <OrderTotals />
        <CreateOrderButton />
      </div>
    </div>
  )
}
