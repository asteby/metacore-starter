import { FileText, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePurchaseStore } from '@/features/purchase/store/purchase-store'
import { useCreatePurchaseOrder } from '@/features/purchase/api/purchase-api'
import { Button } from '@/components/ui/button'

export function CreateOrderButton() {
  const items = usePurchaseStore((s) => s.items)
  const supplierId = usePurchaseStore((s) => s.supplierId)
  const warehouseId = usePurchaseStore((s) => s.warehouseId)
  const notes = usePurchaseStore((s) => s.notes)
  const expectedDate = usePurchaseStore((s) => s.expectedDate)
  const isProcessing = usePurchaseStore((s) => s.isProcessing)
  const setIsProcessing = usePurchaseStore((s) => s.setIsProcessing)
  const clearOrder = usePurchaseStore((s) => s.clearOrder)

  const createOrder = useCreatePurchaseOrder()

  const isDisabled =
    items.length === 0 || !supplierId || !warehouseId || isProcessing

  const handleCreate = async (state: 'draft' | 'confirmed') => {
    setIsProcessing(true)
    try {
      await createOrder.mutateAsync({
        supplier_id: supplierId!,
        warehouse_id: warehouseId!,
        state,
        expected_date: expectedDate,
        notes,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_identifier: item.product_identifier,
          qty: item.qty,
          unit_price: item.unit_price,
        })),
      })
      toast.success(
        state === 'draft'
          ? 'Orden guardada como borrador'
          : 'Orden de compra confirmada'
      )
      clearOrder()
    } catch {
      toast.error('Error al generar la orden de compra')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <Button
        variant='outline'
        className='w-full'
        disabled={isDisabled}
        onClick={() => handleCreate('draft')}
      >
        {isProcessing ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <FileText className='size-4' />
        )}
        Guardar como Borrador
      </Button>
      <Button
        className='w-full bg-green-600 text-white hover:bg-green-600/90'
        disabled={isDisabled}
        onClick={() => handleCreate('confirmed')}
      >
        {isProcessing ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <CheckCircle className='size-4' />
        )}
        Confirmar Orden
      </Button>
    </div>
  )
}
