import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn, getImageUrl } from '@/lib/utils'
import { fmtCurrency } from '@/lib/format'
import type { POSProduct } from '@/features/pos/api/pos-api'

interface ProductCardProps {
  product: POSProduct
  onClick: () => void
}

function StockBadge({ currentStock, minStockQty }: { currentStock: number; minStockQty: number }) {
  if (currentStock <= 0) {
    return (
      <Badge className="bg-red-500/15 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800">
        Sin stock
      </Badge>
    )
  }

  if (currentStock <= minStockQty) {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800">
        Stock bajo
      </Badge>
    )
  }

  return (
    <Badge className="bg-green-500/15 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800">
      {currentStock}
    </Badge>
  )
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const outOfStock = product.current_stock <= 0

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden p-0 transition-all duration-200',
        outOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={outOfStock ? undefined : onClick}
    >
      <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
        {product.image ? (
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="text-muted-foreground size-10 opacity-40" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StockBadge
            currentStock={product.current_stock}
            minStockQty={product.min_stock_qty}
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <span className="line-clamp-2 text-sm font-medium leading-tight">
          {product.name}
        </span>
        {product.identifier && (
          <span className="text-muted-foreground text-xs font-mono truncate">
            {product.identifier}
          </span>
        )}
        <span className="text-primary text-sm font-semibold">
          {fmtCurrency(product.base_price)}
        </span>
      </div>
    </Card>
  )
}
