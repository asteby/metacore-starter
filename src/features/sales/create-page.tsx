import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ShoppingCart, Send } from 'lucide-react'
import { toast } from 'sonner'
import { usePOSStore } from '@/features/pos/store/pos-store'
import { useCreatePOSOrder } from '@/features/pos/api/pos-api'
import { ProductSearch } from '@/features/pos/components/product-search'
import { CategoryTabs } from '@/features/pos/components/category-tabs'
import { ProductGrid } from '@/features/pos/components/product-grid'
import { CustomerSelector } from '@/features/pos/components/customer-selector'
import { CartItemsList } from '@/features/pos/components/cart-items-list'
import { CartTotals } from '@/features/pos/components/cart-totals'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function SalesCreatePage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const items = usePOSStore((s) => s.items)
  const customerId = usePOSStore((s) => s.customerId)
  const clearCart = usePOSStore((s) => s.clearCart)
  const isProcessing = usePOSStore((s) => s.isProcessing)
  const setIsProcessing = usePOSStore((s) => s.setIsProcessing)

  const createOrder = useCreatePOSOrder()
  const navigate = useNavigate()
  const hasItems = items.length > 0

  const handleCreateOrder = async () => {
    if (!hasItems) return
    setIsProcessing(true)
    try {
      const result = await createOrder.mutateAsync({
        customer_id: customerId,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_identifier: item.product_identifier,
          qty: item.qty,
          unit_price: item.unit_price,
          discount: item.discount,
        })),
        notes,
      })
      const orderNumber = result?.data?.number ?? ''
      toast.success(
        orderNumber
          ? `Orden ${orderNumber} creada exitosamente`
          : 'Orden de venta creada exitosamente'
      )
      clearCart()
      setNotes('')
      navigate({ to: '/m/$model', params: { model: 'sales_orders' } })
    } catch {
      toast.error('Error al crear la orden de venta')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-6 py-3 shrink-0">
        <ShoppingCart className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">Crear Orden de Venta</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Products Panel */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4 min-h-0">
          <ProductSearch value={search} onChange={setSearch} />
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ProductGrid search={search} categoryId={selectedCategory} />
          </div>
        </div>

        {/* Order Summary Panel */}
        <div className="flex h-full w-[380px] shrink-0 flex-col border-l bg-card overflow-hidden">
          <div className="px-3 pt-3 shrink-0">
            <CustomerSelector />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
            <CartItemsList />
          </div>

          <div className="shrink-0 border-t bg-card px-3 py-3 space-y-3">
            <CartTotals />

            <Textarea
              placeholder="Notas de la orden (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />

            <Button
              className="w-full h-12 text-base font-semibold"
              size="lg"
              disabled={!hasItems || isProcessing}
              onClick={handleCreateOrder}
            >
              <Send className="size-5" />
              {isProcessing ? 'Creando...' : 'Crear Orden de Venta'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
