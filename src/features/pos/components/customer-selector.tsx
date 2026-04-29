import { useState, useEffect, useCallback } from 'react'
import { User, X, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { usePOSStore } from '@/features/pos/store/pos-store'
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

interface CustomerResult {
  value: string
  label: string
  description: string
}

export function CustomerSelector() {
  const customerId = usePOSStore((s) => s.customerId)
  const customerName = usePOSStore((s) => s.customerName)

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<CustomerResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const searchCustomers = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const { data } = await api.get('/search/customers', {
        params: { q },
      })
      setResults(data.data ?? data ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchCustomers(searchTerm)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm, searchCustomers])

  const handleSelect = (customer: CustomerResult) => {
    usePOSStore.getState().setCustomer(customer.value, customer.label)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    usePOSStore.getState().setCustomer(null, null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
        >
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1 text-left">
            {customerName ?? 'Venta sin cliente'}
          </span>
          {customerId && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent)
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
            placeholder="Buscar cliente..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {!isLoading && searchTerm.length >= 2 && results.length === 0 && (
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            )}
            {!isLoading && results.length > 0 && (
              <CommandGroup>
                {results.map((customer) => (
                  <CommandItem
                    key={customer.value}
                    value={customer.value}
                    onSelect={() => handleSelect(customer)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-sm font-medium">{customer.label}</span>
                    {customer.description && (
                      <span className="text-xs text-muted-foreground">
                        {customer.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!isLoading && searchTerm.length < 2 && (
              <div className="flex flex-col items-center gap-1 py-6 text-muted-foreground">
                <Search className="size-5" />
                <span className="text-xs">Escribe al menos 2 caracteres</span>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
