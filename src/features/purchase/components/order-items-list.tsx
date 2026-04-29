import { useState, useRef } from 'react'
import { Minus, Plus, Trash2, Package } from 'lucide-react'
import { usePurchaseStore } from '@/features/purchase/store/purchase-store'
import { fmtCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function QtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)

  if (!ref.current?.matches(':focus') && text !== String(value)) {
    setText(String(value))
  }

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        setText(raw)
        const num = parseInt(raw, 10)
        if (num > 0) onChange(num)
      }}
      onBlur={() => {
        const num = parseInt(text, 10)
        if (!num || num < 1) {
          onChange(1)
          setText('1')
        } else {
          setText(String(num))
        }
      }}
      onFocus={(e) => e.target.select()}
      className="h-7 w-14 text-center text-sm font-medium tabular-nums px-1"
    />
  )
}

export function OrderItemsList() {
  const items = usePurchaseStore((s) => s.items)
  const removeItem = usePurchaseStore((s) => s.removeItem)
  const updateQty = usePurchaseStore((s) => s.updateQty)
  const updatePrice = usePurchaseStore((s) => s.updatePrice)

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Package className="size-10 opacity-40" />
        <span className="text-sm">Agrega productos a la orden</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => {
        const lineTotal = item.qty * item.unit_price

        return (
          <div
            key={item.product_id}
            className="rounded-lg border p-2"
          >
            {/* Row 1: Name + delete */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium line-clamp-1">
                  {item.product_name}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.product_identifier && (
                    <span className="font-mono">{item.product_identifier}</span>
                  )}
                  <span>{fmtCurrency(item.unit_price)} c/u</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.product_id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            {/* Row 2: Qty controls + price input + total */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => updateQty(item.product_id, Math.max(1, item.qty - 1))}
                >
                  <Minus className="size-3" />
                </Button>
                <QtyInput
                  value={item.qty}
                  onChange={(val) => updateQty(item.product_id, val)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => updateQty(item.product_id, item.qty + 1)}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={item.unit_price}
                onChange={(e) =>
                  updatePrice(item.product_id, Math.max(0, Number(e.target.value)))
                }
                className="h-7 w-20 text-right text-sm tabular-nums"
                aria-label="Precio unitario"
              />
              <span className="text-sm font-semibold tabular-nums">
                {fmtCurrency(lineTotal)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
