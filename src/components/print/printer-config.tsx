import { Printer, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

const WIDTHS = [
  { value: 58, label: '58', desc: 'Portatil' },
  { value: 80, label: '80', desc: 'Estandar' },
  { value: 110, label: '110', desc: 'Cocina' },
] as const

const COPIES = [1, 2, 3] as const

export function PrinterConfig() {
  const user = useAuthStore((s) => s.auth.user)
  const setUser = useAuthStore((s) => s.auth.setUser)
  const activeWidth = user?.ticket_width || 80
  const activeCopies = user?.print_copies || 1
  const autoPrint = user?.auto_print ?? false

  const update = async (data: { ticket_width?: number; print_copies?: number; auto_print?: boolean }) => {
    try {
      const res = await api.put('/users/me/print', data)
      if (res.data.success) {
        setUser(res.data.data)
      }
    } catch {
      toast.error('Error al guardar preferencia')
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-9 w-9'>
          <Printer className='size-[1.2rem]' />
          <span className='absolute -bottom-0.5 -right-0.5 text-[9px] font-bold bg-muted text-muted-foreground rounded px-0.5 leading-tight'>
            {activeWidth}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-3' align='end'>
        <p className='text-xs font-semibold mb-3'>Impresora</p>

        <p className='text-[11px] text-muted-foreground mb-1'>Ancho de papel</p>
        <div className='flex gap-1 mb-3'>
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              onClick={() => update({ ticket_width: w.value })}
              className={`flex-1 rounded-md border px-2 py-1.5 text-center text-xs transition-colors ${
                activeWidth === w.value
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <div className='font-medium'>{w.label}</div>
              <div className='text-[10px] text-muted-foreground'>{w.desc}</div>
            </button>
          ))}
        </div>

        <p className='text-[11px] text-muted-foreground mb-1'>Copias por ticket</p>
        <div className='flex gap-1 mb-3'>
          {COPIES.map((n) => (
            <button
              key={n}
              onClick={() => update({ print_copies: n })}
              className={`flex-1 rounded-md border px-2 py-1.5 text-center text-xs transition-colors ${
                activeCopies === n
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:bg-accent'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <Separator className='my-2' />

        <button
          onClick={() => update({ auto_print: !autoPrint })}
          className='flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-xs hover:bg-accent transition-colors'
        >
          <span>Imprimir al completar accion</span>
          <div className={`size-4 rounded border flex items-center justify-center transition-colors ${
            autoPrint ? 'bg-primary border-primary' : 'border-border'
          }`}>
            {autoPrint && <Check className='size-3 text-primary-foreground' />}
          </div>
        </button>
      </PopoverContent>
    </Popover>
  )
}
