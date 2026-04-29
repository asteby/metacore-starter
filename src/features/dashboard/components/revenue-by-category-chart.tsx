import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useTranslation } from 'react-i18next'

const data = [
  { name: 'Electrónica', value: 45200, color: '#3b82f6' },
  { name: 'Accesorios', value: 28300, color: '#22c55e' },
  { name: 'Software', value: 18700, color: '#a855f7' },
  { name: 'Servicios', value: 12400, color: '#f97316' },
  { name: 'Otros', value: 8200, color: '#64748b' },
]

export function RevenueByCategoryChart() {
  const { t } = useTranslation()
  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className='h-[280px] relative'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='45%'
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey='value'
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              t('dashboard.chart.revenue'),
            ]}
          />
          <Legend
            verticalAlign='bottom'
            height={36}
            formatter={(value) => (
              <span className='text-sm text-foreground'>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className='absolute inset-0 flex items-center justify-center pointer-events-none'
        style={{ bottom: '50px' }}
      >
        <div className='text-center'>
          <p className='text-2xl font-bold'>${(total / 1000).toFixed(1)}k</p>
          <p className='text-xs text-muted-foreground'>
            {t('dashboard.stats.total')}
          </p>
        </div>
      </div>
    </div>
  )
}
