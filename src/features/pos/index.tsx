import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { SessionBar } from './components/session-bar'
import { ProductSearch } from './components/product-search'
import { CategoryTabs } from './components/category-tabs'
import { ProductGrid } from './components/product-grid'
import { CartPanel } from './components/cart-panel'

export function POSPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const user = useAuthStore((s) => s.auth.user)
  const checkoutMode = user?.checkout_mode ?? 'integrated'

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Session Bar — only in integrated mode (seller = cashier) */}
      {checkoutMode === 'integrated' && <SessionBar />}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Products Panel */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4 min-h-0">
          <ProductSearch value={search} onChange={setSearch} />
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <ProductGrid search={search} categoryId={selectedCategory} />
        </div>

        {/* Cart Panel */}
        <CartPanel />
      </div>
    </div>
  )
}
