import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getDocsData } from './channel-docs-data'
import { CodeBlock, Callout, EndpointCard } from './doc-components'
import {
    BookOpen, Key, Webhook, Shield, Copy, Check,
    Terminal, Hash, Zap, ArrowLeft,
    Code2, Lock, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// =======================================
// Main Documentation Page — Client-Facing
// =======================================
export function DocsPage() {
    const { t } = useTranslation()
    const [activeSection, setActiveSection] = useState('tokens')
    const baseUrl = window.location.origin
    const docsData = useMemo(() => getDocsData(baseUrl), [baseUrl])

    const sections = [
        { id: 'tokens', label: t('docs.sections.tokens'), icon: Key },
        { id: 'endpoints', label: t('docs.sections.endpoints'), icon: Terminal },
        { id: 'webhooks', label: t('docs.sections.webhooks'), icon: Webhook },
        { id: 'examples', label: t('docs.sections.examples'), icon: Code2 },
    ]

    const scrollTo = (id: string) => {
        setActiveSection(id)
        document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-4xl mx-auto flex h-14 items-center gap-4 px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                            <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm">{t('docs.title')}</span>
                    </div>

                    <div className="flex-1" />

                    {/* Section pills */}
                    <nav className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-muted/30 border">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                    activeSection === s.id
                                        ? "bg-background shadow-sm text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <s.icon className="h-3.5 w-3.5" />
                                {s.label}
                            </button>
                        ))}
                    </nav>

                    <Button variant="ghost" size="sm" asChild>
                        <a href="/" className="gap-1.5">
                            <ArrowLeft className="h-3.5 w-3.5" /> {t('docs.panel')}
                        </a>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1">
                <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-16">

                    {/* Intro */}
                    <div className="space-y-4">
                        <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                            <Zap className="h-3 w-3" /> {t('docs.developer_guide')}
                        </Badge>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            {t('docs.api_webhooks')}
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {docsData.apiIntro}
                        </p>
                    </div>

                    {/* ===== SECTION: API TOKENS ===== */}
                    <DocSection id="tokens" title={t('docs.auth.title')} icon={Key}>
                        <div className="space-y-6">
                            <Callout type="warning" title={t('docs.auth.save_token_warning')}>
                                <p dangerouslySetInnerHTML={{ __html: t('docs.auth.save_token_description') }} />
                            </Callout>

                            {/* Token quick facts */}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="p-4 rounded-xl border bg-card/50 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">{t('docs.auth.prefix')}</span>
                                    </div>
                                    <code className="text-sm font-mono bg-muted/30 px-2 py-1 rounded block">{docsData.tokenInfo.prefix}</code>
                                    <p className="text-xs text-muted-foreground">{t('docs.auth.prefix_description')}</p>
                                </div>
                                <div className="p-4 rounded-xl border bg-card/50 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Key className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-bold">{t('docs.auth.max_per_device')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{docsData.tokenInfo.maxPerDevice}</p>
                                    <p className="text-xs text-muted-foreground">{t('docs.auth.max_per_device_description')}</p>
                                </div>
                                <div className="p-4 rounded-xl border bg-card/50 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-violet-500" />
                                        <span className="text-sm font-bold">{t('docs.auth.expiration')}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {docsData.tokenInfo.expirations.map(exp => (
                                            <Badge key={exp} variant="secondary" className="text-[10px]">{exp}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Scopes */}
                            <div className="p-4 rounded-xl border bg-card/50 space-y-3">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-violet-500" /> {t('docs.auth.scopes_available')}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {docsData.tokenInfo.scopes.map(scope => (
                                        <code key={scope} className="text-xs px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-mono font-medium">
                                            {scope}
                                        </code>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('docs.auth.scopes_description')}
                                </p>
                            </div>

                            {/* Auth methods */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold">{t('docs.auth.auth_methods')}</h4>
                                {docsData.tokenInfo.authMethods.map((method, i) => (
                                    <AuthMethodCard key={i} method={method} />
                                ))}
                            </div>

                            <CodeBlock
                                title={t('docs.auth.full_example')}
                                language="bash"
                                code={`# Opción 1: Authorization Header (recomendado)
curl -H "Authorization: Bearer lnk_tu_token" \\
  ${baseUrl}/api/v1/device/info

# Opción 2: X-API-Key Header
curl -H "X-API-Key: lnk_tu_token" \\
  ${baseUrl}/api/v1/device/info

# Opción 3: Query Parameter
curl "${baseUrl}/api/v1/device/info?api_key=lnk_tu_token"`}
                            />
                        </div>
                    </DocSection>

                    {/* ===== SECTION: ENDPOINTS ===== */}
                    <DocSection id="endpoints" title={t('docs.endpoints.title')} icon={Terminal}>
                        <div className="space-y-4">
                            <Callout type="info" title={t('docs.endpoints.base_url_title')}>
                                <p>{t('docs.endpoints.base_url_description')} <code className="text-xs bg-muted/30 px-1.5 py-0.5 rounded font-mono">{baseUrl}</code></p>
                            </Callout>

                            <div className="space-y-2">
                                {docsData.apiEndpoints.map((endpoint, i) => (
                                    <EndpointCard
                                        key={i}
                                        method={endpoint.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'}
                                        path={endpoint.path}
                                        description={endpoint.description}
                                    />
                                ))}
                            </div>
                        </div>
                    </DocSection>

                    {/* ===== SECTION: WEBHOOKS ===== */}
                    <DocSection id="webhooks" title={t('docs.webhooks.title')} icon={Webhook}>
                        <div className="space-y-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {docsData.webhookIntro}
                            </p>

                            <Callout type="info" title={t('docs.webhooks.how_to_create')}>
                                <p dangerouslySetInnerHTML={{ __html: t('docs.webhooks.how_to_create_description') }} />
                            </Callout>

                            {/* Events table */}
                            <div className="rounded-xl border overflow-hidden">
                                <div className="px-4 py-3 bg-muted/10 border-b">
                                    <h4 className="text-sm font-bold">{t('docs.webhooks.available_events')}</h4>
                                </div>
                                <div className="divide-y">
                                    {docsData.webhookEvents.map(event => (
                                        <div key={event.name} className="flex items-start gap-4 px-4 py-3 hover:bg-muted/5 transition-colors">
                                            <code className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                                                {event.name}
                                            </code>
                                            <p className="text-sm text-muted-foreground">{event.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payload example */}
                            <CodeBlock
                                title={t('docs.webhooks.payload_example')}
                                language="json"
                                code={docsData.webhookPayloadExample}
                            />

                            {/* HMAC Verification */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    {t('docs.webhooks.signature_verification')}
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t('docs.webhooks.signature_description')}
                                </p>
                                <CodeBlock
                                    title={t('docs.webhooks.verify_signature')}
                                    language="javascript"
                                    code={docsData.webhookVerificationCode}
                                />
                            </div>
                        </div>
                    </DocSection>

                    {/* ===== SECTION: CODE EXAMPLES ===== */}
                    <DocSection id="examples" title={t('docs.examples.title')} icon={Code2}>
                        <div className="space-y-6">
                            {docsData.codeExamples.map((example, i) => (
                                <CodeBlock
                                    key={i}
                                    title={example.title}
                                    language={example.language}
                                    code={example.code}
                                />
                            ))}
                        </div>
                    </DocSection>

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/5">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        {t('docs.footer.need_help')}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        {t('docs.footer.copyright')}
                    </p>
                </div>
            </footer>
        </div>
    )
}

// =======================================
// Doc Section Wrapper
// =======================================
function DocSection({ id, title, icon: Icon, children }: {
    id: string
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) {
    return (
        <section id={`section-${id}`} className="scroll-mt-20 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                <a href={`#section-${id}`} className="text-muted-foreground hover:text-foreground transition-all ml-auto">
                    <Hash className="h-4 w-4" />
                </a>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </section>
    )
}

// =======================================
// Auth Method Card
// =======================================
function AuthMethodCard({ method }: { method: { title: string; header: string; example: string } }) {
    const [copied, setCopied] = useState(false)

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-card/30 hover:bg-card/60 transition-all group">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">{method.title}</p>
                <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground">
                        {method.header}: <span className="text-foreground">{method.example}</span>
                    </code>
                </div>
            </div>
            <button
                onClick={() => {
                    navigator.clipboard.writeText(`${method.header}: ${method.example}`)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                }}
                className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-lg border transition-all",
                    copied
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : "bg-muted/20 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/40"
                )}
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    )
}
