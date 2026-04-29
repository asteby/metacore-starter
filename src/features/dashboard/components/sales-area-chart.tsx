import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'

const data = [
  { month: 'Ene', ventas: 42000, compras: 28000 },
  { month: 'Feb', ventas: 38000, compras: 25000 },
  { month: 'Mar', ventas: 55000, compras: 32000 },
  { month: 'Abr', ventas: 48000, compras: 30000 },
  { month: 'May', ventas: 62000, compras: 35000 },
  { month: 'Jun', ventas: 71000, compras: 40000 },
  { month: 'Jul', ventas: 68000, compras: 38000 },
  { month: 'Ago', ventas: 85000, compras: 45000 },
  { month: 'Sep', ventas: 92000, compras: 50000 },
  { month: 'Oct', ventas: 98000, compras: 52000 },
  { month: 'Nov', ventas: 110000, compras: 58000 },
  { month: 'Dic', ventas: 128000, compras: 65000 },
]

export function SalesAreaChart() {
  const { t } = useTranslation()

  return (
    <div className='h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id='colorVentas' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorCompras' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#f97316' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#f97316' stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='hsl(var(--border))'
            vertical={false}
          />
          <XAxis
            dataKey='month'
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#a1a1aa' }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={50}
            tick={{ fill: '#a1a1aa' }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              undefined,
            ]}
          />
          <Area
            type='monotone'
            dataKey='ventas'
            name={t('dashboard.chart.sales')}
            stroke='#3b82f6'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorVentas)'
          />
          <Area
            type='monotone'
            dataKey='compras'
            name={t('dashboard.chart.purchases')}
            stroke='#f97316'
            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorCompras)'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
