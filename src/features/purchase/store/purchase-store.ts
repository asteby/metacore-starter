import { create } from 'zustand'

export interface PurchaseItem {
  product_id: string
  product_name: string
  product_identifier: string
  qty: number
  unit_price: number // cost price
}

interface PurchaseState {
  // Supplier
  supplierId: string | null
  supplierName: string | null
  setSupplier: (id: string | null, name: string | null) => void

  // Warehouse
  warehouseId: string | null
  warehouseName: string | null
  setWarehouse: (id: string | null, name: string | null) => void

  // Items
  items: PurchaseItem[]
  addItem: (product: {
    id: string
    name: string
    identifier: string
    cost_price: number
  }) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  updatePrice: (productId: string, price: number) => void
  clearOrder: () => void

  // Notes & date
  notes: string
  setNotes: (notes: string) => void
  expectedDate: string
  setExpectedDate: (date: string) => void

  // UI
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void

  // Computed
  getSubtotal: () => number
  getTaxAmount: () => number
  getTotal: () => number
}

const TAX_RATE = 16

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  // Supplier
  supplierId: null,
  supplierName: null,
  setSupplier: (id, name) => set({ supplierId: id, supplierName: name }),

  // Warehouse
  warehouseId: null,
  warehouseName: null,
  setWarehouse: (id, name) => set({ warehouseId: id, warehouseName: name }),

  // Items
  items: [],
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.id)
      if (existing) {
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
            qty: 1,
            unit_price: product.cost_price,
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

  updatePrice: (productId, price) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId ? { ...i, unit_price: price } : i
      ),
    })),

  clearOrder: () =>
    set({
      items: [],
      supplierId: null,
      supplierName: null,
      warehouseId: null,
      warehouseName: null,
      notes: '',
      expectedDate: '',
    }),

  // Notes & date
  notes: '',
  setNotes: (notes) => set({ notes }),
  expectedDate: '',
  setExpectedDate: (date) => set({ expectedDate: date }),

  // UI
  isProcessing: false,
  setIsProcessing: (v) => set({ isProcessing: v }),

  // Computed
  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + item.qty * item.unit_price
    }, 0)
  },

  getTaxAmount: () => {
    return get().getSubtotal() * (TAX_RATE / 100)
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTaxAmount()
  },
}))
