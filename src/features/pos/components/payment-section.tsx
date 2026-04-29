import { useState } from 'react'
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { usePOSStore } from '@/features/pos/store/pos-store'
import { useFormatCurrency } from '@/lib/format'
import { usePOSPaymentMethods, type POSPaymentMethod } from '@/features/pos/api/pos-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const iconMap: Record<string, LucideIcon> = {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
}

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Wallet
}

export function PaymentSection() {
  const fmt = useFormatCurrency()
  const { data: methodsData } = usePOSPaymentMethods()
  const payments = usePOSStore((s) => s.payments)
  const addPayment = usePOSStore((s) => s.addPayment)
  const removePayment = usePOSStore((s) => s.removePayment)
  const getTotalPaid = usePOSStore((s) => s.getTotalPaid)
  const getRemaining = usePOSStore((s) => s.getRemaining)

  const [selectedMethod, setSelectedMethod] = useState<POSPaymentMethod | null>(null)
  const [selectedSubMethodId, setSelectedSubMethodId] = useState<string | null>(null)
  const [selectedSubMethodName, setSelectedSubMethodName] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')

  const methods = methodsData?.data ?? []
  const remaining = getRemaining()
  const totalPaid = getTotalPaid()

  const handleSelectMethod = (method: POSPaymentMethod) => {
    setSelectedMethod(method)
    setSelectedSubMethodId(null)
    setSelectedSubMethodName(null)
    setAmount(remaining.toFixed(2))
    setReference('')
  }

  const handleSelectSubMethod = (subId: string, subName: string) => {
    setSelectedSubMethodId(subId)
    setSelectedSubMethodName(subName)
  }

  const handleAddPayment = () => {
    if (!selectedMethod) return
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    if (selectedMethod.sub_methods.length > 0 && !selectedSubMethodId) return

    addPayment({
      payment_method_id: selectedMethod.id,
      payment_method_name: selectedMethod.name,
      payment_sub_method_id: selectedSubMethodId,
      payment_sub_method_name: selectedSubMethodName,
      amount: parsedAmount,
      reference,
    })

    setSelectedMethod(null)
    setSelectedSubMethodId(null)
    setSelectedSubMethodName(null)
    setAmount('')
    setReference('')
  }

  const handleReset = () => {
    setSelectedMethod(null)
    setSelectedSubMethodId(null)
    setSelectedSubMethodName(null)
    setAmount('')
    setReference('')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Step 1: Payment method buttons */}
      {!selectedMethod && (
        <div className="grid grid-cols-3 gap-2">
          {methods.map((method) => {
            const Icon = getIcon(method.icon)
            return (
              <Button
                key={method.id}
                variant="outline"
                className="flex h-auto flex-col gap-1 py-3"
                onClick={() => handleSelectMethod(method)}
              >
                <Icon className="size-5" />
                <span className="text-xs">{method.name}</span>
              </Button>
            )
          })}
        </div>
      )}

      {/* Step 2: Sub-method selection */}
      {selectedMethod && selectedMethod.sub_methods.length > 0 && !selectedSubMethodId && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{selectedMethod.name}</span>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Cambiar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {selectedMethod.sub_methods.map((sub) => (
              <Button
                key={sub.id}
                variant="outline"
                size="sm"
                onClick={() => handleSelectSubMethod(sub.id, sub.name)}
              >
                {sub.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Amount input */}
      {selectedMethod &&
        (selectedMethod.sub_methods.length === 0 || selectedSubMethodId) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedMethod.name}
                {selectedSubMethodName ? ` - ${selectedSubMethodName}` : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Cambiar
              </Button>
            </div>
            <Input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step={0.01}
            />
            <Input
              type="text"
              placeholder="Referencia (opcional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            {/* Step 4: Add payment button */}
            <Button onClick={handleAddPayment} className="w-full">
              Agregar Pago
            </Button>
          </div>
        )}

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="flex flex-col gap-2">
          <Separator />
          {payments.map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {payment.payment_method_name}
                  {payment.payment_sub_method_name
                    ? ` - ${payment.payment_sub_method_name}`
                    : ''}
                </span>
                {payment.reference && (
                  <span className="text-xs text-muted-foreground">
                    Ref: {payment.reference}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {fmt(payment.amount)}
                </span>
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

      {/* Totals */}
      {payments.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total pagado</span>
            <span className="font-semibold tabular-nums">{fmt(totalPaid)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Restante</span>
            <span
              className={`font-semibold tabular-nums ${remaining > 0 ? 'text-destructive' : 'text-green-600'}`}
            >
              {fmt(remaining)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
