import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DynamicTable } from '@/components/dynamic/dynamic-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useMemo, useState } from 'react'
import { DataTableColumnHeader } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { ProductCreateDialog } from '@/components/dynamic/product-create-dialog'
import { ProductViewDialog } from '@/components/dynamic/product-view-dialog'

type ProductSearch = {
    f_category_id?: string
}

export const Route = createFileRoute('/_authenticated/products/')({
    validateSearch: (search: Record<string, unknown>): ProductSearch => {
        return {
            f_category_id: (search.f_category_id as string) || undefined,
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { t } = useTranslation()
    const { f_category_id } = Route.useSearch()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // View Dialog State
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [viewId, setViewId] = useState<string | null>(null)

    // Fetch category with its detail types to build dynamic columns
    const { data: categoryData } = useQuery({
        queryKey: ['category-details', f_category_id],
        queryFn: async () => {
            if (!f_category_id) return null
            // We use the category show endpoint (which preloads DetailTypes because we added them to the struct)
            const res = await api.get(`/data/categories/me/${f_category_id}`)
            return res.data.success ? res.data.data : null
        },
        enabled: !!f_category_id,
    })

    // Build dynamic columns from category detail types
    const extraColumns = useMemo(() => {
        if (!categoryData?.detail_types) return []

        return categoryData.detail_types.map((dt: any) => ({
            id: `detail_${dt.id}`,
            accessorKey: `detail_values`,
            header: ({ column }: any) => (
                <DataTableColumnHeader column={column} title={dt.name} />
            ),
            cell: ({ row }: any) => {
                const values = row.original.detail_values || []
                const valueObj = values.find((v: any) => v.detail_type_id === dt.id)
                if (!valueObj) return <span className="text-muted-foreground">-</span>

                if (dt.type === 'color') {
                    return (
                        <div className="flex items-center gap-2">
                            <div
                                className="h-4 w-4 rounded-full border border-border"
                                style={{ backgroundColor: valueObj.value }}
                            />
                            <span className="text-sm">{valueObj.value}</span>
                        </div>
                    )
                }

                if (dt.type === 'badge' || dt.type === 'select') {
                    return <Badge variant="outline">{valueObj.value}</Badge>
                }

                return <span className="text-sm font-medium">{valueObj.value}</span>
            }
        }))
    }, [categoryData])

    const handleAction = (action: string, row: any) => {
        if (action === 'view') {
            setViewId(row.id)
            setIsViewOpen(true)
        }
        if (action === 'edit') {
            setViewId(row.id) // Reuse viewId state as "selectedId" or create a new one? 
            // Better to differentiate or rename viewId to selectedId. 
            // But for minimal changes, let's add a new state for editId.
            setEditId(row.id)
            setIsCreateOpen(true)
        }
    }

    // Add editId state
    const [editId, setEditId] = useState<string | null>(null)

    return (
        <div className='flex flex-col h-full p-8 gap-4 overflow-hidden'>
            <div className='flex items-center justify-between shrink-0'>
                <h1 className='text-2xl font-bold tracking-tight'>
                    {f_category_id ? t('products.products_category', { category: categoryData?.name || t('products.loading') }) : t('products.all_products')}
                </h1>
                <Button onClick={() => {
                    setEditId(null)
                    setIsCreateOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('products.new_product')}
                </Button>
            </div>
            <div className='flex-1 min-h-0'>
                <DynamicTable
                    key={f_category_id || 'all'}
                    model="products"
                    endpoint="/data/products/me"
                    defaultFilters={f_category_id ? { category_id: f_category_id } : {}}
                    hiddenColumns={f_category_id ? ['category.name'] : []}
                    extraColumns={extraColumns}
                    refreshTrigger={refreshTrigger}
                    onAction={handleAction}
                />
            </div>

            <ProductCreateDialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) setEditId(null)
                }}
                productId={editId}
                defaultCategoryId={f_category_id}
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            />

            <ProductViewDialog
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
                productId={viewId}
            />
        </div>
    )
}
