import { useState, useEffect } from 'react'
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  X,
  CheckCircle,
  Loader2,
  Printer,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePOSStore } from '@/features/pos/store/pos-store'
import { useAuthStore } from '@/stores/auth-store'
import { useFormatCurrency } from '@/lib/format'
import { usePOSPaymentMethods, useCreatePOSSale, type POSPaymentMethod } from '@/features/pos/api/pos-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PrintTemplate, usePrint } from '@/components/print'
import type { PrintDocument } from '@/components/print'

const iconMap: Record<string, LucideIcon> = {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
}

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Wallet
}

interface CartPayment {
  payment_method_id: string
  payment_method_name: string
  payment_sub_method_id: string | null
  payment_sub_method_name: string | null
  amount: number
  reference: string
}

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  const { data: methodsData } = usePOSPaymentMethods()
  const createSale = useCreatePOSSale()
  const formatMXN = useFormatCurrency()
  const items = usePOSStore((s) => s.items)
  const customerId = usePOSStore((s) => s.customerId)
  const clearCart = usePOSStore((s) => s.clearCart)
  const user = useAuthStore((s) => s.auth.user)

  const taxRate = user?.tax_rate ?? 16
  const taxIncluded = user?.tax_included ?? true

  const [payments, setPayments] = useState<CartPayment[]>([])
  const [selectedMethod, setSelectedMethod] = useState<POSPaymentMethod | null>(null)
  const [selectedSubMethodId, setSelectedSubMethodId] = useState<string | null>(null)
  const [selectedSubMethodName, setSelectedSubMethodName] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedSale, setCompletedSale] = useState<{ number: string; doc: PrintDocument } | null>(null)
  const { contentRef, handlePrint } = usePrint('ticket')
  const autoPrint = user?.auto_print ?? false

  // Auto-print when sale completes and auto_print is enabled
  useEffect(() => {
    if (completedSale && autoPrint) {
      // Small delay to ensure PrintTemplate has rendered
      const timer = setTimeout(() => handlePrint(), 300)
      return () => clearTimeout(timer)
    }
  }, [completedSale, autoPrint, handlePrint])

  const methods = methodsData?.data ?? []

  const lineTotal = items.reduce((sum, item) =>
    sum + item.qty * item.unit_price * (1 - item.discount / 100), 0)

  let subtotal: number, tax: number, total: number
  if (taxIncluded) {
    subtotal = lineTotal / (1 + taxRate / 100)
    tax = lineTotal - subtotal
    total = lineTotal
  } else {
    subtotal = lineTotal
    tax = lineTotal * (taxRate / 100)
    total = subtotal + tax
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = total - totalPaid

  const resetSelection = () => {
    setSelectedMethod(null)
    setSelectedSubMethodId(null)
    setSelectedSubMethodName(null)
    setAmount('')
    setReference('')
  }

  const handleSelectMethod = (method: POSPaymentMethod) => {
    setSelectedMethod(method)
    setSelectedSubMethodId(null)
    setSelectedSubMethodName(null)
    setAmount(Math.max(remaining, 0).toFixed(2))
    setReference('')
  }

  const handleAddPayment = () => {
    if (!selectedMethod) return
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return
    if (selectedMethod.sub_methods.length > 0 && !selectedSubMethodId) return

    setPayments([...payments, {
      payment_method_id: selectedMethod.id,
      payment_method_name: selectedMethod.name,
      payment_sub_method_id: selectedSubMethodId,
      payment_sub_method_name: selectedSubMethodName,
      amount: parsedAmount,
      reference,
    }])
    resetSelection()
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const canConfirm = totalPaid >= total && items.length > 0

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsProcessing(true)

    try {
      const res = await createSale.mutateAsync({
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

      const saleNumber = res?.data?.sales_order?.number || ''
      const session = usePOSStore.getState().session
      const customerName = usePOSStore.getState().customerName

      // Build print document before clearing cart
      const printDoc: PrintDocument = {
        title: 'Ticket de Venta',
        number: saleNumber,
        date: new Date().toISOString(),
        cashier: user?.name,
        session: session?.name,
        party: customerName
          ? { label: 'Cliente', name: customerName }
          : undefined,
        items: items.map((item) => ({
          qty: item.qty,
          description: item.product_name,
          identifier: item.product_identifier,
          unit_price: item.unit_price,
          discount: item.discount || undefined,
          total: item.qty * item.unit_price * (1 - item.discount / 100),
        })),
        subtotal,
        tax: { label: `IVA (${taxRate}%)`, amount: tax, included: taxIncluded },
        total,
        payments: payments.map((p) => ({
          method: p.payment_method_name +
            (p.payment_sub_method_name ? ` — ${p.payment_sub_method_name}` : ''),
          amount: p.amount,
          reference: p.reference || undefined,
        })),
        totalPaid,
        change: totalPaid > total ? totalPaid - total : undefined,
      }

      setCompletedSale({ number: saleNumber, doc: printDoc })
      toast.success('Venta registrada exitosamente')
      clearCart()
      setPayments([])
      resetSelection()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr?.response?.data?.message || 'Error al registrar la venta'
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setPayments([])
      resetSelection()
      setCompletedSale(null)
    }
    onOpenChange(v)
  }

  const handleNewSale = () => {
    setCompletedSale(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden p-0">
        {/* ── Sale completed screen ── */}
        {completedSale ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="size-8 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">Venta Registrada</h2>
                {completedSale.number && (
                  <p className="text-muted-foreground mt-1 text-sm font-mono">
                    {completedSale.number}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-4 w-full max-w-xs">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={handlePrint}
                >
                  <Printer className="size-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleNewSale}
                >
                  <RotateCcw className="size-4 mr-2" />
                  Nueva Venta
                </Button>
              </div>
            </div>
            <PrintTemplate ref={contentRef} document={completedSale.doc} size="ticket" />
          </>
        ) : (
        <>
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle>Cobrar Venta</DialogTitle>
        </DialogHeader>

        {/* Total banner */}
        <div className="mx-6 rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-sm text-muted-foreground space-y-0.5">
            <div className="flex gap-6">
              <span>Subtotal: {formatMXN(subtotal)}</span>
              <span>IVA ({taxRate}%){taxIncluded ? ' incl.' : ''}: {formatMXN(tax)}</span>
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums">{formatMXN(total)}</div>
        </div>

        {/* Two column layout */}
        <div className="flex flex-1 min-h-0 px-6 pb-4 gap-4">
          {/* Left: Payment methods */}
          <div className="w-1/2 flex flex-col gap-3 overflow-y-auto">
            {!selectedMethod ? (
              <div className="grid grid-cols-2 gap-2">
                {methods.map((method) => {
                  const Icon = getIcon(method.icon)
                  return (
                    <Button
                      key={method.id}
                      variant="outline"
                      className="flex h-auto flex-col gap-1.5 py-3"
                      onClick={() => handleSelectMethod(method)}
                    >
                      <Icon className="size-5" />
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  )
                })}
              </div>
            ) : selectedMethod.sub_methods.length > 0 && !selectedSubMethodId ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{selectedMethod.name}</span>
                  <Button variant="ghost" size="sm" onClick={resetSelection}>Cambiar</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedMethod.sub_methods.map((sub) => (
                    <Button
                      key={sub.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubMethodId(sub.id)
                        setSelectedSubMethodName(sub.name)
                      }}
                    >
                      {sub.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedMethod.name}
                    {selectedSubMethodName ? ` — ${selectedSubMethodName}` : ''}
                  </span>
                  <Button variant="ghost" size="sm" onClick={resetSelection}>Cambiar</Button>
                </div>
                <Input
                  type="number"
                  placeholder="Monto"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={0}
                  step={0.01}
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Referencia (opcional)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <Button onClick={handleAddPayment} className="w-full">
                  Agregar Pago
                </Button>
              </div>
            )}
          </div>

          {/* Right: Added payments + summary */}
          <div className="w-1/2 flex flex-col gap-3 overflow-y-auto">
            {payments.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Agrega un método de pago
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {payment.payment_method_name}
                        {payment.payment_sub_method_name ? ` — ${payment.payment_sub_method_name}` : ''}
                      </span>
                      {payment.reference && (
                        <span className="text-xs text-muted-foreground truncate">Ref: {payment.reference}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">{formatMXN(payment.amount)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removePayment(index)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 space-y-1 mt-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagado</span>
                <span className="font-semibold tabular-nums">{formatMXN(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restante</span>
                <span className={`font-semibold tabular-nums ${remaining > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatMXN(Math.max(remaining, 0))}
                </span>
              </div>
              {totalPaid > total && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cambio</span>
                  <span className="font-semibold tabular-nums text-green-600">
                    {formatMXN(totalPaid - total)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirm button - always at bottom */}
        <div className="shrink-0 border-t px-6 py-4">
          <Button
            className="w-full bg-green-600 text-white hover:bg-green-700 h-12 text-base font-semibold"
            size="lg"
            disabled={!canConfirm || isProcessing}
            onClick={handleConfirm}
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="size-5" />
                Confirmar Venta
              </>
            )}
          </Button>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  )
}
