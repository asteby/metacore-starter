import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useBranchStore } from '@/stores/branch-store'


interface RecentConversation {
  id: string
  contact_name: string
  contact_phone: string
  contact_avatar: string
  last_message: string
  last_message_at: string
  status: string
  unread_count: number
}

export function RecentConversations() {
  const { t, i18n } = useTranslation()
  const { currentBranch } = useBranchStore()
  const [conversations, setConversations] = useState<RecentConversation[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard/recent-conversations')
        if (response.data.success) {
          setConversations(response.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching recent conversations:', error)
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

  if (conversations.length === 0) {
    return (
      <div className='flex h-[280px] flex-col items-center justify-center text-muted-foreground'>
        <div className='h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4'>
          <MessageCircle className='h-8 w-8' />
        </div>
        <p className='text-sm'>{t('dashboard.recent_conversations.no_data')}</p>
        <p className='text-xs mt-1'>{t('dashboard.recent_conversations.no_data_subtitle')}</p>
      </div>

    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500'
      case 'closed':
        return 'bg-gray-500'
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  }

  return (
    <div className='space-y-3 max-h-[280px] overflow-auto pr-2'>
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className='flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer'
        >
          <div className='relative'>
            <Avatar className='h-10 w-10'>
              <AvatarImage src={conv.contact_avatar} alt={conv.contact_name} />
              <AvatarFallback className='text-xs'>{getInitials(conv.contact_name)}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(conv.status)}`} />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-medium truncate'>
                {conv.contact_name || conv.contact_phone}
              </p>
              <span className='text-[10px] text-muted-foreground whitespace-nowrap'>
                {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), {
                  addSuffix: false,
                  locale: i18n.language === 'es' ? es : enUS
                })}
              </span>

            </div>
            <p className='text-xs text-muted-foreground truncate mt-0.5'>
              {conv.last_message || t('chats.no_messages')}
            </p>

          </div>
          {conv.unread_count > 0 && (
            <Badge variant='default' className='h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5'>
              {conv.unread_count}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}
