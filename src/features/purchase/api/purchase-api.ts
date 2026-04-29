import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Types
export interface PurchaseProduct {
  id: string
  name: string
  image: string
  identifier: string
  base_price: number
  cost_price: number
  min_stock_qty: number
  reorder_qty: number
  category?: { id: string; name: string }
  current_stock: number
}

export interface PurchaseSupplier {
  id: string
  name: string
}

export interface PurchaseWarehouse {
  id: string
  name: string
  code: string
}

export interface PurchaseCategory {
  id: string
  name: string
}

// Queries
export function usePurchaseProducts(params: {
  search?: string
  categoryId?: string
  limit?: number
}) {
  const limit = params.limit || 20
  return useInfiniteQuery({
    queryKey: ['purchase-products', params.search, params.categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/pos/purchase/products', {
        params: {
          search: params.search || '',
          category_id: params.categoryId || '',
          page: pageParam,
          limit,
        },
      })
      return data as {
        success: boolean
        data: PurchaseProduct[]
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

export function usePurchaseSuppliers() {
  return useQuery({
    queryKey: ['purchase-suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/pos/purchase/suppliers')
      return data as { success: boolean; data: PurchaseSupplier[] }
    },
    staleTime: 60_000,
  })
}

export function usePurchaseWarehouses() {
  return useQuery({
    queryKey: ['purchase-warehouses'],
    queryFn: async () => {
      const { data } = await api.get('/pos/purchase/warehouses')
      return data as { success: boolean; data: PurchaseWarehouse[] }
    },
    staleTime: 60_000,
  })
}

export function usePurchaseLowStock() {
  return useQuery({
    queryKey: ['purchase-low-stock'],
    queryFn: async () => {
      const { data } = await api.get('/pos/purchase/low-stock')
      return data as { success: boolean; data: PurchaseProduct[] }
    },
    staleTime: 30_000,
  })
}

export function usePurchaseCategories() {
  return useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      const { data } = await api.get('/pos/categories')
      return data as { success: boolean; data: PurchaseCategory[] }
    },
    staleTime: 60_000,
  })
}

// Mutation
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      supplier_id: string | null
      warehouse_id: string | null
      state?: 'draft' | 'confirmed'
      expected_date: string
      notes: string
      items: {
        product_id: string
        product_name: string
        product_identifier: string
        qty: number
        unit_price: number
      }[]
    }) => {
      const { data } = await api.post('/pos/purchase/orders', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-products'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-low-stock'] })
    },
  })
}
