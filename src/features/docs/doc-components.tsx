import { useState, useCallback, type ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { Check, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CodeBlockProps {
    code: string
    language?: string
    title?: string
    className?: string
    collapsible?: boolean
    defaultOpen?: boolean
}

export function CodeBlock({ code, language = 'bash', title, className, collapsible = false, defaultOpen = true }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [code])

    return (
        <div className={cn("rounded-xl border border-border/50 overflow-hidden bg-zinc-950 dark:bg-zinc-950/80", className)}>
            {title && (
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {collapsible && (
                            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                            </div>
                            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn("h-6 px-2 text-[10px] gap-1 text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                            copied && "text-emerald-400")}
                        onClick={handleCopy}
                    >
                        {copied ? <><Check className="h-3 w-3" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
                    </Button>
                </div>
            )}
            {(!collapsible || isOpen) && (
                <div className="relative group">
                    <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                        <code className={cn("text-[13px] font-mono", `language-${language}`)}>
                            {code.split('\n').map((line, i) => (
                                <div key={i} className="table-row">
                                    <span className="table-cell pr-4 text-right text-zinc-600 select-none text-[11px] w-8">{i + 1}</span>
                                    <span className="table-cell text-zinc-200">
                                        {highlightSyntax(line, language)}
                                    </span>
                                </div>
                            ))}
                        </code>
                    </pre>
                    {!title && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-200 hover:bg-white/10",
                                copied && "opacity-100 text-emerald-400"
                            )}
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

function highlightSyntax(line: string, language: string) {
    if (language === 'json') {
        return highlightJSON(line)
    }
    if (language === 'bash' || language === 'shell') {
        return highlightBash(line)
    }
    if (language === 'javascript' || language === 'typescript') {
        return highlightJS(line)
    }
    if (language === 'go') {
        return highlightGo(line)
    }
    return <>{line}</>
}

function highlightJSON(line: string) {
    const parts: ReactElement[] = []
    let remaining = line
    let key = 0

    // Match JSON keys
    const keyRegex = /("[\w_./-]*")\s*:/g
    let match
    let lastIndex = 0

    while ((match = keyRegex.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>)
        }
        parts.push(<span key={key++} className="text-violet-400">{match[1]}</span>)
        parts.push(<span key={key++}>:</span>)
        lastIndex = match.index + match[0].length
    }

    if (lastIndex < remaining.length) {
        const rest = remaining.slice(lastIndex)
        // Highlight string values
        const strParts = rest.split(/("(?:[^"\\]|\\.)*")/)
        strParts.forEach((part, _i) => {
            if (part.startsWith('"') && part.endsWith('"')) {
                parts.push(<span key={key++} className="text-emerald-400">{part}</span>)
            } else {
                // Highlight numbers and booleans
                const numParts = part.split(/\b(true|false|null|\d+\.?\d*)\b/)
                numParts.forEach((np, _j) => {
                    if (/^(true|false|null)$/.test(np)) {
                        parts.push(<span key={key++} className="text-amber-400">{np}</span>)
                    } else if (/^\d+\.?\d*$/.test(np)) {
                        parts.push(<span key={key++} className="text-cyan-400">{np}</span>)
                    } else {
                        parts.push(<span key={key++}>{np}</span>)
                    }
                })
            }
        })
    }

    return <>{parts.length > 0 ? parts : line}</>
}

function highlightBash(line: string) {
    if (line.startsWith('#')) {
        return <span className="text-zinc-500 italic">{line}</span>
    }
    if (line.startsWith('$') || line.startsWith('>')) {
        return (
            <>
                <span className="text-emerald-400">{line.charAt(0)}</span>
                <span className="text-zinc-200">{line.slice(1)}</span>
            </>
        )
    }

    const parts: ReactElement[] = []
    let key = 0
    const tokens = line.split(/(\s+)/)
    let isFirst = true

    tokens.forEach(token => {
        if (token.match(/^\s+$/)) {
            parts.push(<span key={key++}>{token}</span>)
            return
        }
        if (isFirst && !token.match(/^\s+$/)) {
            parts.push(<span key={key++} className="text-cyan-400">{token}</span>)
            isFirst = false
        } else if (token.startsWith('--') || token.startsWith('-')) {
            parts.push(<span key={key++} className="text-amber-400">{token}</span>)
        } else if (token.startsWith('"') || token.startsWith("'")) {
            parts.push(<span key={key++} className="text-emerald-400">{token}</span>)
        } else if (token.startsWith('http') || token.startsWith('/')) {
            parts.push(<span key={key++} className="text-violet-400">{token}</span>)
        } else {
            parts.push(<span key={key++}>{token}</span>)
        }
    })

    return <>{parts}</>
}

function highlightJS(line: string) {
    const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'import', 'from', 'export', 'default', 'new', 'throw']
    const parts: ReactElement[] = []
    let key = 0

    if (line.trimStart().startsWith('//')) {
        return <span className="text-zinc-500 italic">{line}</span>
    }

    const tokens = line.split(/(\b\w+\b|"[^"]*"|'[^']*'|`[^`]*`|\s+|\W)/)
    tokens.forEach(token => {
        if (keywords.includes(token)) {
            parts.push(<span key={key++} className="text-violet-400 font-medium">{token}</span>)
        } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
            parts.push(<span key={key++} className="text-emerald-400">{token}</span>)
        } else if (/^\d+$/.test(token)) {
            parts.push(<span key={key++} className="text-cyan-400">{token}</span>)
        } else {
            parts.push(<span key={key++}>{token}</span>)
        }
    })

    return <>{parts}</>
}

function highlightGo(line: string) {
    const keywords = ['func', 'return', 'if', 'else', 'for', 'range', 'var', 'type', 'struct', 'interface', 'package', 'import', 'defer', 'go', 'chan', 'map', 'nil', 'err', 'error']
    const parts: ReactElement[] = []
    let key = 0

    if (line.trimStart().startsWith('//')) {
        return <span className="text-zinc-500 italic">{line}</span>
    }

    const tokens = line.split(/(\b\w+\b|"[^"]*"|'[^']*'|\s+|\W)/)
    tokens.forEach(token => {
        if (keywords.includes(token)) {
            parts.push(<span key={key++} className="text-violet-400 font-medium">{token}</span>)
        } else if (token.startsWith('"') || token.startsWith("'")) {
            parts.push(<span key={key++} className="text-emerald-400">{token}</span>)
        } else if (/^\d+$/.test(token)) {
            parts.push(<span key={key++} className="text-cyan-400">{token}</span>)
        } else {
            parts.push(<span key={key++}>{token}</span>)
        }
    })

    return <>{parts}</>
}

interface StepProps {
    number: number
    title: string
    children: React.ReactNode
}

export function Step({ number, title, children }: StepProps) {
    return (
        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${number * 50}ms` }}>
            <div className="flex flex-col items-center shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                    {number}
                </div>
                <div className="w-px flex-1 bg-border/50 mt-2" />
            </div>
            <div className="pb-8 flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-3">{title}</h4>
                <div className="space-y-3 text-sm text-muted-foreground">
                    {children}
                </div>
            </div>
        </div>
    )
}

interface CalloutProps {
    type?: 'info' | 'warning' | 'success' | 'danger'
    title?: string
    children: React.ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
    const styles = {
        info: 'bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
        warning: 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
        success: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        danger: 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400',
    }

    const icons = {
        info: '💡',
        warning: '⚠️',
        success: '✅',
        danger: '🚨',
    }

    return (
        <div className={cn("rounded-xl border p-4 text-sm", styles[type])}>
            <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0 mt-0.5">{icons[type]}</span>
                <div className="flex-1 min-w-0">
                    {title && <p className="font-semibold mb-1">{title}</p>}
                    <div className="text-sm opacity-90">{children}</div>
                </div>
            </div>
        </div>
    )
}

interface EndpointCardProps {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    description: string
    auth?: string
}

export function EndpointCard({ method, path, description }: EndpointCardProps) {
    const methodColors: Record<string, string> = {
        GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        POST: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        PUT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        PATCH: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-all group">
            <span className={cn("text-[11px] font-bold px-2 py-1 rounded-md border shrink-0", methodColors[method])}>
                {method}
            </span>
            <code className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">
                {path}
            </code>
            <span className="text-xs text-muted-foreground hidden sm:block">{description}</span>
        </div>
    )
}
