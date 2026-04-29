
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import {
    Image as ImageIcon,
    Sticker,
    Music,
    FileText,
    Film,
    Hand,
    // MessageCircle, Instagram, Globe - commented out with ChannelIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ChatUser } from '../data/chat-types'

interface ChatListItemProps {
    chatUsr: ChatUser
    isSelected: boolean
    onSelect: (user: ChatUser) => void
}

const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
        return parts[0][0] + parts[1][0]
    }
    return name.slice(0, 2).toUpperCase()
}

/*
// Channel icon based on type (commented out - kept for future use)
const ChannelIcon = ({ type, className }: { type?: string; className?: string }) => {
    switch (type) {
        case 'whatsapp':
            return <MessageCircle className={cn('text-[#25D366] fill-[#25D366]', className)} size={14} />
        case 'instagram':
            return <Instagram className={cn('text-[#E4405F]', className)} size={14} />
        case 'web':
            return <Globe className={cn('text-blue-500', className)} size={14} />
        default:
            return <MessageCircle className={cn('text-[#25D366] fill-[#25D366]', className)} size={14} />
    }
}
*/

export const ChatListItem = memo(({ chatUsr, isSelected, onSelect }: ChatListItemProps) => {
    const { t } = useTranslation()
    const { profile, messages, fullName, lastMessage, unreadCount, needsHumanHelp } = chatUsr

    const lastConvo = messages[messages.length - 1]

    // Get raw message (no updates on parent re-renders unless props change)
    let rawMessage = lastMessage || (lastConvo
        ? (lastConvo.sender === 'You'
            ? `${t('chats.you')}: ${lastConvo.message}`
            : lastConvo.message)
        : t('chats.no_messages'))


    // Parse media prefixes and render with icons
    const renderMessagePreview = () => {
        // Handle storage URLs (legacy)
        if (rawMessage.startsWith('/storage') || rawMessage.includes('/storage/media/')) {
            return <span className="flex items-center gap-1"><ImageIcon size={14} /> {t('chats.image')}</span>
        }
        // Handle prefixes
        if (rawMessage.startsWith('[image]')) {
            const caption = rawMessage.replace('[image]', '').trim()
            return <span className="flex items-center gap-1"><ImageIcon size={14} /> {caption || t('chats.image')}</span>
        }
        if (rawMessage.startsWith('[sticker]')) {
            return <span className="flex items-center gap-1"><Sticker size={14} /> {t('chats.sticker')}</span>
        }
        if (rawMessage.startsWith('[audio]')) {
            return <span className="flex items-center gap-1"><Music size={14} /> {t('chats.audio')}</span>
        }
        if (rawMessage.startsWith('[video]')) {
            const caption = rawMessage.replace('[video]', '').trim()
            return <span className="flex items-center gap-1"><Film size={14} /> {caption || t('chats.video')}</span>
        }
        if (rawMessage.startsWith('[document]')) {
            const caption = rawMessage.replace('[document]', '').trim()
            return <span className="flex items-center gap-1"><FileText size={14} /> {caption || t('chats.document')}</span>
        }

        // Handle emojis from old messages
        if (rawMessage.startsWith('📷') || rawMessage.startsWith('🎭') || rawMessage.startsWith('🎵') || rawMessage.startsWith('🎬') || rawMessage.startsWith('📎')) {
            const text = rawMessage.substring(2).trim()
            if (rawMessage.startsWith('📷')) return <span className="flex items-center gap-1"><ImageIcon size={14} /> {text || t('chats.image')}</span>
            if (rawMessage.startsWith('🎭')) return <span className="flex items-center gap-1"><Sticker size={14} /> {t('chats.sticker')}</span>
            if (rawMessage.startsWith('🎵')) return <span className="flex items-center gap-1"><Music size={14} /> {t('chats.audio')}</span>
            if (rawMessage.startsWith('🎬')) return <span className="flex items-center gap-1"><Film size={14} /> {text || t('chats.video')}</span>
            if (rawMessage.startsWith('📎')) return <span className="flex items-center gap-1"><FileText size={14} /> {text || t('chats.document')}</span>

        }
        // Regular text - clean markdown for preview
        const cleanMessage = rawMessage
            .replace(/\*([^\*]+)\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/~([^~]+)~/g, '$1')
            .replace(/```([^`]+)```/g, '$1')
            .replace(/\n/g, ' ')

        return <span>{cleanMessage}</span>
    }

    /*
    // Status indicator color (commented out - kept for future use)
    const getStatusColor = (deviceStatus: string) => {
        switch (deviceStatus) {
            case 'active':
                return 'bg-emerald-500'
            case 'disconnected':
                return 'bg-red-500'
            case 'pending':
                return 'bg-amber-500'
            default:
                return 'bg-gray-400' // Unknown status
        }
    }
    */

    return (
        <>
            <button
                type='button'
                className={cn(
                    'group hover:bg-accent hover:text-accent-foreground',
                    `flex w-full rounded-md px-2 py-2 text-start text-sm`,
                    isSelected && 'sm:bg-muted'
                )}
                onClick={() => onSelect(chatUsr)}
            >
                <div className='flex items-center gap-2 w-full'>
                    {/* Avatar */}
                    <Avatar className='shrink-0'>
                        <AvatarImage src={profile} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                            <span className='font-medium truncate'>
                                {fullName}
                            </span>
                            <div className='flex items-center gap-1.5 shrink-0'>
                                {/* Human help indicator */}
                                {needsHumanHelp && (
                                    <Hand size={18} className='text-primary shrink-0' />
                                )}
                                {/* Unread badge */}
                                {unreadCount && unreadCount > 0 ? (
                                    <span className='bg-primary text-primary-foreground text-xs rounded-full size-5 flex items-center justify-center font-medium shrink-0 pt-[1px]'>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        {/* Phone is hidden in list - only visible in profile */}
                        <span className='text-muted-foreground group-hover:text-accent-foreground/90 line-clamp-1 text-ellipsis text-sm'>
                            {renderMessagePreview()}
                        </span>
                    </div>
                </div>
            </button>
            <Separator className='my-1' />
        </>
    )
})
