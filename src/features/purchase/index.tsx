import { useState } from 'react'
import { SupplierBar } from './components/supplier-bar'
import { PurchaseProductSearch } from './components/purchase-product-search'
import { PurchaseCategoryTabs } from './components/purchase-category-tabs'
import { PurchaseProductGrid } from './components/purchase-product-grid'
import { OrderPanel } from './components/order-panel'

export function PurchasePage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Supplier Bar */}
      <SupplierBar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Products Panel */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4 min-h-0">
          <PurchaseProductSearch value={search} onChange={setSearch} />
          <PurchaseCategoryTabs
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <PurchaseProductGrid search={search} categoryId={selectedCategory} />
        </div>

        {/* Order Panel */}
        <OrderPanel />
      </div>
    </div>
  )
}
