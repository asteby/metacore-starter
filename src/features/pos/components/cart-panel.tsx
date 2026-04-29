import { useState } from 'react'
import { Receipt, CreditCard, Send } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { usePOSStore } from '@/features/pos/store/pos-store'
import { CustomerSelector } from '@/features/pos/components/customer-selector'
import { CartItemsList } from '@/features/pos/components/cart-items-list'
import { CartTotals } from '@/features/pos/components/cart-totals'
import { CheckoutModal } from '@/features/pos/components/checkout-modal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useCreatePOSOrder } from '@/features/pos/api/pos-api'

export function CartPanel() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const items = usePOSStore((s) => s.items)
  const session = usePOSStore((s) => s.session)
  const user = useAuthStore((s) => s.auth.user)
  const clearCart = usePOSStore((s) => s.clearCart)
  const customerId = usePOSStore((s) => s.customerId)

  const checkoutMode = user?.checkout_mode ?? 'integrated'
  const hasItems = items.length > 0

  const createOrder = useCreatePOSOrder()

  const handleSendToCashier = async () => {
    if (!hasItems) return
    try {
      await createOrder.mutateAsync({
        customer_id: customerId,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_identifier: item.product_identifier,
          qty: item.qty,
          unit_price: item.unit_price,
          discount: item.discount,
        })),
        notes: '',
      })
      toast.success('Orden enviada a caja')
      clearCart()
    } catch {
      toast.error('Error al enviar la orden')
    }
  }

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0">
        <Receipt className="size-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Resumen de Venta</h2>
      </div>

      {/* Customer selector */}
      <div className="px-3 pt-2 shrink-0">
        <CustomerSelector />
      </div>

      {/* Cart items - THIS is the only scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
        <CartItemsList />
      </div>

      {/* Footer: Totals + Action - ALWAYS visible at bottom */}
      <div className="shrink-0 border-t bg-card px-3 py-3 space-y-3">
        <CartTotals />

        {checkoutMode === 'integrated' ? (
          <Button
            className="w-full bg-green-600 text-white hover:bg-green-700 h-12 text-base font-semibold"
            size="lg"
            disabled={!hasItems || !session}
            onClick={() => setCheckoutOpen(true)}
          >
            <CreditCard className="size-5" />
            Cobrar
          </Button>
        ) : (
          <Button
            className="w-full h-12 text-base font-semibold"
            size="lg"
            disabled={!hasItems}
            onClick={handleSendToCashier}
          >
            <Send className="size-5" />
            Enviar a Caja
          </Button>
        )}
      </div>

      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  )
}
