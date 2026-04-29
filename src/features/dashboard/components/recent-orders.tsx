import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

const ORDERS = [
  {
    id: 'OV-2024-0847',
    customer: 'María González',
    total: 2340.0,
    status: 'completed',
    date: '2h',
  },
  {
    id: 'OV-2024-0846',
    customer: 'Carlos Méndez',
    total: 890.5,
    status: 'processing',
    date: '3h',
  },
  {
    id: 'OV-2024-0845',
    customer: 'Ana López',
    total: 5670.0,
    status: 'pending',
    date: '5h',
  },
  {
    id: 'OV-2024-0844',
    customer: 'Roberto Silva',
    total: 1230.75,
    status: 'completed',
    date: '6h',
  },
  {
    id: 'OV-2024-0843',
    customer: 'Laura Torres',
    total: 3450.0,
    status: 'processing',
    date: '8h',
  },
  {
    id: 'OV-2024-0842',
    customer: 'Diego Ramírez',
    total: 780.25,
    status: 'pending',
    date: '12h',
  },
]

export function RecentOrders() {
  const { t } = useTranslation()

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const
      case 'processing':
        return 'secondary' as const
      case 'pending':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('dashboard.order_status.completed')
      case 'processing':
        return t('dashboard.order_status.processing')
      case 'pending':
        return t('dashboard.order_status.pending')
      default:
        return status
    }
  }

  return (
    <div className='space-y-3 max-h-[280px] overflow-auto pr-2'>
      {ORDERS.map((order) => (
        <div
          key={order.id}
          className='flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer'
        >
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium'>{order.id}</p>
              <Badge variant={getStatusVariant(order.status)} className='text-[10px] h-5'>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {order.customer} · {order.date}
            </p>
          </div>
          <p className='text-sm font-semibold'>
            ${order.total.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
