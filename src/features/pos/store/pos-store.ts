import { create } from 'zustand'
import { useAuthStore } from '@/stores/auth-store'

export interface CartItem {
  product_id: string
  product_name: string
  product_identifier: string
  product_image: string
  qty: number
  unit_price: number
  discount: number
}

export interface CartPayment {
  payment_method_id: string
  payment_method_name: string
  payment_sub_method_id: string | null
  payment_sub_method_name: string | null
  amount: number
  reference: string
}

export interface POSSessionData {
  id: string
  name: string
  opening_balance: number
  total_sales: number
  total_transactions: number
  state: string
  opened_at: string
}

interface POSState {
  // Session
  session: POSSessionData | null
  setSession: (session: POSSessionData | null) => void

  // Customer
  customerId: string | null
  customerName: string | null
  setCustomer: (id: string | null, name: string | null) => void

  // Cart items
  items: CartItem[]
  addItem: (product: {
    id: string
    name: string
    identifier: string
    image: string
    base_price: number
    current_stock: number
  }) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  updateDiscount: (productId: string, discount: number) => void
  clearCart: () => void

  // Payments
  payments: CartPayment[]
  addPayment: (payment: CartPayment) => void
  removePayment: (index: number) => void
  updatePaymentAmount: (index: number, amount: number) => void
  clearPayments: () => void

  // UI state
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void

  // Computed helpers
  getSubtotal: () => number
  getTaxAmount: () => number
  getTotal: () => number
  getTotalPaid: () => number
  getRemaining: () => number
}

function getOrgTaxConfig() {
  const user = useAuthStore.getState().auth.user
  return {
    taxRate: user?.tax_rate ?? 16,
    taxIncluded: user?.tax_included ?? true,
  }
}

export const usePOSStore = create<POSState>((set, get) => ({
  // Session
  session: null,
  setSession: (session) => set({ session }),

  // Customer
  customerId: null,
  customerName: null,
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),

  // Cart items
  items: [],
  addItem: (product) =>
    set((state) => {
      if (product.current_stock <= 0) return state

      const existing = state.items.find((i) => i.product_id === product.id)
      if (existing) {
        if (existing.qty >= product.current_stock) return state
        return {
          items: state.items.map((i) =>
            i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            product_id: product.id,
            product_name: product.name,
            product_identifier: product.identifier || '',
            product_image: product.image || '',
            qty: 1,
            unit_price: product.base_price,
            discount: 0,
          },
        ],
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    })),

  updateQty: (productId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.product_id !== productId) }
      }
      return {
        items: state.items.map((i) =>
          i.product_id === productId ? { ...i, qty } : i
        ),
      }
    }),

  updateDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId ? { ...i, discount } : i
      ),
    })),

  clearCart: () => set({ items: [], payments: [], customerId: null, customerName: null }),

  // Payments
  payments: [],
  addPayment: (payment) =>
    set((state) => ({ payments: [...state.payments, payment] })),

  removePayment: (index) =>
    set((state) => ({
      payments: state.payments.filter((_, i) => i !== index),
    })),

  updatePaymentAmount: (index, amount) =>
    set((state) => ({
      payments: state.payments.map((p, i) =>
        i === index ? { ...p, amount } : p
      ),
    })),

  clearPayments: () => set({ payments: [] }),

  // UI
  isProcessing: false,
  setIsProcessing: (v) => set({ isProcessing: v }),

  // Computed
  getSubtotal: () => {
    const { taxRate, taxIncluded } = getOrgTaxConfig()
    const lineTotal = get().items.reduce((sum, item) => {
      return sum + item.qty * item.unit_price * (1 - item.discount / 100)
    }, 0)
    if (taxIncluded) {
      // Price includes tax — extract the net subtotal
      return lineTotal / (1 + taxRate / 100)
    }
    return lineTotal
  },

  getTaxAmount: () => {
    const { taxRate, taxIncluded } = getOrgTaxConfig()
    const lineTotal = get().items.reduce((sum, item) => {
      return sum + item.qty * item.unit_price * (1 - item.discount / 100)
    }, 0)
    if (taxIncluded) {
      return lineTotal - lineTotal / (1 + taxRate / 100)
    }
    return lineTotal * (taxRate / 100)
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTaxAmount()
  },

  getTotalPaid: () => {
    return get().payments.reduce((sum, p) => sum + p.amount, 0)
  },

  getRemaining: () => {
    return Math.max(0, get().getTotal() - get().getTotalPaid())
  },
}))
