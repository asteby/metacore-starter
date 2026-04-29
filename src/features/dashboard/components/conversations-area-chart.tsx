import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBranchStore } from '@/stores/branch-store'


interface MonthlyStats {
  month: string
  conversations: number
  messages: number
}

export function ConversationsAreaChart() {
  const { t } = useTranslation()
  const { currentBranch } = useBranchStore()
  const [data, setData] = useState<MonthlyStats[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard/monthly')
        if (response.data.success) {
          setData(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching monthly stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentBranch?.id])

  if (loading) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  const hasData = data.some(d => d.conversations > 0 || d.messages > 0)

  if (!hasData) {
    return (
      <div className='flex h-[300px] flex-col items-center justify-center text-muted-foreground'>
        <div className='w-full h-32 flex items-end justify-around px-4'>
          {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((h, i) => (
            <div
              key={i}
              className='w-6 bg-muted rounded-t animate-pulse'
              style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <p className='mt-4 text-sm'>{t('dashboard.recent_conversations.no_data_subtitle')}</p>
      </div>

    )
  }

  return (
    <div className='h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id='colorConversations' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
            </linearGradient>
            <linearGradient id='colorMessages' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#22c55e' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#22c55e' stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' vertical={false} />
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
            width={40}
            tick={{ fill: '#a1a1aa' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Area
            type='monotone'
            dataKey='conversations'
            name={t('dashboard.stats.conversations')}
            stroke='#3b82f6'

            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorConversations)'
          />
          <Area
            type='monotone'
            dataKey='messages'
            name={t('dashboard.stats.messages')}
            stroke='#22c55e'

            strokeWidth={2}
            fillOpacity={1}
            fill='url(#colorMessages)'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
