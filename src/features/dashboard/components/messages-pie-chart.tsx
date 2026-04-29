import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'


interface DashboardStats {
  total_conversations: number
  open_conversations: number
  closed_conversations: number
  total_messages: number
  bot_messages: number
  agent_messages: number
  contact_messages: number
  total_contacts: number
  new_contacts_this_month: number
  total_agents: number
  active_agents: number
  total_bots: number
  active_bots: number
  total_devices: number
  connected_devices: number
  bot_response_rate: number
}

interface MessagesPieChartProps {
  stats: DashboardStats | null
}

// Unused COLORS constant (using colors in data array instead)
// const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(262, 83%, 58%)']

export function MessagesPieChart({ stats }: MessagesPieChartProps) {
  const { t } = useTranslation()
  const data = [
    { name: t('chats.contacts'), value: stats?.contact_messages || 0, color: '#3b82f6' },
    { name: t('chats.bot'), value: stats?.bot_messages || 0, color: '#22c55e' },
    { name: t('chats.agent'), value: stats?.agent_messages || 0, color: '#a855f7' },
  ].filter(item => item.value > 0)


  const total = data.reduce((acc, item) => acc + item.value, 0)

  if (total === 0) {
    return (
      <div className='flex h-[280px] flex-col items-center justify-center text-muted-foreground'>
        <div className='h-32 w-32 rounded-full border-4 border-dashed border-muted flex items-center justify-center'>
          <span className='text-2xl'>0</span>
        </div>
        <p className='mt-4 text-sm'>{t('chats.no_messages')}</p>
      </div>

    )
  }

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
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value) => [Number(value).toLocaleString(), t('dashboard.stats.messages')]}
          />

          <Legend
            verticalAlign='bottom'
            height={36}
            formatter={(value) => <span className='text-sm text-foreground'>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none' style={{ bottom: '50px' }}>
        <div className='text-center'>
          <p className='text-2xl font-bold'>{total.toLocaleString()}</p>
          <p className='text-xs text-muted-foreground'>{t('dashboard.stats.total')}</p>
        </div>

      </div>
    </div>
  )
}
