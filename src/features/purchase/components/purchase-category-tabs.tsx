import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePurchaseCategories } from '@/features/purchase/api/purchase-api'
import { cn } from '@/lib/utils'

interface PurchaseCategoryTabsProps {
  selectedCategory: string | null
  onSelect: (categoryId: string | null) => void
}

export function PurchaseCategoryTabs({ selectedCategory, onSelect }: PurchaseCategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: categoriesRes, isLoading } = usePurchaseCategories()
  const categories = categoriesRes?.data ?? []

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto py-2 scrollbar-none"
    >
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        className={cn('shrink-0', selectedCategory === null && 'shadow-sm')}
        onClick={() => onSelect(null)}
      >
        Todos
      </Button>
      {categories?.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'shrink-0',
            selectedCategory === category.id && 'shadow-sm'
          )}
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
