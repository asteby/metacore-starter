import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SalesAreaChart } from './components/sales-area-chart'
import { SalesByMonth } from './components/sales-by-month'
import { RevenueByCategoryChart } from './components/revenue-by-category-chart'
import { RecentOrders } from './components/recent-orders'
import { StatsCards } from './components/stats-cards'
import { TrendingUp, DollarSign, Wallet, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardWidgetsSlot } from '@/features/metacore'

export function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('dashboard.title')}
          </h1>
          <p className='text-muted-foreground'>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <StatsCards />

      {/* Addon-contributed dashboard widgets */}
      <DashboardWidgetsSlot />

      {/* Main Charts Row */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Sales Area Chart - Takes 2 columns */}
        <Card className='lg:col-span-2'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base font-medium'>
                  {t('dashboard.sales_vs_purchases.title')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.sales_vs_purchases.description')}
                </CardDescription>
              </div>
              <div className='flex items-center gap-1 text-sm text-green-500'>
                <TrendingUp className='h-4 w-4' />
                <span>+18.2%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            <SalesAreaChart />
          </CardContent>
        </Card>

        {/* Revenue by Category Pie Chart */}
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-medium'>
              {t('dashboard.revenue_by_category.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.revenue_by_category.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueByCategoryChart />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className='grid gap-6 lg:grid-cols-7'>
        {/* Sales by Month Bar Chart */}
        <Card className='lg:col-span-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-medium'>
              {t('dashboard.sales_by_month.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.sales_by_month.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesByMonth />
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className='lg:col-span-3'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-medium'>
              {t('dashboard.recent_orders.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.recent_orders.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders />
          </CardContent>
        </Card>
      </div>

      {/* Quick Financial Stats Row */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  {t('dashboard.financial.gross_margin')}
                </p>
                <p className='text-3xl font-bold'>38.4%</p>
              </div>
              <div className='h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center'>
                <TrendingUp className='h-6 w-6 text-green-500' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  {t('dashboard.financial.accounts_receivable')}
                </p>
                <p className='text-3xl font-bold'>$47.2k</p>
              </div>
              <div className='h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-blue-500' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  {t('dashboard.financial.accounts_payable')}
                </p>
                <p className='text-3xl font-bold'>$23.8k</p>
              </div>
              <div className='h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center'>
                <Wallet className='h-6 w-6 text-purple-500' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  {t('dashboard.financial.pending_invoices')}
                </p>
                <p className='text-3xl font-bold'>
                  18
                  <span className='text-lg text-muted-foreground'>/142</span>
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center'>
                <CreditCard className='h-6 w-6 text-orange-500' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
