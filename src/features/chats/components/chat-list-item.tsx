
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Image as ImageIcon,
    Sticker,
    Music,
    FileText,
    Film,
    Hand,
    Plus,
    Check,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ChatUser } from '../data/chat-types'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface ChatListItemProps {
    chatUsr: ChatUser
    isSelected: boolean
    onSelect: (user: ChatUser) => void
    availableStatuses?: any[]
    onStatusChange?: (conversationId: string, status: any) => void
    showDeviceName?: boolean
}

const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
        return parts[0][0] + parts[1][0]
    }
    return name.slice(0, 2).toUpperCase()
}

export const ChatListItem = memo(({ chatUsr, isSelected, onSelect, availableStatuses = [], onStatusChange, showDeviceName = false }: ChatListItemProps) => {
    const { t } = useTranslation()
    const { profile, messages, fullName, lastMessage, unreadCount, needsHumanHelp } = chatUsr

    const lastConvo = messages[messages.length - 1]

    // Get raw message
    let rawMessage = lastMessage || (lastConvo
        ? (lastConvo.sender === 'You'
            ? `${t('chats.you')}: ${lastConvo.message}`
            : lastConvo.message)
        : t('chats.no_messages'))


    // Parse media prefixes and render with icons
    const renderMessagePreview = () => {
        if (rawMessage.startsWith('/storage') || rawMessage.includes('/storage/media/')) {
            return <span className="flex items-center gap-1"><ImageIcon size={14} /> {t('chats.image')}</span>
        }
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

        if (rawMessage.startsWith('📷') || rawMessage.startsWith('🎭') || rawMessage.startsWith('🎵') || rawMessage.startsWith('🎬') || rawMessage.startsWith('📎')) {
            const text = rawMessage.substring(2).trim()
            if (rawMessage.startsWith('📷')) return <span className="flex items-center gap-1"><ImageIcon size={14} /> {text || t('chats.image')}</span>
            if (rawMessage.startsWith('🎭')) return <span className="flex items-center gap-1"><Sticker size={14} /> {t('chats.sticker')}</span>
            if (rawMessage.startsWith('🎵')) return <span className="flex items-center gap-1"><Music size={14} /> {t('chats.audio')}</span>
            if (rawMessage.startsWith('🎬')) return <span className="flex items-center gap-1"><Film size={14} /> {text || t('chats.video')}</span>
            if (rawMessage.startsWith('📎')) return <span className="flex items-center gap-1"><FileText size={14} /> {text || t('chats.document')}</span>

        }

        const cleanMessage = rawMessage
            .replace(/\*([^\*]+)\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/~([^~]+)~/g, '$1')
            .replace(/```([^`]+)```/g, '$1')
            .replace(/\n/g, ' ')

        return <span>{cleanMessage}</span>
    }

    return (
        <>
            <div
                className={cn(
                    'group hover:bg-accent hover:text-accent-foreground relative',
                    `flex w-full rounded-md px-2 py-2 text-start text-sm`,
                    isSelected && 'sm:bg-muted'
                )}
            >
                {/* Clickable area for selection */}
                <div
                    className="absolute inset-0 cursor-pointer z-0"
                    onClick={() => onSelect(chatUsr)}
                />

                <div className='flex items-center gap-2 w-full relative z-10 pointer-events-none'>
                    {/* Avatar */}
                    <Avatar className='shrink-0 pointer-events-auto'>
                        <AvatarImage src={profile} alt={fullName} />
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                            <span className='font-medium truncate'>
                                {fullName}
                            </span>
                            <div className='flex items-center gap-1.5 shrink-0'>
                                {needsHumanHelp && (
                                    <Hand size={18} className='text-primary shrink-0' />
                                )}
                                {unreadCount && unreadCount > 0 ? (
                                    <span className='bg-primary text-primary-foreground text-xs rounded-full size-5 flex items-center justify-center font-medium shrink-0 pt-[1px]'>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <span className='text-muted-foreground group-hover:text-accent-foreground/90 line-clamp-1 text-ellipsis text-sm mb-1'>
                            {renderMessagePreview()}
                        </span>
                        {showDeviceName && chatUsr.deviceName && (
                            <span className='text-[9px] text-muted-foreground/60 font-medium truncate'>
                                {chatUsr.deviceName}
                            </span>
                        )}

                        {/* Status row below message */}
                        <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="pointer-events-auto cursor-pointer">
                                        {chatUsr.customStatus ? (
                                            <span
                                                className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border transition-all hover:brightness-95 active:scale-95 shadow-xs flex items-center gap-1.5"
                                                style={{
                                                    backgroundColor: `${chatUsr.customStatus.color}15`,
                                                    color: chatUsr.customStatus.color,
                                                    borderColor: `${chatUsr.customStatus.color}30`
                                                }}
                                            >
                                                <div className="size-1.5 rounded-full" style={{ backgroundColor: chatUsr.customStatus.color }} />
                                                {chatUsr.customStatus.name}
                                            </span>
                                        ) : (
                                            <div className="text-[10px] text-muted-foreground/50 font-medium px-2 py-0.5 rounded-md border border-dashed border-muted-foreground/30 group-hover:border-primary/40 group-hover:text-primary transition-colors flex items-center gap-1">
                                                <Plus size={10} />
                                                <span>{t('chats.status_placeholder')}</span>

                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52 pointer-events-auto">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                                        {t('chats.change_status')}
                                    </div>

                                    <DropdownMenuSeparator />
                                    {availableStatuses.length > 0 ? (
                                        <>
                                            {availableStatuses.map((status) => (
                                                <DropdownMenuItem
                                                    key={status.id}
                                                    className="flex items-center gap-2 cursor-pointer py-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onStatusChange?.(chatUsr.id, status)
                                                    }}
                                                >
                                                    <div className="size-2.5 rounded-full shadow-xs" style={{ backgroundColor: status.color }} />
                                                    <span className="flex-1 font-medium">{status.name}</span>
                                                    {chatUsr.customStatusID === status.id && (
                                                        <div className="size-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Check size={10} className="text-primary" />
                                                        </div>
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive py-2"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onStatusChange?.(chatUsr.id, null)
                                                }}
                                            >
                                                <X size={14} />
                                                <span className="font-medium">{t('chats.remove_status')}</span>

                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <div className="px-3 py-6 text-center">
                                            <p className="text-[11px] text-muted-foreground italic leading-tight">
                                                {t('chats.no_statuses')}
                                            </p>

                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
            <Separator className='my-1' />
        </>
    )
})
