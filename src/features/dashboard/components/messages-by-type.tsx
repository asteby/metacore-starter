import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { useBranchStore } from '@/stores/branch-store'

interface MessageType {
  sender_type: string
  count: number
}

export function MessagesByType() {
  const { currentBranch } = useBranchStore()
  const [data, setData] = useState<MessageType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard/messages-by-type')
        if (response.data.success) {
          setData(response.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching messages by type:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentBranch?.id])

  if (loading) {
    return (
      <div className='flex h-[200px] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  const total = data.reduce((acc, item) => acc + item.count, 0)

  const getLabel = (type: string) => {
    switch (type) {
      case 'contact':
        return 'Contactos'
      case 'bot':
        return 'Bot'
      case 'agent':
        return 'Agentes'
      default:
        return type
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-500'
      case 'bot':
        return 'bg-green-500'
      case 'agent':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (data.length === 0) {
    return (
      <div className='flex h-[200px] items-center justify-center text-muted-foreground'>
        No hay datos de mensajes
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {data.map((item) => {
        const percentage = total > 0 ? (item.count / total * 100) : 0
        return (
          <div key={item.sender_type} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>{getLabel(item.sender_type)}</span>
              <span className='text-sm text-muted-foreground'>
                {item.count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className='h-2 w-full rounded-full bg-muted'>
              <div
                className={`h-2 rounded-full ${getColor(item.sender_type)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
