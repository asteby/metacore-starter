// Types for chat feature - now defined explicitly to match API response

export interface Convo {
    id: string
    sender: string // 'You' for sent messages, contact name/phone for received
    avatar: string
    message: string
    timestamp: string
    contentType?: string // text, image, sticker, audio, video, document
    mediaUrl?: string // URL to media file
    whatsappId?: string // Unique ID from WhatsApp service
    senderType?: 'agent' | 'bot' | 'contact' | 'flow' | 'user' | 'orchestrator'
    senderName?: string // Name of the sender (Agent, Flow, or User name)
    status?: 'sending' | 'sent' | 'delivered' // Message delivery status
}

export interface ChatUser {
    id: string // Conversation ID
    conversationId?: string // Alias for compatibility
    username: string // Contact phone
    fullName: string // Contact name or phone if not registered
    profile: string // Avatar URL
    email: string
    phone: string
    title: string // "Customer" or other label
    processActive: boolean
    messages: Convo[]
    // New fields from API
    lastMessage?: string
    unreadCount?: number
    deviceId?: string
    deviceName?: string // Device name for display
    channelType?: string // 'whatsapp', 'instagram', etc.
    deviceStatus?: 'active' | 'disconnected' | 'pending' // Device connection status
    contactId?: string
    botMode?: 'ia' | 'flow' | 'agent' | 'user' | 'orchestrator' // UI only state for now
    activeResource?: string // Name/ID of the active agent or flow
    needsHumanHelp?: boolean // Flag indicating user requested human attention
    customStatusID?: string
    customStatus?: {
        name: string
        color: string
    }
    tags?: Array<{
        id: string
        name: string
        color: string
    }>
    customFieldValues?: Array<{
        field_id?: string
        field?: { id?: string }
        value?: any
        value_text?: string
        value_number?: number
        value_boolean?: boolean
        value_date?: string
    }>
}

// Re-export for backwards compatibility
export type { ChatUser as Chat, Convo as Message }
