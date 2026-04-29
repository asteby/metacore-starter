import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePOSStore } from '@/features/pos/store/pos-store'
import { useCreatePOSSale } from '@/features/pos/api/pos-api'
import { Button } from '@/components/ui/button'

export function RegisterSaleButton() {
  const items = usePOSStore((s) => s.items)
  const payments = usePOSStore((s) => s.payments)
  const session = usePOSStore((s) => s.session)
  const customerId = usePOSStore((s) => s.customerId)
  const isProcessing = usePOSStore((s) => s.isProcessing)
  const setIsProcessing = usePOSStore((s) => s.setIsProcessing)
  const getTotal = usePOSStore((s) => s.getTotal)
  const getTotalPaid = usePOSStore((s) => s.getTotalPaid)
  const clearCart = usePOSStore((s) => s.clearCart)

  const createSale = useCreatePOSSale()

  const total = getTotal()
  const totalPaid = getTotalPaid()

  const isDisabled =
    items.length === 0 ||
    totalPaid < total ||
    !session ||
    isProcessing

  const handleRegisterSale = async () => {
    if (isDisabled) return

    setIsProcessing(true)

    try {
      await createSale.mutateAsync({
        customer_id: customerId,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_identifier: item.product_identifier,
          qty: item.qty,
          unit_price: item.unit_price,
          discount: item.discount,
        })),
        payments: payments.map((p) => ({
          payment_method_id: p.payment_method_id,
          payment_sub_method_id: p.payment_sub_method_id,
          amount: p.amount,
          reference: p.reference,
        })),
        notes: '',
      })

      toast.success('Venta registrada exitosamente')
      clearCart()
    } catch {
      toast.error('Error al registrar la venta')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button
      className="w-full bg-green-600 text-white hover:bg-green-700 h-12 text-base font-semibold"
      size="lg"
      disabled={isDisabled}
      onClick={handleRegisterSale}
    >
      {isProcessing ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CheckCircle className="size-5" />
          Registrar Venta
        </>
      )}
    </Button>
  )
}
