import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useBranchStore } from '@/stores/branch-store'

// Types
export interface POSProduct {
  id: string
  name: string
  image: string
  identifier: string
  base_price: number
  category_id: string
  category?: { id: string; name: string }
  brand?: { id: string; name: string }
  current_stock: number
  min_stock_qty: number
}

export interface POSCategory {
  id: string
  name: string
}

export interface POSPaymentSubMethod {
  id: string
  name: string
  code: string
}

export interface POSPaymentMethod {
  id: string
  name: string
  code: string
  icon: string
  sub_methods: POSPaymentSubMethod[]
}

export interface POSSession {
  id: string
  name: string
  opening_balance: number
  closing_balance: number | null
  expected_balance: number | null
  total_sales: number
  total_transactions: number
  state: string
  opened_at: string
  closed_at: string | null
}

// Queries
export function usePOSProducts(params: {
  search?: string
  categoryId?: string
  limit?: number
}) {
  const branchId = useBranchStore((s) => s.currentBranch?.id)
  const limit = params.limit || 20
  return useInfiniteQuery({
    queryKey: ['pos-products', params.search, params.categoryId, branchId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/pos/products', {
        params: {
          search: params.search || '',
          category_id: params.categoryId || '',
          page: pageParam,
          limit,
        },
      })
      return data as {
        success: boolean
        data: POSProduct[]
        meta: { page: number; limit: number; total: number; total_pages: number }
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.total_pages
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 30_000,
  })
}

export function usePOSCategories() {
  const branchId = useBranchStore((s) => s.currentBranch?.id)
  return useQuery({
    queryKey: ['pos-categories', branchId],
    queryFn: async () => {
      const { data } = await api.get('/pos/categories')
      return data as { success: boolean; data: POSCategory[] }
    },
    staleTime: 60_000,
  })
}

export function usePOSPaymentMethods() {
  const branchId = useBranchStore((s) => s.currentBranch?.id)
  return useQuery({
    queryKey: ['pos-payment-methods', branchId],
    queryFn: async () => {
      const { data } = await api.get('/pos/payment-methods')
      return data as { success: boolean; data: POSPaymentMethod[] }
    },
    staleTime: 60_000,
  })
}

export function usePOSCurrentSession() {
  const branchId = useBranchStore((s) => s.currentBranch?.id)
  return useQuery({
    queryKey: ['pos-session', branchId],
    queryFn: async () => {
      const { data } = await api.get('/pos/sessions/current')
      return data as { success: boolean; data: POSSession | null }
    },
    refetchInterval: 30_000,
  })
}

// Mutations
export function useOpenSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { opening_balance: number }) => {
      const { data } = await api.post('/pos/sessions/open', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-session'] })
    },
  })
}

export function useCloseSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { closing_balance: number; notes: string }) => {
      const { data } = await api.post('/pos/sessions/close', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-session'] })
    },
  })
}

export function useCreatePOSSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      customer_id: string | null
      items: {
        product_id: string
        product_name: string
        product_identifier: string
        qty: number
        unit_price: number
        discount: number
      }[]
      payments: {
        payment_method_id: string
        payment_sub_method_id: string | null
        amount: number
        reference: string
      }[]
      notes: string
    }) => {
      const { data } = await api.post('/pos/sales', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-session'] })
      queryClient.invalidateQueries({ queryKey: ['pos-products'] })
    },
  })
}

export function useCreatePOSOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      customer_id: string | null
      items: {
        product_id: string
        product_name: string
        product_identifier: string
        qty: number
        unit_price: number
        discount: number
      }[]
      notes: string
    }) => {
      const { data } = await api.post('/pos/orders', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-session'] })
      queryClient.invalidateQueries({ queryKey: ['pos-pending-orders'] })
    },
  })
}

// ── Cashier mode (separated checkout) ──

export interface PendingOrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  qty: number
  unit_price: number
  discount: number
  tax_amount: number
  sub_total: number
  total: number
}

export interface PendingOrder {
  id: string
  number: string
  customer_id: string | null
  seller_id: string | null
  sub_total: number
  tax_amount: number
  total: number
  state: string
  notes: string
  items: PendingOrderItem[]
  created_at: string
}

export function usePendingOrders() {
  const branchId = useBranchStore((s) => s.currentBranch?.id)
  return useQuery({
    queryKey: ['pos-pending-orders', branchId],
    queryFn: async () => {
      const { data } = await api.get('/pos/orders/pending')
      return data as { success: boolean; data: PendingOrder[] }
    },
    refetchInterval: 10_000,
  })
}

export function usePayOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, payments }: {
      orderId: string
      payments: {
        payment_method_id: string
        payment_sub_method_id: string | null
        amount: number
        reference: string
      }[]
    }) => {
      const { data } = await api.post(`/pos/orders/${orderId}/pay`, { payments })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending-orders'] })
      queryClient.invalidateQueries({ queryKey: ['pos-session'] })
      queryClient.invalidateQueries({ queryKey: ['pos-products'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/pos/orders/${orderId}/cancel`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-pending-orders'] })
    },
  })
}
