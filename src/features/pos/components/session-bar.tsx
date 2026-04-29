import { useState, useEffect, useCallback } from 'react'
import { Clock, DollarSign, ShoppingBag, LockOpen, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useFormatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  usePOSCurrentSession,
  useOpenSession,
  useCloseSession,
} from '@/features/pos/api/pos-api'
import { usePOSStore } from '@/features/pos/store/pos-store'

function formatElapsedTime(openedAt: string): string {
  const start = new Date(openedAt).getTime()
  const now = Date.now()
  const diffMs = now - start
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}


export function SessionBar() {
  const [openDialogOpen, setOpenDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('')
  const [closingBalance, setClosingBalance] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [elapsed, setElapsed] = useState('')

  const fmt = useFormatCurrency()
  const { data: sessionResponse, isLoading } = usePOSCurrentSession()
  const session = sessionResponse?.data ?? null
  const openSessionMutation = useOpenSession()
  const closeSessionMutation = useCloseSession()
  const setSession = usePOSStore((state) => state.setSession)

  useEffect(() => {
    setSession(session)
  }, [session, setSession])

  useEffect(() => {
    if (!session?.opened_at) return

    setElapsed(formatElapsedTime(session.opened_at))

    const interval = setInterval(() => {
      setElapsed(formatElapsedTime(session.opened_at))
    }, 60_000)

    return () => clearInterval(interval)
  }, [session?.opened_at])

  const handleOpenSession = useCallback(() => {
    const balance = parseFloat(openingBalance)
    if (isNaN(balance) || balance < 0) {
      toast.error('Ingresa un monto de apertura válido')
      return
    }

    openSessionMutation.mutate(
      { opening_balance: balance },
      {
        onSuccess: (response) => {
          setSession(response?.data ?? null)
          setOpenDialogOpen(false)
          setOpeningBalance('')
          toast.success('Caja abierta correctamente')
        },
        onError: () => {
          toast.error('Error al abrir la caja')
        },
      }
    )
  }, [openingBalance, openSessionMutation, setSession])

  const handleCloseSession = useCallback(() => {
    const balance = parseFloat(closingBalance)
    if (isNaN(balance) || balance < 0) {
      toast.error('Ingresa un monto de cierre válido')
      return
    }

    closeSessionMutation.mutate(
      { closing_balance: balance, notes: closingNotes },
      {
        onSuccess: () => {
          setSession(null)
          setCloseDialogOpen(false)
          setClosingBalance('')
          setClosingNotes('')
          toast.success('Caja cerrada correctamente')
        },
        onError: () => {
          toast.error('Error al cerrar la caja')
        },
      }
    )
  }, [closingBalance, closingNotes, closeSessionMutation, setSession])

  if (isLoading) {
    return (
      <div className="flex h-14 items-center justify-center border-b bg-card px-4">
        <span className="text-muted-foreground text-sm">Cargando sesión...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <div className="flex h-14 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-2">
            <Lock className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm font-medium">
              Caja Cerrada
            </span>
          </div>
          <Button size="sm" onClick={() => setOpenDialogOpen(true)}>
            <LockOpen className="size-4" />
            Abrir Caja
          </Button>
        </div>

        <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caja</DialogTitle>
              <DialogDescription>
                Ingresa el monto inicial en caja para comenzar la sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="opening-balance" className="text-sm font-medium">
                  Monto de apertura                 </label>
                <Input
                  id="opening-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenSession}
                disabled={openSessionMutation.isPending}
              >
                {openSessionMutation.isPending ? 'Abriendo...' : 'Abrir Caja'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LockOpen className="size-4 text-green-600" />
            <span className="text-sm font-medium">{session.name}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-sm">{elapsed}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1.5">
            <ShoppingBag className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-sm">
              {session.total_transactions ?? 0} ventas
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1.5">
            <DollarSign className="text-muted-foreground size-3.5" />
            <Badge variant="secondary">
              {fmt(session.total_sales ?? 0)}
            </Badge>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setCloseDialogOpen(true)}
        >
          <Lock className="size-4" />
          Cerrar Caja
        </Button>
      </div>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>
              Ingresa el monto final en caja y notas adicionales para cerrar la
              sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="closing-balance" className="text-sm font-medium">
                Monto de cierre               </label>
              <Input
                id="closing-balance"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="closing-notes" className="text-sm font-medium">
                Notas (opcional)
              </label>
              <Input
                id="closing-notes"
                placeholder="Notas de cierre..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseSession}
              disabled={closeSessionMutation.isPending}
            >
              {closeSessionMutation.isPending ? 'Cerrando...' : 'Cerrar Caja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

