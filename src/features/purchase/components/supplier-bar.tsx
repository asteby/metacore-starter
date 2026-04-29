import { useState, useEffect, useCallback } from 'react'
import { Truck, Warehouse, Search, X } from 'lucide-react'
import { api } from '@/lib/api'
import { usePurchaseStore } from '@/features/purchase/store/purchase-store'
import { usePurchaseWarehouses } from '@/features/purchase/api/purchase-api'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SupplierResult {
  value: string
  label: string
  description: string
}

export function SupplierBar() {
  const supplierId = usePurchaseStore((s) => s.supplierId)
  const supplierName = usePurchaseStore((s) => s.supplierName)
  const warehouseId = usePurchaseStore((s) => s.warehouseId)

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SupplierResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { data: warehousesRes } = usePurchaseWarehouses()
  const warehouses = warehousesRes?.data ?? []

  const searchSuppliers = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const { data } = await api.get('/search/suppliers', {
        params: { q },
      })
      setResults(data.data ?? data ?? [])
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchSuppliers(searchTerm)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm, searchSuppliers])

  const handleSelectSupplier = (supplier: SupplierResult) => {
    usePurchaseStore.getState().setSupplier(supplier.value, supplier.label)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClearSupplier = (e: React.MouseEvent) => {
    e.stopPropagation()
    usePurchaseStore.getState().setSupplier(null, null)
  }

  const handleWarehouseChange = (value: string) => {
    const warehouse = warehouses.find((w) => w.id === value)
    if (warehouse) {
      usePurchaseStore.getState().setWarehouse(warehouse.id, warehouse.name)
    }
  }

  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-4">
      {/* Left side: Supplier selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-72 justify-start gap-2 font-normal"
          >
            <Truck className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-left">
              {supplierName ?? 'Selecciona un proveedor'}
            </span>
            {supplierId && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearSupplier}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleClearSupplier(e as unknown as React.MouseEvent)
                }}
                className="ml-auto shrink-0 rounded-sm p-0.5 hover:bg-accent"
              >
                <X className="size-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isSearching && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Buscando...
                </div>
              )}
              {!isSearching && searchTerm.length >= 2 && results.length === 0 && (
                <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
              )}
              {!isSearching && results.length > 0 && (
                <CommandGroup>
                  {results.map((supplier) => (
                    <CommandItem
                      key={supplier.value}
                      value={supplier.value}
                      onSelect={() => handleSelectSupplier(supplier)}
                      className="flex flex-col items-start gap-0.5"
                    >
                      <span className="text-sm font-medium">
                        {supplier.label}
                      </span>
                      {supplier.description && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.description}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!isSearching && searchTerm.length < 2 && (
                <div className="flex flex-col items-center gap-1 py-6 text-muted-foreground">
                  <Search className="size-5" />
                  <span className="text-xs">Escribe al menos 2 caracteres</span>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Right side: Warehouse selector */}
      <div className="flex items-center gap-2">
        <Warehouse className="size-4 text-muted-foreground" />
        <Select value={warehouseId ?? ''} onValueChange={handleWarehouseChange}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Selecciona almacén" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
