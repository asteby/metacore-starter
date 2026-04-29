import { usePurchaseStore } from '@/features/purchase/store/purchase-store'
import { fmtCurrency } from '@/lib/format'
import { Separator } from '@/components/ui/separator'

export function OrderTotals() {
  const getSubtotal = usePurchaseStore((s) => s.getSubtotal)
  const getTaxAmount = usePurchaseStore((s) => s.getTaxAmount)
  const getTotal = usePurchaseStore((s) => s.getTotal)

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">{fmtCurrency(getSubtotal())}</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">IVA (16%)</span>
        <span className="tabular-nums">{fmtCurrency(getTaxAmount())}</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">Total</span>
        <span className="text-lg font-bold tabular-nums">{fmtCurrency(getTotal())}</span>
      </div>
    </div>
  )
}
