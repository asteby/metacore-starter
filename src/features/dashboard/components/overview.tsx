import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBranchStore } from '@/stores/branch-store'


interface MonthlyStats {
  month: string
  conversations: number
  messages: number
}

export function Overview() {
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
      <div className='flex h-[280px] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  const hasData = data.some(d => d.messages > 0)

  if (!hasData) {
    return (
      <div className='flex h-[280px] flex-col items-center justify-center text-muted-foreground'>
        <div className='w-full h-40 flex items-end justify-around px-4'>
          {data.map((_, i) => (
            <div
              key={i}
              className='w-8 bg-muted/50 rounded-t'
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
        <p className='mt-4 text-sm'>{t('chats.no_messages')}</p>
      </div>

    )
  }

  return (
    <div className='h-[280px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          <Bar
            dataKey='messages'
            name={t('dashboard.stats.messages')}
            fill='#8b5cf6'
            radius={[6, 6, 0, 0]}
          />

        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
