import { Card, CardContent } from '@/components/ui/card'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const cards = [
  {
    titleKey: 'dashboard.stats.revenue',
    value: '$128,430',
    change: '+14.2%',
    changeLabel: 'dashboard.stats.vs_last_month',
    icon: DollarSign,
    trend: 'up' as const,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    titleKey: 'dashboard.stats.orders',
    value: '284',
    change: '+8.1%',
    changeLabel: 'dashboard.stats.vs_last_month',
    icon: ShoppingCart,
    trend: 'up' as const,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    titleKey: 'dashboard.stats.products',
    value: '1,247',
    change: '32',
    changeLabel: 'dashboard.stats.low_stock',
    icon: Package,
    trend: 'down' as const,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    titleKey: 'dashboard.stats.customers',
    value: '3,842',
    change: '+23',
    changeLabel: 'dashboard.stats.this_month',
    icon: Users,
    trend: 'up' as const,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

export function StatsCards() {
  const { t } = useTranslation()

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card) => (
        <Card key={card.titleKey} className='overflow-hidden'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>
                  {t(card.titleKey)}
                </p>
                <p className='text-3xl font-bold tracking-tight'>
                  {card.value}
                </p>
                <div className='flex items-center gap-1 text-xs'>
                  {card.trend === 'up' && (
                    <ArrowUpRight className='h-3 w-3 text-green-500' />
                  )}
                  {card.trend === 'down' && (
                    <ArrowDownRight className='h-3 w-3 text-red-500' />
                  )}
                  <span
                    className={
                      card.trend === 'up'
                        ? 'text-green-500'
                        : card.trend === 'down'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                    }
                  >
                    {card.change}
                  </span>
                  <span className='text-muted-foreground'>
                    {t(card.changeLabel)}
                  </span>
                </div>
              </div>
              <div
                className={`h-12 w-12 rounded-xl ${card.bgColor} flex items-center justify-center`}
              >
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
