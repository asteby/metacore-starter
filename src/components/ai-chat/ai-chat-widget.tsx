import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Plus, Send, Bot, Loader2, Minimize2, Sparkles, Lightbulb,
  Search, Database, Brain, BarChart3, PlusCircle, Pencil, Trash2,
  BookOpen, PackageSearch, MessageSquare, Calculator, Image,
  Volume2, User, Contact, History, LayoutGrid, FileSearch, Cog,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useWebSocketContext } from '@/context/websocket-provider'
import Markdown from 'react-markdown'

type Message = {
  role: 'user' | 'ai' | 'activity'
  content: string
  tool?: string
  images?: { url: string; caption: string }[]
}

type ChatTab = {
  id: string
  sessionId: string
  title: string
  messages: Message[]
  loading: boolean
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [tabs, setTabs] = useState<ChatTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [minimized, setMinimized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { lastMessage } = useWebSocketContext()

  const currentTab = tabs.find((t) => t.id === activeTab)

  // Listen for AI_ACTIVITY events from WebSocket
  useEffect(() => {
    if (!lastMessage) return
    try {
      const data = JSON.parse(lastMessage.data)
      if (data.type === 'AI_ACTIVITY' && data.payload) {
        const { session_id, message, type: eventType } = data.payload
        if (eventType === 'tool_call' && message) {
          setTabs((prev) =>
            prev.map((t) =>
              t.sessionId === session_id
                ? {
                    ...t,
                    messages: [
                      ...t.messages.filter((m) => m.role !== 'activity'),
                      { role: 'activity' as const, content: message, tool: data.payload.tool },
                    ],
                  }
                : t
            )
          )
        }
      }
    } catch {
      /* ignore */
    }
  }, [lastMessage])

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  // Focus input
  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [activeTab, open, minimized])

  const createTab = useCallback(() => {
    const tabId = crypto.randomUUID()
    const newTab: ChatTab = {
      id: tabId,
      sessionId: '',
      title: 'Nueva tarea',
      messages: [],
      loading: false,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTab(tabId)
  }, [])

  const closeTab = useCallback(
    (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId)
        if (activeTab === tabId) {
          setActiveTab(next.length > 0 ? next[next.length - 1].id : null)
        }
        return next
      })
    },
    [activeTab]
  )

  const handleOpen = useCallback(() => {
    setOpen(true)
    if (tabs.length === 0) createTab()
  }, [tabs.length, createTab])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !currentTab || currentTab.loading) return

    const msg = input.trim()
    setInput('')

    const isFirst = currentTab.messages.length === 0
    const title = isFirst ? (msg.length > 30 ? msg.slice(0, 30) + '...' : msg) : currentTab.title

    // Generate sessionId upfront so WS events can match during the request
    const sessionId = currentTab.sessionId || crypto.randomUUID()

    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab
          ? { ...t, title, sessionId, messages: [...t.messages, { role: 'user' as const, content: msg }], loading: true }
          : t
      )
    )

    try {
      const res = await api.post('/chat/send', {
        message: msg,
        session_id: sessionId,
      })

      const data = res.data
      if (data.success) {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTab
              ? {
                  ...t,
                  sessionId: data.session_id,
                  messages: [
                    ...t.messages.filter((m) => m.role !== 'activity'),
                    { role: 'ai' as const, content: data.message, images: data.images },
                  ],
                  loading: false,
                }
              : t
          )
        )
      }
    } catch {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTab
            ? {
                ...t,
                messages: [
                  ...t.messages.filter((m) => m.role !== 'activity'),
                  { role: 'ai' as const, content: 'Error al procesar el mensaje.' },
                ],
                loading: false,
              }
            : t
        )
      )
    }
  }, [input, currentTab, activeTab])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // --- Floating button ---
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Bot className="h-6 w-6" />
      </button>
    )
  }

  // --- Minimized ---
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1 rounded-full bg-card border shadow-lg px-3 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMinimized(false) }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors max-w-[120px] truncate',
              tab.id === activeTab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            {tab.title}
          </button>
        ))}
        <button onClick={() => setMinimized(false)} className="ml-1 p-1 hover:bg-muted rounded">
          <Bot className="h-4 w-4" />
        </button>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // --- Full panel ---
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[400px] flex-col rounded-xl border bg-card shadow-2xl" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Aby</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-muted"><Minimize2 className="h-4 w-4" /></button>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b px-2 py-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'group flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors shrink-0 max-w-[140px]',
              tab.id === activeTab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="truncate">{tab.title}</span>
            {tabs.length > 1 && (
              <span onClick={(e) => closeTab(tab.id, e)} className="ml-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-background/20 shrink-0">
                <X className="h-2.5 w-2.5" />
              </span>
            )}
          </button>
        ))}
        <button onClick={createTab} className="flex items-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0" title="Nueva tarea">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {currentTab ? (
          <div className="flex flex-col gap-3 p-4">
            {currentTab.messages.length === 0 && !currentTab.loading && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Bot className="h-8 w-8" />
                <p className="text-sm text-center">
                  Escribe tu tarea o pregunta.
                  <br />
                  <span className="text-xs">Puedo consultar datos, crear registros, analizar y mas.</span>
                </p>
              </div>
            )}
            {currentTab.messages.map((msg, i) =>
              msg.role === 'activity' ? (
                <ActivityLine key={i} content={msg.content} />
              ) : (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                    msg.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {msg.role === 'ai' ? (
                    <Markdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        code: ({ children }) => <code className="bg-background/20 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                        pre: ({ children }) => <pre className="bg-background/20 rounded p-2 my-1 overflow-x-auto text-xs">{children}</pre>,
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  ) : (
                    msg.content
                  )}
                  {msg.images?.map((img, j) => (
                    <img key={j} src={img.url} alt={img.caption} className="mt-2 rounded-lg max-w-full" />
                  ))}
                </div>
              )
            )}
            {currentTab.loading && !currentTab.messages.some((m) => m.role === 'activity') && (
              <ThinkingIndicator />
            )}
          </div>
        ) : null}
      </div>

      {/* Input */}
      {currentTab && (
        <div className="flex items-center gap-2 border-t px-3 py-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una tarea..."
            disabled={currentTab.loading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={sendMessage} disabled={!input.trim() || currentTab.loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Thinking indicator with rotating tips/messages
const thinkingMessages = [
  { icon: Bot, text: 'Analizando tu solicitud...', color: 'text-primary' },
  { icon: Brain, text: 'Procesando la información...', color: 'text-purple-400' },
  { icon: Search, text: 'Revisando los datos relevantes...', color: 'text-blue-400' },
  { icon: Database, text: 'Accediendo a la base de datos...', color: 'text-emerald-400' },
  { icon: Sparkles, text: 'Preparando la mejor respuesta...', color: 'text-amber-400' },
  { icon: Lightbulb, text: 'Tip: Puedes pedirme reportes, crear registros o analizar datos', color: 'text-yellow-400' },
  { icon: Lightbulb, text: 'Tip: Preguntame "¿cuántas ventas hubo este mes?"', color: 'text-yellow-400' },
  { icon: Lightbulb, text: 'Tip: Puedo buscar por similitud semántica en tus datos', color: 'text-yellow-400' },
  { icon: Lightbulb, text: 'Tip: Dime "crea un cliente" y lo hago por ti', color: 'text-yellow-400' },
  { icon: Bot, text: 'Razonando sobre la mejor estrategia...', color: 'text-primary' },
  { icon: BarChart3, text: 'Evaluando las opciones...', color: 'text-orange-400' },
  { icon: Sparkles, text: 'Casi listo...', color: 'text-amber-400' },
]

function ThinkingIndicator() {
  const [msgIndex, setMsgIndex] = useState(
    () => Math.floor(Math.random() * thinkingMessages.length)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => {
        let next: number
        do { next = Math.floor(Math.random() * thinkingMessages.length) } while (next === prev)
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const msg = thinkingMessages[msgIndex]
  const Icon = msg.icon

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground transition-opacity duration-300">
      <Icon className={cn('h-3.5 w-3.5 shrink-0 animate-pulse', msg.color)} />
      <span className="animate-pulse">{msg.text}</span>
    </div>
  )
}

// Icon map for tool activity indicators
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'search': Search,
  'database': Database,
  'brain': Brain,
  'bar-chart-3': BarChart3,
  'plus-circle': PlusCircle,
  'pencil': Pencil,
  'trash-2': Trash2,
  'book-open': BookOpen,
  'package-search': PackageSearch,
  'message-square': MessageSquare,
  'calculator': Calculator,
  'image': Image,
  'volume-2': Volume2,
  'user': User,
  'contact': Contact,
  'history': History,
  'layout-grid': LayoutGrid,
  'file-search': FileSearch,
  'cog': Cog,
}

const iconColors: Record<string, string> = {
  'search': 'text-blue-400',
  'database': 'text-emerald-400',
  'brain': 'text-purple-400',
  'bar-chart-3': 'text-orange-400',
  'plus-circle': 'text-green-400',
  'pencil': 'text-yellow-400',
  'trash-2': 'text-red-400',
  'book-open': 'text-cyan-400',
  'package-search': 'text-teal-400',
  'message-square': 'text-blue-300',
  'calculator': 'text-amber-400',
  'image': 'text-pink-400',
  'volume-2': 'text-indigo-400',
  'file-search': 'text-sky-400',
  'layout-grid': 'text-violet-400',
  'cog': 'text-gray-400',
}

function ActivityLine({ content }: { content: string }) {
  const parts = content.split('|')
  const iconKey = parts.length > 1 ? parts[0] : 'cog'
  const message = parts.length > 1 ? parts[1] : content

  const IconComponent = iconMap[iconKey] || Cog
  const colorClass = iconColors[iconKey] || 'text-gray-400'

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconComponent className={cn('h-3.5 w-3.5 shrink-0 animate-pulse', colorClass)} />
      <span className="animate-pulse">{message}</span>
    </div>
  )
}
