import { usePOSStore } from '@/features/pos/store/pos-store'
import { useAuthStore } from '@/stores/auth-store'
import { useFormatCurrency } from '@/lib/format'
import { Separator } from '@/components/ui/separator'

export function CartTotals() {
  const items = usePOSStore((s) => s.items)
  const user = useAuthStore((s) => s.auth.user)
  const fmt = useFormatCurrency()

  const taxRate = user?.tax_rate ?? 16
  const taxIncluded = user?.tax_included ?? true

  const lineTotal = items.reduce((sum, item) => {
    return sum + item.qty * item.unit_price * (1 - item.discount / 100)
  }, 0)

  let subtotal: number
  let tax: number

  if (taxIncluded) {
    subtotal = lineTotal / (1 + taxRate / 100)
    tax = lineTotal - subtotal
  } else {
    subtotal = lineTotal
    tax = lineTotal * (taxRate / 100)
  }

  const total = subtotal + tax

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="tabular-nums">{fmt(subtotal)}</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          IVA ({taxRate}%){taxIncluded ? ' incl.' : ''}
        </span>
        <span className="tabular-nums">{fmt(tax)}</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">Total</span>
        <span className="text-lg font-bold tabular-nums">{fmt(total)}</span>
      </div>
    </div>
  )
}
