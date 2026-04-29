import { useMemo, useRef, useEffect } from 'react'
import { PackageSearch, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { usePOSProducts } from '@/features/pos/api/pos-api'
import { usePOSStore } from '@/features/pos/store/pos-store'
import { ProductCard } from '@/features/pos/components/product-card'

interface ProductGridProps {
  search: string
  categoryId: string | null
}

export function ProductGrid({ search, categoryId }: ProductGridProps) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePOSProducts({ search, categoryId: categoryId ?? undefined })

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  )

  const cartItems = usePOSStore((s) => s.items)

  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of cartItems) {
      map.set(item.product_id, item.qty)
    }
    return map
  }, [cartItems])

  const adjustedProducts = useMemo(() => {
    return products.map((p) => {
      const inCart = cartQtyMap.get(p.id) ?? 0
      return inCart > 0 ? { ...p, current_stock: p.current_stock - inCart } : p
    })
  }, [products, cartQtyMap])

  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root, rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleProductClick = (product: (typeof products)[number]) => {
    usePOSStore.getState().addItem(product)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-0 overflow-hidden rounded-xl border shadow-sm">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <PackageSearch className="text-muted-foreground size-12" />
        <p className="text-muted-foreground text-sm">
          No se encontraron productos
        </p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid content-start grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {adjustedProducts.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => handleProductClick(products[idx])}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        )}
      </div>
    </div>
  )
}
