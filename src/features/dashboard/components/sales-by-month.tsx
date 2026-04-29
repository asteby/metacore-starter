import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { useTranslation } from 'react-i18next'

const data = [
  { month: 'Ene', ventas: 42000, meta: 40000 },
  { month: 'Feb', ventas: 38000, meta: 42000 },
  { month: 'Mar', ventas: 55000, meta: 45000 },
  { month: 'Abr', ventas: 48000, meta: 48000 },
  { month: 'May', ventas: 62000, meta: 50000 },
  { month: 'Jun', ventas: 71000, meta: 55000 },
  { month: 'Jul', ventas: 68000, meta: 58000 },
  { month: 'Ago', ventas: 85000, meta: 60000 },
  { month: 'Sep', ventas: 92000, meta: 65000 },
  { month: 'Oct', ventas: 98000, meta: 70000 },
  { month: 'Nov', ventas: 110000, meta: 75000 },
  { month: 'Dic', ventas: 128000, meta: 80000 },
]

export function SalesByMonth() {
  const { t } = useTranslation()

  return (
    <div className='h-[280px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
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
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              undefined,
            ]}
          />
          <Bar
            dataKey='ventas'
            name={t('dashboard.chart.sales')}
            fill='#3b82f6'
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey='meta'
            name={t('dashboard.chart.target')}
            fill='#e2e8f0'
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
