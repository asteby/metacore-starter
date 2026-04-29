import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useLocation } from '@tanstack/react-router'

import { useWebSocketContext } from '@/context/websocket-provider'
import {
  ArrowLeft,
  Edit,
  Phone,
  Plus,
  Search as SearchIcon,
  Send,
  Video,
  MessagesSquare,
  Bot,
  Info,
  X,
  Check,
  Pencil,
  CheckCheck,
  Mic,
  StopCircle,
  Sparkles,
  Workflow,
  User,
  ChevronDown,
  Network,
  Database,
  Tag,
  Smartphone,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { NewChat } from './components/new-chat'
import { type ChatUser, type Convo } from './data/chat-types'
import { ChatListItem } from './components/chat-list-item'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

// Resource arrays moved to state


export function Chats() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [chatList, setChatList] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [mobileSelectedUser, setMobileSelectedUser] = useState<ChatUser | null>(null)
  const [createConversationDialogOpened, setCreateConversationDialog] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [showContactProfile, setShowContactProfile] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use a ref to access the scrollable viewport for maintaining scroll position
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  // Dynamic resources state
  const [agents, setAgents] = useState<any[]>([])
  const [flows, setFlows] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [orchestrators, setOrchestrators] = useState<any[]>([])
  const [customStatuses, setCustomStatuses] = useState<any[]>([])
  const [customFields, setCustomFields] = useState<any[]>([])
  const [allDeviceStatuses, setAllDeviceStatuses] = useState<Record<string, any[]>>({})
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all')

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [agentsRes, flowsRes, usersRes, orchsRes, allStatusesRes, customFieldsRes, devicesRes] = await Promise.all([
          api.get('/data/agents/me?per_page=100'),
          api.get('/data/flows/me?per_page=100'),
          api.get('/data/users/me?per_page=100'),
          api.get('/data/orchestrators/me?per_page=100'),
          api.get('/data/device_custom_statuses/me?per_page=500'),
          api.get('/data/contact_custom_fields/me?per_page=100'),
          api.get('/data/devices/me?per_page=100')
        ])
        if (agentsRes.data?.data) setAgents(agentsRes.data.data)
        if (flowsRes.data?.data) setFlows(flowsRes.data.data)
        if (usersRes.data?.data) setEmployees(usersRes.data.data)
        if (orchsRes.data?.data) setOrchestrators(orchsRes.data.data)
        if (customFieldsRes.data?.data) setCustomFields(customFieldsRes.data.data)
        if (devicesRes.data?.data) setDevices(devicesRes.data.data.filter((d: any) => d.type !== 'simulator'))

        if (allStatusesRes.data?.data) {
          const grouped = allStatusesRes.data.data.reduce((acc: any, status: any) => {
            if (!acc[status.device_id]) acc[status.device_id] = []
            acc[status.device_id].push(status)
            return acc
          }, {})
          setAllDeviceStatuses(grouped)
        }
      } catch (e) { console.error("Failed to load chat resources", e) }
    }
    fetchResources()
  }, [])

  const handleConversationStatusChange = useCallback(async (conversationId: string, status: any | null) => {
    // Optimistic update
    setChatList(prev => prev.map(u => {
      if (u.id === conversationId) {
        return {
          ...u,
          customStatusID: status?.id || '',
          customStatus: status ? { name: status.name, color: status.color } : undefined
        }
      }
      return u
    }))

    if (selectedUser?.id === conversationId) {
      setSelectedUser(prev => {
        if (!prev) return null
        return {
          ...prev,
          customStatusID: status?.id || '',
          customStatus: status ? { name: status.name, color: status.color } : undefined
        }
      })
    }

    try {
      await api.patch(`/data/conversations/me/${conversationId}`, {
        custom_status_id: status?.id || null
      })
    } catch (err) {
      console.error("Failed to update status", err)
      // Revert if needed (omitted for simplicity as it usually works)
    }
  }, [selectedUser?.id])

  const { lastMessage, setActiveConversationId, markMessageAsSeen, deviceStatuses, updateDeviceStatus } = useWebSocketContext()
  const { auth } = useAuthStore()
  const currentUserName = auth.user?.name || 'Usuario'
  const location = useLocation()



  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // Keep track of processed messages to avoid duplicates on re-renders
  const prevLastMessage = useRef<MessageEvent<any> | null>(null)
  const processedMessageIds = useRef<Set<string>>(new Set())

  // Helper function to clean phone numbers (remove WhatsApp suffixes)
  const cleanPhone = useCallback((phone: string) => {
    if (!phone) return ''
    return phone
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
      .replace('@g.us', '')
  }, [])

  // Helper function to format WhatsApp markdown (*bold*, _italic_, ~strike~, ```mono```)
  const formatMessage = useCallback((text: string) => {
    if (!text) return ''

    // Clean storage prefixes if any (legacy or internal)
    let processed = text.replace(/\n\/storage.*$/, '')

    // Basic HTML escaping to prevent XSS while we use dangerouslySetInnerHTML for formatting
    const escapeHTML = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    const escaped = escapeHTML(processed)

    // Apply formatting using regex
    let formatted = escaped
      // Bold: *text* -> <strong>text</strong>
      .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>')
      // Italic: _text_ -> <em>text</em>
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Strike: ~text~ -> <del>$1</del>
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      // Monospace: ```text``` -> <code class="bg-black/10 rounded px-1 font-mono text-[0.9em]">$1</code>
      .replace(/```([^`]+)```/g, '<code class="bg-black/10 rounded px-1 font-mono text-[0.9em]">$1</code>')
      // Newlines: \n -> <br/>
      .replace(/\n/g, '<br/>')

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }, [])

  // Fetch real chats from API (without messages - they load on select)
  const fetchChats = useCallback(async () => {
    try {
      // Note: Messages are loaded separately when selecting a chat
      const { data } = await api.get('/data/conversations/me?per_page=100&sortBy=last_message_at&order=desc')

      if (data && data.data) {
        console.log('📦 Raw conversations data:', data.data)

        const mappedChats: ChatUser[] = data.data.map((conv: any) => {
          const contact = conv.contact || { name: '', phone: '', external_id: '' }
          const device = conv.device || {}

          const rawPhone = contact.phone || contact.external_id || ''
          const phoneNumber = cleanPhone(rawPhone)
          const displayName = contact.name && contact.name.trim() !== ''
            ? contact.name
            : phoneNumber || 'Desconocido'

          // Get device status and update context
          const deviceId = device.id || conv.device_id
          const deviceStatus = device.status || 'disconnected'
          if (deviceId) {
            updateDeviceStatus(deviceId, deviceStatus)
          }

          return {
            id: conv.id,
            conversationId: conv.id,
            username: phoneNumber,
            fullName: displayName,
            profile: contact.avatar_url || '',
            email: contact.email || '',
            phone: phoneNumber,
            title: 'Cliente',
            messages: [], // Messages loaded separately
            lastMessage: conv.last_message || '',
            unreadCount: conv.unread_count || 0,
            deviceId: deviceId,
            deviceName: device.name || '',
            channelType: device.type || 'whatsapp',
            deviceStatus: deviceStatus,
            contactId: contact.id || conv.contact_id,
            // Map process_type to UI botMode (ia, flow, user)
            botMode: (conv.process_type === 'user' ? 'user' : conv.process_type === 'flow' ? 'flow' : conv.process_type === 'orchestrator' ? 'orchestrator' : 'ia'),
            // Map process_id to activeResource (for UI selection)
            activeResource: conv.process_id || '',
            processActive: conv.process_active || false, // "ProcessActive" is from backend
            needsHumanHelp: conv.needs_human_help || false, // NEW: Flag for human attention request
            customStatusID: conv.custom_status_id || '',
            customStatus: conv.custom_status ? {
              name: conv.custom_status.name,
              color: conv.custom_status.color
            } : undefined,
            tags: contact.tags?.map((t: any) => ({
              id: t.id,
              name: t.name,
              color: t.color
            })) || [],
            customFieldValues: contact.custom_field_values || []
          }
        })

        // Filter out simulator chats
        const filteredChats = mappedChats


        console.log('✅ Mapped chat list:', filteredChats)
        setChatList(filteredChats)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setIsLoadingChats(false)
    }
  }, [cleanPhone, updateDeviceStatus])

  // Initial fetch
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Ensure scroll triggers INSTANTLY when changing chat to avoid "forced" animation
  useEffect(() => {
    if (selectedUser?.id) {
      // Use 'auto' for instant jump without animation
      setTimeout(() => scrollToBottom('auto'), 50)
      // Safety check for slow images (optional, barely noticeable check)
      setTimeout(() => scrollToBottom('auto'), 200)
    }
  }, [selectedUser?.id, scrollToBottom])

  // Track last message ID to prevent scrolling when loading history
  const lastMessageIdRef = useRef<string | null>(null)
  const previousScrollHeightRef = useRef<number>(0)
  const isLoadingHistoryRef = useRef<boolean>(false)

  // Track message updates for auto-scroll
  useEffect(() => {
    if (selectedUser?.messages?.length && !isLoadingHistoryRef.current) {
      const lastMsg = selectedUser.messages[selectedUser.messages.length - 1]

      // Only scroll if the newest message (at the bottom) has changed
      // This prevents scrolling down when we are prepending older messages (infinite scroll)
      if (lastMsg.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMsg.id
        scrollToBottom('smooth')
      }
    }
  }, [selectedUser?.messages, scrollToBottom])

  // Maintain scroll position when loading older messages
  // Using useLayoutEffect to adjust scroll before paint avoids visual jumping
  useLayoutEffect(() => {
    if (isLoadingHistoryRef.current && scrollViewportRef.current && selectedUser?.messages) {
      const currentScrollHeight = scrollViewportRef.current.scrollHeight
      const diff = currentScrollHeight - previousScrollHeightRef.current

      if (diff > 0) {
        scrollViewportRef.current.scrollTop = diff
      }
      isLoadingHistoryRef.current = false
    }
  }, [selectedUser?.messages])


  // Fetch real chats from API (without messages - they load on select)

  // Handle incoming WebSocket messages - this is where the MAGIC happens
  // WebSocket is ALWAYS connected, not just when viewing a chat
  useEffect(() => {
    if (!lastMessage || lastMessage === prevLastMessage.current) return
    prevLastMessage.current = lastMessage

    try {
      const data = JSON.parse(lastMessage.data)
      console.log('📥 WebSocket message received:', data)

      if (data.type === 'NOTIFICATION') {
        const payload = data.payload

        // Skip update if we are currently viewing this conversation
        // This prevents unread count from appearing again due to race conditions
        if (selectedUser?.id === payload.conversation_id) {
          return
        }

        // Get device ID
        const dId = payload.device_id || payload.deviceId || payload.sessionId
        const phoneNumber = cleanPhone(payload.contact_phone || '')
        const displayName = payload.contact_name && payload.contact_name.trim() !== ''
          ? payload.contact_name
          : phoneNumber || 'Desconocido'

        setChatList((prev) => {
          const existingUserIndex = prev.findIndex(u => u.id === payload.conversation_id)
          let updatedList = [...prev]
          let userToUpdate: ChatUser

          if (existingUserIndex !== -1) {
            const user = { ...updatedList[existingUserIndex] }
            user.lastMessage = payload.body
            user.unreadCount = payload.unread_count
            // Update contact name and avatar from notification payload
            if (displayName && displayName !== 'Desconocido') {
              user.fullName = displayName
            }
            if (payload.contact_avatar) {
              user.profile = payload.contact_avatar
            }
            if (phoneNumber) {
              user.phone = phoneNumber
            }
            if (dId) {
              user.deviceId = dId
            }

            // Move to top
            updatedList.splice(existingUserIndex, 1)
            updatedList.unshift(user)
            return updatedList
          } else {
            userToUpdate = {
              id: payload.conversation_id,
              conversationId: payload.conversation_id,
              username: phoneNumber,
              fullName: displayName,
              profile: payload.contact_avatar || '',
              email: '',
              phone: phoneNumber,
              title: 'Cliente',
              processActive: false,
              messages: [], // Empty messages until loaded
              lastMessage: payload.body,
              unreadCount: payload.unread_count,
              deviceId: dId,
              deviceName: payload.device_name || '',
              channelType: payload.device_type || 'whatsapp'
              // no timestamp property on ChatUser
            }
            return [userToUpdate, ...prev]
          }
        })
      }

      // Handle STATUS_UPDATE messages (for conversation state changes like handoff)
      if (data.type === 'STATUS_UPDATE') {
        const payload = data.payload
        console.log('📡 WS: Received STATUS_UPDATE:', payload)

        // Check if it's a conversation update (handoff to human)
        if (payload.conversation_id) {
          setChatList((prev) => {
            const existingUserIndex = prev.findIndex(u => u.id === payload.conversation_id)
            if (existingUserIndex === -1) return prev

            const updatedList = [...prev]
            const user = { ...updatedList[existingUserIndex] }

            // Update conversation state
            if (payload.needs_human_help !== undefined) {
              user.needsHumanHelp = payload.needs_human_help
              console.log(`🚨 WS: Conversation ${user.id} needs_human_help = ${payload.needs_human_help}`)
            }
            if (payload.process_type !== undefined) {
              // Map process_type to botMode
              user.botMode = payload.process_type === 'user' ? 'user' :
                payload.process_type === 'flow' ? 'flow' : payload.process_type === 'orchestrator' ? 'orchestrator' : 'ia'
              // processActive is true when process_type is agent/flow/orchestrator
              user.processActive = payload.process_type === 'agent' || payload.process_type === 'flow' || payload.process_type === 'orchestrator'
            }

            updatedList[existingUserIndex] = user

            // If this is the selected user, update selectedUser state too
            if (selectedUser?.id === user.id) {
              setSelectedUser(user)
            }

            return updatedList
          })
        }
      }

      if (data.type === 'NEW_MESSAGE') {
        const payload = data.payload
        const incomingMsg = payload.message
        const contact = payload.contact
        const conv = payload.conversation

        // Filter out simulator device
        const dId = payload.device_id || payload.deviceId || payload.sessionId
        // Clean phone number from contact
        const phoneNumber = cleanPhone(contact.phone || contact.external_id || '')

        // Prevent duplicate processing - check if we've already processed this message
        const msgId = incomingMsg.id
        if (processedMessageIds.current.has(msgId)) {
          console.log('⚠️ Skipping duplicate WebSocket message:', msgId)
          return
        }
        processedMessageIds.current.add(msgId)

        // Cleanup old IDs after 30 seconds
        setTimeout(() => {
          processedMessageIds.current.delete(msgId)
        }, 30000)

        // Check if needs_human_help flag was cleared (human responded)
        const needsHumanHelpCleared = conv.needs_human_help === false

        // Clean phone number from contact (moved up)
        // const phoneNumber = cleanPhone(contact.phone || contact.external_id || '') -> Already calculated above
        const displayName = contact.name && contact.name.trim() !== ''
          ? contact.name
          : phoneNumber || 'Desconocido'

        setChatList((prev) => {
          const existingUserIndex = prev.findIndex(u => u.id === conv.id)

          // Format new message to match UI model
          const waId = incomingMsg.metadata?.whatsapp_id
          const clientUUID = incomingMsg.metadata?.client_uuid // Get client UUID from metadata
          const isFromAgent = incomingMsg.sender_type === 'agent'
          const isFromBot = incomingMsg.sender_type === 'bot'
          const senderName = incomingMsg.sender?.name || (isFromBot ? t('chats.bot') : (isFromAgent ? t('chats.agent') : (incomingMsg.sender_type === 'flow' ? t('chats.flow') : (incomingMsg.sender_type === 'orchestrator' ? t('chats.orchestrator') : (incomingMsg.sender_type === 'user' ? t('chats.user') : '')))))

          const newMsg: Convo = {
            id: incomingMsg.id,
            whatsappId: waId,
            sender: isFromBot ? t('chats.bot') : (isFromAgent ? t('chats.you') : displayName),
            senderType: incomingMsg.sender_type,
            senderName: senderName,
            avatar: (isFromAgent || isFromBot) ? '' : (contact.avatar_url || ''),
            message: incomingMsg.content,
            timestamp: incomingMsg.created_at || new Date().toISOString(),
            contentType: incomingMsg.content_type || 'text',
            mediaUrl: incomingMsg.media_url || '',
            status: (isFromAgent || isFromBot || incomingMsg.sender_type === 'flow' || incomingMsg.sender_type === 'orchestrator' || incomingMsg.sender_type === 'user') ? 'delivered' : undefined // ✓✓ for own messages confirmed by server
          }

          console.log(`📩 WS: New ${incomingMsg.sender_type} message`, {
            dbId: incomingMsg.id,
            waId,
            clientUUID,
            metadata: incomingMsg.metadata
          })

          // Mark this message as seen
          markMessageAsSeen(incomingMsg.id)

          let updatedList = [...prev]
          let userToUpdate: ChatUser

          if (existingUserIndex !== -1) {
            const user = { ...updatedList[existingUserIndex] }

            let existingMessages = [...user.messages]
            if (selectedUser?.id === user.id && selectedUser.messages.length > 0) {
              existingMessages = [...selectedUser.messages]
            }

            // Deduplicate or Update: Check client_uuid FIRST (most reliable), then UUID, then whatsappId
            const existingMsgIndex = existingMessages.findIndex(m =>
              (clientUUID && m.id === clientUUID) || // Match by client UUID (most reliable)
              m.id === newMsg.id || // Match by DB UUID
              (waId && m.whatsappId === waId) // Match by WhatsApp ID
            )

            console.log('🔍 WS: Checking for existing message...', {
              clientUUID,
              existingMsgIndex,
              existingMessages: existingMessages.map(m => ({ id: m.id, waId: m.whatsappId }))
            })

            if (existingMsgIndex !== -1) {
              // Found existing message - update it
              const existingMsg = existingMessages[existingMsgIndex]

              console.log('✅ WS: Found existing message, updating...', {
                existingId: existingMsg.id,
                newId: newMsg.id,
                matchedBy: clientUUID && existingMsg.id === clientUUID ? 'client_uuid' :
                  existingMsg.id === newMsg.id ? 'db_uuid' : 'whatsapp_id'
              })

              // If senderType changed (e.g. was 'agent' but now is 'bot'), update it
              if (existingMsg.senderType !== newMsg.senderType) {
                console.log('🔄 WS: Updating message identity to bot', newMsg.senderType)
                user.messages = existingMessages.map((m, idx) =>
                  idx === existingMsgIndex ? { ...m, ...newMsg } : m
                )
              } else {
                // Same message, just update status and media URL
                user.messages = existingMessages.map((m, idx) => {
                  if (idx === existingMsgIndex) {
                    // Cleanup blob URL if exists
                    if (m.mediaUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(m.mediaUrl)
                    }
                    return {
                      ...m,
                      id: newMsg.id, // Update to real DB ID
                      status: 'delivered',
                      mediaUrl: newMsg.mediaUrl || m.mediaUrl,
                      whatsappId: waId
                    }
                  }
                  return m
                })
              }
              // Don't add to list, just update
              updatedList[existingUserIndex] = user
              return updatedList
            } else {
              // Merge Optimistic: If this is an outgoing message, check if there's an optimistic version
              const optimisticIndex = existingMessages.findIndex(m =>
                m.id.startsWith('temp-') &&
                (m.sender === t('chats.you') || m.senderType === 'agent') &&
                m.contentType === newMsg.contentType && // Same content type
                Math.abs(new Date(m.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 10000 // Within 10 seconds
              )

              if (optimisticIndex !== -1 && (isFromAgent || isFromBot)) {
                // Replace optimistic message with real one (mark as delivered)
                user.messages = existingMessages.map((m, idx) => {
                  if (idx === optimisticIndex) {
                    // Cleanup blob URL if exists
                    if (m.mediaUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(m.mediaUrl)
                    }
                    return { ...newMsg, status: 'delivered' }
                  }
                  return m
                })
              } else {
                // Standard append
                user.messages = [...existingMessages, newMsg]
              }
            }


            user.lastMessage = conv.last_message || incomingMsg.content
            // Only increment unread if it's not the currently selected chat
            if (selectedUser?.id !== user.id) {
              user.unreadCount = (user.unreadCount || 0) + 1
            } else {
              user.unreadCount = 0
            }
            // Update contact info if changed
            user.profile = contact.avatar_url || user.profile
            user.fullName = displayName
            user.phone = phoneNumber
            // Update device ID if we got it
            const dId = payload.device_id || payload.deviceId || payload.sessionId
            if (dId) user.deviceId = dId

            // Update needs_human_help flag from server (confirmation)
            if (needsHumanHelpCleared) {
              user.needsHumanHelp = false
              console.log('✅ WS: Confirmed needs_human_help cleared for conversation', user.id)
            }

            // Remove old position and insert at top (most recent)
            updatedList.splice(existingUserIndex, 1)
            updatedList.unshift(user)
            userToUpdate = user
          } else {
            userToUpdate = {
              id: conv.id,
              conversationId: conv.id,
              username: phoneNumber,
              fullName: displayName,
              profile: contact.avatar_url || '',
              email: contact.email || '',
              phone: phoneNumber,
              title: 'Cliente',
              processActive: false,
              messages: [newMsg],
              lastMessage: conv.last_message || incomingMsg.content,
              unreadCount: 1,
              deviceId: dId,
              deviceName: payload.device_name || '',
              channelType: payload.device_type || 'whatsapp',
              needsHumanHelp: conv.needs_human_help || false
            }
            updatedList = [userToUpdate, ...prev]
          }

          // If this is the selected user, update selectedUser state too
          if (selectedUser?.id === userToUpdate.id) {
            setSelectedUser(userToUpdate)
            // Scroll to bottom
            setTimeout(scrollToBottom, 100)

            // IMPORTANT: Mark as read in backend since user is viewing this chat
            // This prevents unread_count from incrementing while user has the chat open
            api.post(`/conversations/${userToUpdate.id}/read`).catch(err => {
              console.error('Failed to mark as read:', err)
            })
          }

          return updatedList
        })
      }
    } catch (e) {
      console.error('Error parsing WS message', e)
    }
  }, [lastMessage, selectedUser, scrollToBottom, markMessageAsSeen, cleanPhone])

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, fullName: string, profile: string, pageNum = 1) => {
    try {
      if (pageNum === 1) {
        // Only scroll to bottom on initial load
        // setTimeout(() => scrollToBottom('auto'), 0)
      } else {
        setIsLoadingMore(true)
      }

      const { data } = await api.get(`/conversations/${conversationId}/messages?per_page=20&page=${pageNum}`)

      if (data && data.data) {
        const messages: Convo[] = data.data.map((msg: any) => {
          const isFromBot = msg.sender_type === 'bot'
          const isFromAgent = msg.sender_type === 'agent'
          const senderName = msg.sender?.name || (isFromBot ? t('chats.bot') : (isFromAgent ? t('chats.agent') : (msg.sender_type === 'flow' ? t('chats.flow') : (msg.sender_type === 'orchestrator' ? t('chats.orchestrator') : (msg.sender_type === 'user' ? t('chats.user') : '')))))

          return {
            id: msg.id,
            whatsappId: msg.metadata?.whatsapp_id,
            sender: isFromBot ? t('chats.bot') : (isFromAgent ? t('chats.you') : fullName),
            senderType: msg.sender_type,
            senderName: senderName,

            avatar: profile,
            message: msg.content || '',
            timestamp: msg.created_at,
            contentType: msg.content_type || 'text',
            mediaUrl: msg.media_url || '',
            status: (isFromBot || isFromAgent || msg.sender_type === 'flow' || msg.sender_type === 'orchestrator' || msg.sender_type === 'user') ? 'delivered' : undefined // Historical messages are delivered
          }
        })

        // Update hasMore status from metadata
        if (data.meta) {
          setHasMore(data.meta.has_more)
        }

        return messages
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setIsLoadingMore(false)
    }
    return []
  }, [])

  // Load more messages (infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedUser || !hasMore || isLoadingMore) return

    const nextPage = page + 1

    // Capture current height before fetching/updating
    if (scrollViewportRef.current) {
      previousScrollHeightRef.current = scrollViewportRef.current.scrollHeight
      isLoadingHistoryRef.current = true
    }

    setIsLoadingMore(true)

    // Fetch older messages
    const newMessages = await loadMessages(selectedUser.id, selectedUser.fullName, selectedUser.profile, nextPage)

    if (newMessages.length > 0) {
      setPage(nextPage)

      setChatList(prev => prev.map(u => {
        if (u.id === selectedUser.id) {
          // Prepend new (older) messages
          return { ...u, messages: [...newMessages, ...u.messages] }
        }
        return u
      }))

      setSelectedUser(prev => {
        if (!prev) return null
        return { ...prev, messages: [...newMessages, ...prev.messages] }
      })
    } else {
      // Reset flag if no new messages were loaded to avoid stuck state
      isLoadingHistoryRef.current = false
    }
  }, [selectedUser, hasMore, isLoadingMore, page, loadMessages])



  // Mark conversation as read when selecting AND load messages
  const handleSelectUser = useCallback(async (chatUsr: ChatUser) => {
    // Set selected user immediately for fast UI response
    const updatedUser = { ...chatUsr, unreadCount: 0 }
    setSelectedUser(updatedUser)
    setMobileSelectedUser(updatedUser)

    // Inform WebSocket context which conversation is active (for notification filtering)
    setActiveConversationId(chatUsr.id)

    // Update in list
    setChatList(prev => prev.map(u => u.id === chatUsr.id ? updatedUser : u))

    // Load messages for this conversation if not already loaded
    if (chatUsr.messages.length === 0) {
      setIsLoadingMessages(true)
      setPage(1) // Reset page
      const messages = await loadMessages(chatUsr.id, chatUsr.fullName, chatUsr.profile, 1)
      setIsLoadingMessages(false)
      const userWithMessages = { ...updatedUser, messages }
      setSelectedUser(userWithMessages)
      // Also update in chatList for caching
      setChatList(prev => prev.map(u => u.id === chatUsr.id ? userWithMessages : u))
    } else {
      setPage(1)
      setHasMore(true) // Assume true or check length?
    }

    // API call to mark as read (don't await to not block UI)
    if (chatUsr.unreadCount && chatUsr.unreadCount > 0) {
      api.post(`/conversations/${chatUsr.id}/read`).catch(err => {
        console.error('Failed to mark as read:', err)
      })
    }

    // Scroll to bottom
    setTimeout(scrollToBottom, 100)

    // NEW: Fetch custom statuses for the device of this conversation
    if (chatUsr.deviceId) {
      try {
        const statusesRes = await api.get(`/data/device_custom_statuses/me?f_device_id=${chatUsr.deviceId}`)
        if (statusesRes.data?.success) {
          setCustomStatuses(statusesRes.data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch custom statuses:', err)
      }
    }
  }, [scrollToBottom, loadMessages, setActiveConversationId])

  // Handle URL params for direct chat navigation
  useEffect(() => {
    // Parse the search params from the window location directly to be safe with router versions
    const params = new URLSearchParams(window.location.search)
    const chatParamId = params.get('id')

    // Only proceed if we have an ID, we have chats loaded, and we aren't already viewing this chat
    if (chatParamId && chatList.length > 0 && selectedUser?.id !== chatParamId) {
      const foundChat = chatList.find(c => c.id === chatParamId)
      if (foundChat) {
        console.log('🔗 Navigating to chat from URL:', chatParamId)
        handleSelectUser(foundChat)
      }
    }
  }, [location.href, chatList, selectedUser?.id, handleSelectUser])

  // Send message handler
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedUser || isSending) return

    setIsSending(true)
    const msgText = messageInput.trim()
    setMessageInput('')
    // Reset textarea height
    const textarea = e.currentTarget.querySelector('textarea')
    if (textarea) textarea.style.height = 'auto'

    // Generate client UUID for tracking
    const clientUUID = crypto.randomUUID()

    try {
      // Optimistically add message to UI
      const optimisticMsg: Convo = {
        id: clientUUID, // Use client UUID as temporary ID
        sender: t('chats.you'),
        senderType: 'user', // Manual message from user
        senderName: currentUserName, // Add current user name
        avatar: '',
        message: msgText,
        timestamp: new Date().toISOString(),
        status: 'sending' // ✓ Single check
      }

      // OPTIMISTIC UPDATE: Clear needs_human_help flag immediately
      const updatedUser = {
        ...selectedUser,
        messages: [...selectedUser.messages, optimisticMsg],
        lastMessage: msgText,
        needsHumanHelp: false, // Clear flag optimistically
        processActive: false, // Disable process when human responds
        botMode: 'user' as const // Set to manual mode
      }
      setSelectedUser(updatedUser)
      setChatList(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u))

      // Scroll to see new message
      setTimeout(scrollToBottom, 100)

      // Verify we have all required data
      if (!selectedUser.deviceId || !selectedUser.phone) {
        console.error('Cant send message: Missing session/recipient data', { deviceId: selectedUser.deviceId, phone: selectedUser.phone })
        setIsSending(false)
        return
      }

      // Send via API with client UUID
      const response = await api.post('/whatsapp/send', {
        sessionId: selectedUser.deviceId,
        to: selectedUser.phone,
        message: msgText,
        clientUUID // Send client UUID to backend
      })

      console.log('📤 Human message sent - processActive disabled, needs_human_help cleared')

      console.log('📤 Message sent to backend:', { clientUUID, response: response.data })

      // Update status to delivered (backend received it)
      if (response.data?.success) {
        setSelectedUser(prev => {
          if (!prev) return null
          return {
            ...prev,
            messages: prev.messages.map(m =>
              m.id === clientUUID ? { ...m, status: 'delivered' } : m // ✓✓ Double check
            ),
            needsHumanHelp: false, // Confirm flag cleared
            processActive: false // Confirm processActive disabled
          }
        })
        setChatList(prev => prev.map(u => {
          if (u.id !== selectedUser.id) return u
          return {
            ...u,
            messages: u.messages.map(m =>
              m.id === clientUUID ? { ...m, status: 'delivered' } : m // ✓✓ Double check
            ),
            needsHumanHelp: false, // Confirm flag cleared
            processActive: false // Confirm processActive disabled
          }
        }))
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      // Revert optimistic update on error
      setSelectedUser(selectedUser)
      setChatList(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u))
    } finally {
      setIsSending(false)
    }
  }, [messageInput, selectedUser, isSending, scrollToBottom])

  // Handle file upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUser || isUploadingFile) return

    setIsUploadingFile(true)

    // Generate client UUID for tracking
    const clientUUID = crypto.randomUUID()

    try {
      // Determine content type
      let contentType = 'document'
      if (file.type.startsWith('image/')) contentType = 'image'
      else if (file.type.startsWith('video/')) contentType = 'video'
      else if (file.type.startsWith('audio/')) contentType = 'audio'

      // Create preview URL for immediate display
      const previewURL = URL.createObjectURL(file)

      // Create preview message
      const previewText = contentType === 'image' ? '' :
        contentType === 'video' ? '' :
          contentType === 'audio' ? '' : file.name

      // Optimistically add message with preview
      const optimisticMsg: Convo = {
        id: clientUUID, // Use client UUID
        sender: t('chats.you'),
        senderType: 'user', // Manual message from user
        senderName: currentUserName, // Add current user name
        avatar: '',
        message: previewText,
        timestamp: new Date().toISOString(),
        contentType,
        mediaUrl: previewURL, // Use blob URL for instant preview
        status: 'sending'
      }

      const updatedUser = {
        ...selectedUser,
        messages: [...selectedUser.messages, optimisticMsg],
        lastMessage: contentType === 'image' ? '[Imagen]' :
          contentType === 'video' ? '[Video]' :
            contentType === 'audio' ? '[Audio]' : `[${file.name}]`,
        needsHumanHelp: false, // Clear flag optimistically
        processActive: false, // Disable process when human responds
        botMode: 'user' as const // Set to manual mode
      }
      setSelectedUser(updatedUser)
      setChatList(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u))
      setTimeout(scrollToBottom, 100)

      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', selectedUser.deviceId || '')
      formData.append('to', selectedUser.phone)
      formData.append('contentType', contentType)
      formData.append('clientUUID', clientUUID) // Send client UUID

      const response = await api.post('/whatsapp/send-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Update with server URL and status
      if (response.data?.success) {
        const serverMediaUrl = response.data.media_url || ''

        setSelectedUser(prev => {
          if (!prev) return null
          return {
            ...prev,
            messages: prev.messages.map(m => {
              if (m.id === clientUUID) {
                // Revoke blob URL to free memory
                if (m.mediaUrl?.startsWith('blob:')) {
                  URL.revokeObjectURL(m.mediaUrl)
                }
                return {
                  ...m,
                  status: 'delivered',
                  mediaUrl: serverMediaUrl // Update to server URL
                }
              }
              return m
            }),
            needsHumanHelp: false, // Confirm flag cleared
            processActive: false // Confirm processActive disabled
          }
        })
        setChatList(prev => prev.map(u => {
          if (u.id !== selectedUser.id) return u
          return {
            ...u,
            messages: u.messages.map(m => {
              if (m.id === clientUUID) {
                return {
                  ...m,
                  status: 'delivered',
                  mediaUrl: serverMediaUrl
                }
              }
              return m
            }),
            needsHumanHelp: false, // Confirm flag cleared
            processActive: false // Confirm processActive disabled
          }
        }))
      }

      console.log('📤 Human media sent - processActive disabled, needs_human_help cleared')
    } catch (err) {
      console.error('Failed to send file:', err)
      // Revert on error and cleanup blob URL
      setSelectedUser(prev => {
        if (!prev) return null
        const msgToRemove = prev.messages.find(m => m.id === clientUUID)
        if (msgToRemove?.mediaUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(msgToRemove.mediaUrl)
        }
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== clientUUID)
        }
      })
      setChatList(prev => prev.map(u => {
        if (u.id !== selectedUser.id) return u
        return {
          ...u,
          messages: u.messages.filter(m => m.id !== clientUUID)
        }
      }))
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [selectedUser, isUploadingFile, scrollToBottom])

  // Start audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Check if browser supports audio/ogg
      let mimeType = 'audio/webm;codecs=opus'
      if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        stream.getTracks().forEach(track => track.stop())

        // Send audio
        if (selectedUser && audioBlob.size > 0) {
          // Generate client UUID for tracking
          const clientUUID = crypto.randomUUID()

          // Create preview URL for immediate playback
          const previewURL = URL.createObjectURL(audioBlob)

          // Optimistic message with audio preview
          const optimisticMsg: Convo = {
            id: clientUUID, // Use client UUID
            sender: t('chats.you'),
            senderType: 'user', // Manual message from user
            senderName: currentUserName, // Add current user name
            avatar: '',
            message: '',
            timestamp: new Date().toISOString(),
            contentType: 'audio',
            mediaUrl: previewURL, // Use blob URL for instant preview
            status: 'sending'
          }

          const updatedUser = {
            ...selectedUser,
            messages: [...selectedUser.messages, optimisticMsg],
            lastMessage: '[Audio]'
          }
          setSelectedUser(updatedUser)
          setChatList(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u))
          setTimeout(scrollToBottom, 100)

          try {
            const formData = new FormData()
            // Use appropriate extension based on mime type
            const extension = mimeType.includes('ogg') ? 'ogg' : 'webm'
            formData.append('file', audioBlob, `audio.${extension}`)
            formData.append('sessionId', selectedUser.deviceId || '')
            formData.append('to', selectedUser.phone)
            formData.append('contentType', 'audio')
            formData.append('clientUUID', clientUUID) // Send client UUID

            const response = await api.post('/whatsapp/send-media', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (response.data?.success) {
              const serverMediaUrl = response.data.media_url || ''

              setSelectedUser(prev => {
                if (!prev) return null
                return {
                  ...prev,
                  messages: prev.messages.map(m => {
                    if (m.id === clientUUID) {
                      // Revoke blob URL to free memory
                      if (m.mediaUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(m.mediaUrl)
                      }
                      return {
                        ...m,
                        status: 'delivered',
                        mediaUrl: serverMediaUrl // Update to server URL
                      }
                    }
                    return m
                  })
                }
              })
              setChatList(prev => prev.map(u => {
                if (u.id !== selectedUser.id) return u
                return {
                  ...u,
                  messages: u.messages.map(m => {
                    if (m.id === clientUUID) {
                      return {
                        ...m,
                        status: 'delivered',
                        mediaUrl: serverMediaUrl
                      }
                    }
                    return m
                  })
                }
              }))
            }
          } catch (err) {
            console.error('Failed to send audio:', err)
            setSelectedUser(prev => {
              if (!prev) return null
              const msgToRemove = prev.messages.find(m => m.id === clientUUID)
              if (msgToRemove?.mediaUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(msgToRemove.mediaUrl)
              }
              return {
                ...prev,
                messages: prev.messages.filter(m => m.id !== clientUUID)
              }
            })
          }
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert(t('chats.mic_error'))
    }
  }, [selectedUser, scrollToBottom])

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  // Save contact name
  const handleSaveContactName = useCallback(async () => {
    if (!selectedUser || !editedName.trim() || editedName === selectedUser.fullName) {
      setEditingName(false)
      return
    }

    setIsSavingName(true)
    try {
      // Get the contact ID from the conversation
      const { data: convData } = await api.get(`/data/conversations/me/${selectedUser.conversationId}`)
      const contactId = convData?.data?.contact_id || convData?.data?.contact?.id

      if (contactId) {
        await api.patch(`/data/contacts/me/${contactId}`, {
          name: editedName.trim(),
          custom_name: true // Mark as custom name so Baileys won't overwrite
        })

        // Update local state
        const updatedUser = { ...selectedUser, fullName: editedName.trim() }
        setSelectedUser(updatedUser)
        setChatList(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u))
      }
    } catch (err) {
      console.error('Failed to save contact name:', err)
    } finally {
      setIsSavingName(false)
      setEditingName(false)
    }
  }, [selectedUser, editedName])

  // Filtered data based on the search query and device filter - also updates deviceStatus from context
  const filteredChatList = useMemo(() => {
    return chatList
      .filter(({ fullName, phone, deviceId }) => {
        const matchesSearch = fullName.toLowerCase().includes(search.trim().toLowerCase()) ||
          phone.toLowerCase().includes(search.trim().toLowerCase())
        const matchesDevice = selectedDeviceId === 'all' || deviceId === selectedDeviceId
        return matchesSearch && matchesDevice
      })
      .map(chat => ({
        ...chat,
        // Get latest device status from context (real-time updates)
        deviceStatus: chat.deviceId ? (deviceStatuses[chat.deviceId] || chat.deviceStatus || 'disconnected') : 'disconnected'
      }))
  }, [chatList, search, deviceStatuses, selectedDeviceId])

  const currentMessage = useMemo(() => {
    if (!selectedUser?.messages) return null

    // Create a copy and sort by timestamp to ensure chronological order
    const sortedMessages = [...selectedUser.messages].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return sortedMessages.reduce(
      (acc: Record<string, Convo[]>, obj) => {
        const key = format(new Date(obj.timestamp), 'd MMM, yyyy', { locale: i18n.language === 'es' ? es : enUS })
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(obj)
        return acc
      },
      {}
    )
  }, [selectedUser?.messages])

  const users = chatList.map(({ messages, ...user }) => user)

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0]
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <div className='p-6 h-full flex flex-col'>
        <section className='flex flex-1 min-h-0 gap-6'>
          {/* Left Side - Conversation List */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='bg-background sticky top-0 z-10 -mx-4 px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>{t('chats.inbox')}</h1>
                  <MessagesSquare size={20} />
                </div>


                <Button
                  size='icon'
                  variant='ghost'
                  onClick={() => setCreateConversationDialog(true)}
                  className='rounded-lg'
                >
                  <Edit size={24} className='stroke-muted-foreground' />
                </Button>
              </div>

              <label
                className={cn(
                  'focus-within:ring-ring focus-within:ring-1 focus-within:outline-hidden',
                  'border-border flex h-10 w-full items-center space-x-0 rounded-md border ps-2'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>{t('common.search')}</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder={t('chats.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              {/* Device filter */}
              {devices.length > 1 && (
                <div className='flex gap-1 mt-2 flex-wrap'>
                  <button
                    onClick={() => setSelectedDeviceId('all')}
                    className={cn(
                      'text-[10px] px-2 py-1 rounded-md border font-medium transition-colors flex items-center gap-1',
                      selectedDeviceId === 'all'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-accent'
                    )}
                  >
                    <Smartphone size={10} />
                    {t('common.all')}
                  </button>
                  {devices.map((device: any) => (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDeviceId(device.id)}
                      className={cn(
                        'text-[10px] px-2 py-1 rounded-md border font-medium transition-colors truncate max-w-[120px]',
                        selectedDeviceId === device.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-accent'
                      )}
                      title={device.name}
                    >
                      {device.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {isLoadingChats ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 p-2 rounded-lg mb-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="flex flex-col gap-1 w-full overflow-hidden">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-10" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                filteredChatList.map((chatUsr) => (
                  <ChatListItem
                    key={chatUsr.id}
                    chatUsr={chatUsr}
                    isSelected={selectedUser?.id === chatUsr.id}
                    onSelect={handleSelectUser}
                    availableStatuses={chatUsr.deviceId ? allDeviceStatuses[chatUsr.deviceId] : []}
                    onStatusChange={handleConversationStatusChange}
                    showDeviceName={devices.length > 1}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right Side - Chat View */}
          {selectedUser ? (
            <>
              <div
                className={cn(
                  'bg-background absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md',
                  mobileSelectedUser && 'start-0 flex'
                )}
              >
                {/* Top Part */}
                <div className='bg-card mb-1 flex flex-none justify-between p-4 shadow-lg sm:rounded-t-md'>
                  {/* Left */}
                  <div className='flex gap-3'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='-ms-2 h-full sm:hidden'
                      onClick={() => setMobileSelectedUser(null)}
                    >
                      <ArrowLeft className='rtl:rotate-180' />
                    </Button>
                    <div className='flex items-center gap-2 lg:gap-4'>
                      <Avatar className='size-9 lg:size-11'>
                        <AvatarImage
                          src={selectedUser.profile}
                          alt={selectedUser.fullName}
                        />
                        <AvatarFallback>{getInitials(selectedUser.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='col-start-2 row-span-2 text-sm font-medium lg:text-base'>
                            {selectedUser.fullName}
                          </span>
                          {/* Tags Section */}
                          {selectedUser.tags && selectedUser.tags.length > 0 && (
                            <div className="flex gap-1">
                              {selectedUser.tags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: tag.color || '#6366f1' }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Device connection status indicator */}
                          {(() => {
                            const status = selectedUser.deviceId
                              ? (deviceStatuses[selectedUser.deviceId] || selectedUser.deviceStatus || 'disconnected')
                              : 'disconnected'
                            const statusConfig = {
                              active: { color: 'bg-emerald-500', text: t('common.connected') },
                              disconnected: { color: 'bg-red-500', text: t('common.disconnected') },
                              pending: { color: 'bg-amber-500', text: t('common.connecting') }
                            }

                            const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected
                            return (
                              <div
                                className={cn('size-2 rounded-full', config.color)}
                                title={config.text}
                              />
                            )
                          })()}
                        </div>
                        {/* Only show phone if name equals phone (no real name available) */}
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className='-me-1 flex items-center gap-1 lg:gap-2'>
                    <div className="flex items-center gap-0.5 bg-muted/30 rounded-full p-0.5">
                      <Button
                        size='icon'
                        variant='ghost'
                        className={cn(
                          'rounded-full transition-all size-8 lg:size-10',
                          // If needs human help, show as disabled/off state
                          selectedUser.needsHumanHelp
                            ? 'text-muted-foreground/50 hover:bg-muted/50 opacity-60' // Disabled state
                            : !selectedUser.processActive
                              ? 'text-muted-foreground hover:bg-muted hover:text-foreground' // Persona
                              : selectedUser.botMode === 'orchestrator'
                                ? 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/10' // Orchestrator
                                : selectedUser.botMode === 'flow'
                                  ? 'text-violet-600 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:bg-violet-500/10' // Flow
                                  : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10' // IA
                        )}
                        onClick={async () => {
                          // If needs human help, don't allow toggling until human responds
                          if (selectedUser.needsHumanHelp) {
                            return
                          }

                          const isTurningOn = !selectedUser.processActive
                          let targetType = isTurningOn ? 'agent' : 'user'
                          let targetId = ''

                          if (isTurningOn) {
                            // If turning ON, check if we have a valid agent resource previously selected
                            const previousResourceValid = agents.find(a => a.id === selectedUser.activeResource)
                            if (previousResourceValid) {
                              targetId = selectedUser.activeResource || ''
                            } else {
                              // Default to first agent
                              targetId = agents[0]?.id || ''
                            }
                          } else {
                            // If turning OFF (Manual mode)
                            // Ideally assign to current employee (if we knew who 'me' is) or first available
                            // For to stay safe, let's try to keep it unassigned (null) or just 'user' type
                            // But usually 'process_id' for user type implies the assigned user.
                            targetId = employees[0]?.id || ''
                          }

                          const updatedUser = {
                            ...selectedUser,
                            processActive: isTurningOn,
                            botMode: targetType as any,
                            activeResource: targetId
                          }
                          setSelectedUser(updatedUser)
                          setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))

                          try {
                            await api.patch(`/data/conversations/me/${selectedUser.id}`, {
                              process_type: targetType,
                              process_id: targetId || null
                            })
                          } catch (err) {
                            console.error("Failed to update processActive", err)
                            // Revert
                            setSelectedUser(selectedUser)
                            setChatList(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u))
                          }
                        }}
                      >
                        {selectedUser.botMode === 'orchestrator' ? (
                          <Network
                            size={22}
                            className={cn(
                              "transition-colors",
                              selectedUser.processActive
                                ? "text-cyan-500"
                                : "text-muted-foreground"
                            )}
                          />
                        ) : selectedUser.botMode === 'flow' ? (
                          <Workflow
                            size={22}
                            className={cn(
                              (!selectedUser.processActive || selectedUser.needsHumanHelp) && "opacity-50"
                            )}
                          />
                        ) : (
                          <Sparkles
                            size={22}
                            className={cn(
                              (!selectedUser.processActive || selectedUser.needsHumanHelp) && "opacity-50"
                            )}
                          />
                        )}
                        <span className='sr-only'>
                          {selectedUser.needsHumanHelp
                            ? t('chats.agent_needs_help')
                            : selectedUser.processActive
                              ? t('chats.active_process')
                              : t('chats.inactive_process')
                          }
                        </span>
                      </Button>


                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 lg:size-6 rounded-full hover:bg-muted -ml-1 opacity-50 hover:opacity-100"
                          >
                            <ChevronDown size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Sparkles className="mr-2 h-4 w-4" />
                              <span>{t('chats.agent')}</span>

                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="p-0">
                                <Command>
                                  <CommandInput placeholder={t('common.search')} autoFocus={true} />
                                  <CommandList>
                                    <CommandEmpty>{t('chats.no_results')}</CommandEmpty>
                                    <CommandGroup>

                                      {agents.map((agent) => {
                                        const isSelected = selectedUser.activeResource === agent.id && selectedUser.botMode === 'ia'
                                        return (
                                          <CommandItem
                                            key={agent.id}
                                            value={agent.id}
                                            onSelect={async () => {
                                              const updatedUser = { ...selectedUser, processActive: true, botMode: 'ia', activeResource: agent.id }
                                              setSelectedUser(updatedUser as ChatUser)
                                              setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser as ChatUser : u))
                                              try {
                                                await api.patch(`/data/conversations/me/${selectedUser.id}`, { process_type: 'agent', process_id: agent.id })
                                                console.log(`Activated IA Agent: ${agent.name}`)
                                              } catch (err) {
                                                console.error("Failed to enable IA", err)
                                              }
                                            }}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                            {agent.name}
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Workflow className="mr-2 h-4 w-4" />
                              <span>{t('chats.flow')}</span>
                            </DropdownMenuSubTrigger>

                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="p-0">
                                <Command>
                                  <CommandInput placeholder={t('common.search')} autoFocus={true} />
                                  <CommandList>
                                    <CommandEmpty>{t('chats.no_results')}</CommandEmpty>
                                    <CommandGroup>

                                      {flows.map((flow) => {
                                        const isSelected = selectedUser.activeResource === flow.id && selectedUser.botMode === 'flow'
                                        return (
                                          <CommandItem
                                            key={flow.id}
                                            value={flow.id}
                                            onSelect={async () => {
                                              const updatedUser = { ...selectedUser, processActive: true, botMode: 'flow', activeResource: flow.id }
                                              setSelectedUser(updatedUser as ChatUser)
                                              setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser as ChatUser : u))
                                              try {
                                                await api.patch(`/data/conversations/me/${selectedUser.id}`, { process_type: 'flow', process_id: flow.id })
                                                console.log(`Activated Flow: ${flow.name}`)
                                              } catch (err) {
                                                console.error("Failed to enable Flow", err)
                                              }
                                            }}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                            {flow.name}
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Network className="mr-2 h-4 w-4" />
                              <span>{t('chats.orchestrator')}</span>
                            </DropdownMenuSubTrigger>

                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="p-0">
                                <Command>
                                  <CommandInput placeholder={t('common.search')} autoFocus={true} />
                                  <CommandList>
                                    <CommandEmpty>{t('chats.no_results')}</CommandEmpty>
                                    <CommandGroup>

                                      {orchestrators.map((orch) => {
                                        const isSelected = selectedUser.activeResource === orch.id && selectedUser.botMode === 'orchestrator'
                                        return (
                                          <CommandItem
                                            key={orch.id}
                                            value={orch.id}
                                            onSelect={async () => {
                                              const updatedUser = { ...selectedUser, processActive: true, botMode: 'orchestrator', activeResource: orch.id }
                                              setSelectedUser(updatedUser as ChatUser)
                                              setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser as ChatUser : u))
                                              try {
                                                await api.patch(`/data/conversations/me/${selectedUser.id}`, { process_type: 'orchestrator', process_id: orch.id })
                                                console.log(`Activated Orchestrator: ${orch.name}`)
                                              } catch (err) {
                                                console.error("Failed to enable Orchestrator", err)
                                              }
                                            }}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col">
                                              <span>{orch.name}</span>
                                              {orch.description && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{orch.description}</span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <User className="mr-2 h-4 w-4" />
                              <span>{t('chats.person')}</span>
                            </DropdownMenuSubTrigger>

                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="p-0">
                                <Command>
                                  <CommandInput placeholder={t('common.search')} autoFocus={true} />
                                  <CommandList>
                                    <CommandEmpty>{t('chats.no_results')}</CommandEmpty>
                                    <CommandGroup>

                                      {employees.map((employee) => {
                                        const isSelected = selectedUser.activeResource === employee.id && selectedUser.botMode === 'user'
                                        return (
                                          <CommandItem
                                            key={employee.id}
                                            value={employee.id}
                                            onSelect={async () => {
                                              const updatedUser = { ...selectedUser, processActive: false, botMode: 'user', activeResource: employee.id }
                                              setSelectedUser(updatedUser as ChatUser)
                                              setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser as ChatUser : u))
                                              try {
                                                await api.patch(`/data/conversations/me/${selectedUser.id}`, { process_type: 'user', process_id: employee.id })
                                                console.log(`Chat delegated to: ${employee.name}`)
                                              } catch (err) {
                                                console.error("Failed to delegate chat", err)
                                              }
                                            }}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                            {employee.name}
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button
                      size='icon'
                      variant='ghost'
                      className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                    >
                      <Video size={22} className='stroke-muted-foreground' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='hidden size-8 rounded-full sm:inline-flex lg:size-10'
                    >
                      <Phone size={22} className='stroke-muted-foreground' />
                    </Button>
                    <Button
                      size='icon'
                      variant={showContactProfile ? 'secondary' : 'ghost'}
                      className='size-8 rounded-full lg:size-10'
                      onClick={() => setShowContactProfile(!showContactProfile)}
                      title={t('chats.contact_info')}
                    >
                      <Info size={22} className={showContactProfile ? 'stroke-primary' : 'stroke-muted-foreground'} />
                    </Button>
                  </div>
                </div>

                {/* Conversation */}
                <div className='flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4'>
                  <div className='flex size-full flex-1'>
                    <div className='chat-text-container relative -me-4 flex flex-1 flex-col overflow-y-hidden'>
                      <div
                        ref={scrollViewportRef}
                        className='chat-flex flex h-40 w-full grow flex-col justify-start gap-4 overflow-y-auto py-2 pe-4 pb-4'
                        onScroll={(e) => {
                          const target = e.currentTarget
                          // Trigger earlier (50px from top) and ensure we are not already loading
                          if (target.scrollTop < 50 && hasMore && !isLoadingMore && !isLoadingHistoryRef.current) {
                            loadMoreMessages()
                          }
                        }}
                      >
                        {isLoadingMore && (
                          <div className="flex justify-center p-2">
                            <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                          </div>
                        )}
                        {isLoadingMessages ? (
                          <div className='flex flex-col gap-4 p-4 mt-auto'>
                            <div className='flex flex-col gap-2 self-end w-3/4 items-end'>
                              <Skeleton className='h-16 w-full rounded-2xl rounded-tr-none bg-primary/10' />
                            </div>
                            <div className='flex flex-col gap-2 self-start w-3/4 items-start'>
                              <Skeleton className='h-16 w-full rounded-2xl rounded-tl-none bg-muted' />
                            </div>
                            <div className='flex flex-col gap-2 self-end w-2/3 items-end'>
                              <Skeleton className='h-12 w-full rounded-2xl rounded-tr-none bg-primary/10' />
                            </div>
                            <div className='flex flex-col gap-2 self-start w-1/2 items-start'>
                              <Skeleton className='h-12 w-full rounded-2xl rounded-tl-none bg-muted' />
                            </div>
                          </div>
                        ) : (
                          currentMessage &&
                          Object.keys(currentMessage).map((key) => (
                            <Fragment key={key}>
                              <div className='sticky top-2 z-20 flex justify-center py-2'>
                                <span className='bg-secondary/80 text-secondary-foreground backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium shadow-xs'>
                                  {key}
                                </span>
                              </div>
                              {currentMessage[key].map((msg, index) => {
                                const isMe = msg.sender === t('chats.you') || msg.sender === t('chats.bot') || ['agent', 'bot', 'flow', 'user'].includes(msg.senderType || '')
                                const isBot = msg.sender === t('chats.bot') || msg.senderType === 'bot'


                                return (
                                  <div
                                    key={`${msg.sender}-${msg.timestamp}-${index}`}
                                    className={cn(
                                      'chat-box break-words whitespace-pre-wrap shadow-lg max-w-[85%] md:max-w-md',
                                      msg.contentType === 'sticker' ? 'bg-transparent shadow-none' : 'px-3 py-2',
                                      isMe
                                        ? msg.contentType === 'sticker' ? 'self-end' : cn(
                                          'text-primary-foreground/75 self-end rounded-[16px_16px_0_16px]',
                                          'bg-primary/90'
                                        )
                                        : msg.contentType === 'sticker' ? 'self-start' : 'bg-muted self-start rounded-[16px_16px_16px_0]'
                                    )}
                                  >

                                    {/* Render based on content type */}
                                    {msg.contentType === 'image' && msg.mediaUrl && (
                                      <img
                                        src={msg.mediaUrl.startsWith('blob:') || msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}${msg.mediaUrl}`}
                                        alt={t('chats.image')}
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-1"
                                        onClick={() => {
                                          if (msg.mediaUrl && !msg.mediaUrl.startsWith('blob:')) {
                                            const url = msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}${msg.mediaUrl}`
                                            window.open(url, '_blank')
                                          }
                                        }}
                                      />
                                    )}
                                    {msg.contentType === 'sticker' && msg.mediaUrl && (
                                      <img
                                        src={msg.mediaUrl.startsWith('blob:') || msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}${msg.mediaUrl}`}
                                        alt={t('chats.sticker')}
                                        className="w-40 max-w-full h-auto"
                                      />
                                    )}
                                    {msg.contentType === 'audio' && msg.mediaUrl && (
                                      <audio controls className="max-w-full">
                                        <source src={msg.mediaUrl.startsWith('blob:') || msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}${msg.mediaUrl}`} />
                                        {t('common.error')}
                                      </audio>
                                    )}
                                    {msg.contentType === 'video' && msg.mediaUrl && (
                                      <video controls className="max-w-full rounded-lg mb-1">
                                        <source src={msg.mediaUrl.startsWith('blob:') || msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}${msg.mediaUrl}`} />
                                        {t('common.error')}
                                      </video>
                                    )}
                                    {msg.contentType === 'document' && msg.mediaUrl && (
                                      <a
                                        href={msg.mediaUrl.startsWith('blob:') || msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}${msg.mediaUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline"
                                      >
                                        📎 {msg.message || t('common.loading')}
                                      </a>
                                    )}
                                    {/* Text content or caption */}
                                    {(msg.contentType === 'text' || (msg.message && !msg.message.startsWith('/storage'))) && (
                                      <div className='whitespace-pre-wrap leading-relaxed'>
                                        {formatMessage(msg.message)}
                                      </div>
                                    )}
                                    {/* Footer: Sender Name, Timestamp and Status */}
                                    <div className={cn(
                                      'mt-1 flex items-center gap-1.5',
                                      isMe ? 'justify-end' : 'justify-start'
                                    )}>
                                      {/* Show sender name with icon for all messages */}
                                      {msg.senderName && (
                                        <div className="flex items-center gap-1">
                                          {(msg.senderType === 'bot' || msg.senderType === 'agent') && (
                                            <Sparkles
                                              size={13}
                                              className={cn(
                                                "shrink-0",
                                                isMe ? "text-white/95 fill-white/20" : "text-primary/80 fill-primary/10"
                                              )}
                                            />
                                          )}
                                          {msg.senderType === 'flow' && (
                                            <Workflow
                                              size={13}
                                              className={cn(
                                                "shrink-0",
                                                isMe ? "text-white/95 fill-white/20" : "text-violet-600/80 fill-violet-600/10"
                                              )}
                                            />
                                          )}
                                          {msg.senderType === 'orchestrator' && (
                                            <Network
                                              size={13}
                                              className={cn(
                                                "shrink-0",
                                                isMe ? "text-white/95 fill-white/20" : "text-cyan-600/80 fill-cyan-600/10"
                                              )}
                                            />
                                          )}
                                          {msg.senderType === 'user' && (
                                            <User
                                              size={13}
                                              className={cn(
                                                "shrink-0",
                                                isMe ? "text-white/95 fill-white/20" : "text-blue-600/80 fill-blue-600/10"
                                              )}
                                            />
                                          )}
                                          {/* Legacy Fallback */}
                                          {(!msg.senderType && isBot) && (
                                            <Bot
                                              size={13}
                                              className={cn(
                                                "shrink-0",
                                                isMe ? "text-white/95 fill-white/20" : "text-primary/80 fill-primary/10"
                                              )}
                                            />
                                          )}
                                          <span
                                            className={cn(
                                              'text-xs font-medium',
                                              isMe ? 'text-primary-foreground/95' : 'text-foreground/90'
                                            )}
                                          >
                                            {msg.senderName}
                                          </span>
                                          <span className={cn(
                                            'text-xs',
                                            isMe ? 'text-primary-foreground/70' : 'text-foreground/60'
                                          )}>•</span>
                                        </div>
                                      )}
                                      <span
                                        className={cn(
                                          'text-xs font-light italic',
                                          isMe ? 'text-primary-foreground/90' : 'text-foreground/80'
                                        )}
                                      >
                                        {format(new Date(msg.timestamp), 'h:mm a', { locale: i18n.language === 'es' ? es : enUS })}

                                      </span>
                                      {/* Message status checks (only for own messages) */}
                                      {isMe && (
                                        <span className="shrink-0">
                                          {msg.status === 'sending' && (
                                            <Check size={14} className="text-primary-foreground/70" />
                                          )}
                                          {msg.status === 'delivered' && (
                                            <CheckCheck size={14} className="text-primary-foreground/70" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </Fragment>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                  </div>
                  <form className='flex w-full flex-none gap-2' onSubmit={handleSendMessage}>
                    <input
                      ref={fileInputRef}
                      type='file'
                      className='hidden'
                      accept='*/*'
                      onChange={handleFileSelect}
                    />
                    <div className='border-input bg-card focus-within:ring-ring flex flex-1 items-center gap-2 rounded-md border px-2 py-1 focus-within:ring-1 focus-within:outline-hidden lg:gap-4'>
                      {!isRecording ? (
                        <>
                          <Button
                            size='icon'
                            type='button'
                            variant='ghost'
                            className='h-8 rounded-md shrink-0'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingFile}
                            title={t('chats.attach_file')}
                          >
                            <Plus size={20} className='stroke-muted-foreground' />
                          </Button>
                          <label className='flex-1'>
                            <span className='sr-only'>{t('chats.type_message')}</span>
                            <textarea
                              placeholder={t('chats.type_message')}
                              className='py-1.5 leading-5 max-h-32 w-full bg-inherit focus-visible:outline-hidden resize-none overflow-y-auto'
                              rows={1}
                              value={messageInput}
                              onChange={(e) => {
                                setMessageInput(e.target.value)
                                // Auto-resize textarea
                                e.target.style.height = 'auto'
                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                              }}
                              onKeyDown={(e) => {
                                // Enter sends, Shift+Enter adds newline
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  const form = e.currentTarget.closest('form')
                                  if (form) form.requestSubmit()
                                }
                              }}
                              disabled={isSending || isUploadingFile}
                            />
                          </label>
                          {messageInput.trim() ? (
                            <Button
                              variant='ghost'
                              size='icon'
                              type='submit'
                              className='shrink-0'
                              disabled={isSending || !messageInput.trim()}
                              title={t('chats.send_message')}
                            >
                              <Send size={20} />
                            </Button>
                          ) : (
                            <Button
                              variant='ghost'
                              size='icon'
                              type='button'
                              className='shrink-0'
                              onClick={startRecording}
                              title={t('chats.record_audio')}
                            >
                              <Mic size={20} className='stroke-muted-foreground' />
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className='flex-1 flex items-center gap-3'>
                            <div className='size-3 rounded-full bg-red-500 animate-pulse' />
                            <span className='text-sm font-medium'>
                              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                            <span className='text-xs text-muted-foreground'>{t('chats.recording_audio')}</span>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            type='button'
                            className='shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50'
                            onClick={stopRecording}
                            title={t('chats.stop_recording')}
                          >
                            <StopCircle size={20} />
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Contact Profile Panel */}
              {showContactProfile && selectedUser && (
                <div className='w-80 border-l bg-card flex flex-col shrink-0 hidden lg:flex'>
                  {/* Profile Header */}
                  <div className='flex items-center justify-between p-4 border-b'>
                    <h3 className='font-semibold'>{t('chats.contact_info')}</h3>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-8 rounded-full'
                      onClick={() => setShowContactProfile(false)}
                    >
                      <X size={18} />
                    </Button>
                  </div>

                  {/* Profile Content */}
                  <ScrollArea className='flex-1 overflow-y-auto'>
                    {/* Avatar and Name */}
                    <div className='flex flex-col items-center py-8 px-4 border-b'>
                      <Avatar className='size-24 mb-4'>
                        <AvatarImage src={selectedUser.profile} alt={selectedUser.fullName} />
                        <AvatarFallback className='text-2xl'>{getInitials(selectedUser.fullName)}</AvatarFallback>
                      </Avatar>
                      {editingName ? (
                        <div className='flex items-center gap-2 w-full max-w-[200px]'>
                          <input
                            type='text'
                            autoFocus
                            className='w-full border rounded px-2 py-1 text-sm bg-background'
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveContactName()
                              if (e.key === 'Escape') setEditingName(false)
                            }}
                          />
                          <Button
                            size='icon'
                            variant='ghost'
                            className='size-7 shrink-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                            onClick={handleSaveContactName}
                            disabled={isSavingName}
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='size-7 shrink-0 text-muted-foreground hover:text-destructive'
                            onClick={() => setEditingName(false)}
                            disabled={isSavingName}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <div className='flex items-center gap-2 group'>
                          <h2 className='text-xl font-semibold text-center'>{selectedUser.fullName}</h2>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='size-6 text-muted-foreground/50 hover:text-muted-foreground transition-colors'
                            onClick={() => {
                              setEditedName(selectedUser.fullName)
                              setEditingName(true)
                            }}
                            title={t('common.edit')}
                          >
                            <Pencil size={14} className='text-muted-foreground' />
                          </Button>
                        </div>
                      )}
                      <p className='text-muted-foreground text-sm'>{selectedUser.phone}</p>
                    </div>

                    {/* Contact Details */}
                    <div className='p-4 space-y-4'>
                      <div>
                        <h4 className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2'>
                          {t('chats.phone')}
                        </h4>
                        <p className='text-sm'>{selectedUser.phone}</p>
                      </div>

                      {selectedUser.email && (
                        <div>
                          <h4 className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2'>
                            {t('chats.email')}
                          </h4>
                          <p className='text-sm'>{selectedUser.email}</p>
                        </div>
                      )}

                      <div>
                        <h4 className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2'>
                          {t('chats.channel')}
                        </h4>
                        <div className='flex items-center gap-2'>
                          <div className='size-2 rounded-full bg-emerald-500' />
                          <span className='text-sm capitalize'>{selectedUser.channelType || 'WhatsApp'}</span>
                        </div>
                      </div>

                      {/* Tags Section */}
                      <div>
                        <Separator className="my-4" />
                        <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2'>
                          <Tag className="size-3" /> Etiquetas (Categorización)
                        </h4>
                        <div className='flex flex-wrap gap-1.5'>
                          {selectedUser.tags && selectedUser.tags.length > 0 ? (
                            selectedUser.tags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground"
                                style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` } : {}}
                              >
                                {tag.name}
                              </span>
                            ))
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic">Sin etiquetas asignadas</p>
                          )}
                        </div>
                      </div>

                      {/* Custom Fields Section */}
                      <div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between mb-3">
                          <h4 className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                            <Database className="size-3" /> Información del Cliente
                          </h4>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Campos del Agente</span>
                        </div>
                        <div className='space-y-2.5'>
                          {(() => {
                            // 1. Get IDs of fields configured for this agent
                            const agentFieldIds = selectedUser.botMode === 'ia' || selectedUser.botMode === 'orchestrator'
                              ? (agents.find(a => a.id === selectedUser.activeResource)?.config?.data_capture_fields || [])
                              : [];

                            // 2. Identify fields that either have a value OR are assigned to the agent
                            const fieldsToDisplay = customFields.filter(field => {
                              const hasValue = selectedUser.customFieldValues?.some(v => v.field_id === field.id || v.field?.id === field.id);
                              const isAssigned = agentFieldIds.includes(field.id);
                              return hasValue || isAssigned;
                            });

                            // 3. Deduplicate by key to avoid the multiple "Nombre/Direccion" issue
                            const uniqueFields = Array.from(new Map(fieldsToDisplay.map(f => [f.key, f])).values());

                            return uniqueFields.map((field: any) => {
                              const value = selectedUser.customFieldValues?.find((v: any) => v.field_id === field.id || v.field?.id === field.id);
                              const hasValue = !!(value?.value_text || value?.value_number || value?.value_boolean !== undefined || value?.value_date);

                              return (
                                <div key={field.id} className={cn(
                                  "p-2.5 rounded-lg border transition-all",
                                  hasValue ? "bg-muted/30 border-border/50" : "bg-orange-500/5 border-orange-500/20 border-dashed"
                                )}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{field.label}</p>
                                    {field.is_required && !hasValue && (
                                      <span className="text-[8px] bg-orange-500 text-white px-1 rounded-sm font-black uppercase">Requerido</span>
                                    )}
                                    {hasValue && (
                                      <Check className="size-2.5 text-emerald-500" />
                                    )}
                                  </div>
                                  {hasValue ? (
                                    <p className="text-sm font-medium">
                                      {value.value_text || value.value_number || String(value.value_boolean ?? '') || value.value_date}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-muted-foreground italic">
                                      El agente debe solicitar este dato
                                    </p>
                                  )}
                                </div>
                              );
                            });
                          })()}
                          {customFields.length > 0 && customFields.filter(f => {
                            const agentFieldIds = selectedUser.botMode === 'ia' || selectedUser.botMode === 'orchestrator'
                              ? (agents.find(a => a.id === (selectedUser.activeResource ?? ''))?.config?.data_capture_fields || [])
                              : [];
                            const hasValue = selectedUser.customFieldValues?.some(v => v.field_id === f.id || v.field?.id === f.id);
                            return hasValue || agentFieldIds.includes(f.id);
                          }).length === 0 && (
                              <p className="text-[10px] text-muted-foreground italic text-center py-2">
                                Selecciona qué campos debe capturar este agente en 'Agentes {'->'} Sofia {'->'} Captura'
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Custom Status Selector */}
                      <Separator className='my-4' />
                      <div>
                        <h4 className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center justify-between'>
                          {t('chats.chat_status')}
                          {selectedUser.customStatus && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${selectedUser.customStatus.color}20`, color: selectedUser.customStatus.color }}>
                              {selectedUser.customStatus.name}
                            </span>
                          )}
                        </h4>

                        <div className="space-y-2">
                          {customStatuses.length > 0 ? (
                            <div className="grid grid-cols-1 gap-1.5">
                              {/* Option to clear status */}
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "justify-start h-9 text-xs font-medium border-dashed",
                                  !selectedUser.customStatusID && "bg-muted border-primary/30"
                                )}
                                onClick={async () => {
                                  if (!selectedUser.customStatusID) return

                                  const updatedUser = { ...selectedUser, customStatusID: '', customStatus: undefined }
                                  setSelectedUser(updatedUser)
                                  setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))

                                  try {
                                    await api.patch(`/data/conversations/me/${selectedUser.id}`, {
                                      custom_status_id: null
                                    })
                                  } catch (err) {
                                    console.error("Failed to clear custom status", err)
                                  }
                                }}
                              >
                                <X className="mr-2 h-3 w-3" />
                                {t('chats.no_status')}
                              </Button>

                              {customStatuses.map((status) => (
                                <Button
                                  key={status.id}
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "justify-start h-9 text-xs font-medium transition-all hover:bg-muted",
                                    selectedUser.customStatusID === status.id && "ring-1 ring-primary/30 bg-muted"
                                  )}
                                  style={{ borderColor: selectedUser.customStatusID === status.id ? status.color : undefined }}
                                  onClick={async () => {
                                    if (selectedUser.customStatusID === status.id) return

                                    const updatedUser = {
                                      ...selectedUser,
                                      customStatusID: status.id,
                                      customStatus: { name: status.name, color: status.color }
                                    }
                                    setSelectedUser(updatedUser)
                                    setChatList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))

                                    try {
                                      await api.patch(`/data/conversations/me/${selectedUser.id}`, {
                                        custom_status_id: status.id
                                      })
                                    } catch (err) {
                                      console.error("Failed to update custom status", err)
                                    }
                                  }}
                                >
                                  <div className="size-2.5 rounded-full mr-2 shadow-xs" style={{ backgroundColor: status.color }} />
                                  {status.name}
                                  {selectedUser.customStatusID === status.id && <Check className="ml-auto h-3 w-3 text-primary" />}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 px-2 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5">
                              <p className="text-[11px] text-muted-foreground italic">
                                {t('chats.no_statuses')}
                              </p>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-[10px] mt-1"
                                onClick={() => window.open('/devices', '_blank')}
                              >
                                {t('common.edit')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          ) : (
            <div
              className={cn(
                'bg-card absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border shadow-xs sm:static sm:z-auto sm:flex'
              )}
            >
              <div className='flex flex-col items-center space-y-6'>
                <div className='border-border flex size-16 items-center justify-center rounded-full border-2'>
                  <MessagesSquare className='size-8' />
                </div>
                <div className='space-y-2 text-center'>
                  <h1 className='text-xl font-semibold'>{t('chats.no_chats_selected_title')}</h1>
                  <p className='text-muted-foreground text-sm'>
                    {t('chats.no_chats_selected_subtitle')}
                  </p>
                </div>
                <Button onClick={() => setCreateConversationDialog(true)}>
                  {t('chats.new_message')}
                </Button>
              </div>
            </div>
          )}
        </section >
        <NewChat
          users={users}
          onOpenChange={setCreateConversationDialog}
          open={createConversationDialogOpened}
          onSelect={(item) => {
            if (item.type === 'chat') {
              handleSelectUser(item.data)
            } else if (item.type === 'contact') {
              const contact = item.data
              const firstConnected = chatList.find(c => c.deviceStatus === 'active' || c.deviceId)?.deviceId;

              const newUser: ChatUser = {
                id: 'temp-' + contact.id,
                contactId: contact.id,
                conversationId: '',
                username: contact.value || contact.label,
                fullName: contact.label,
                profile: contact.image,
                email: '',
                phone: contact.description, // Phone comes in description from search
                title: t('chats.client'),

                processActive: false,
                messages: [],
                deviceId: firstConnected || '',
                channelType: 'whatsapp',
                deviceStatus: firstConnected ? 'active' : 'disconnected'
              }

              handleSelectUser(newUser)
            }
          }}
        />
      </div >
    </>
  )
}
