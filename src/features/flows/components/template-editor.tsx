import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Search, Sparkles } from 'lucide-react'
import { DEFAULT_TEMPLATES, MessageTemplate } from '../types/flow-types'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
    onSelect: (template: MessageTemplate) => void
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    const categories = [
        { id: 'all', label: t('common.all') },
        { id: 'greeting', label: t('common.greetings') },
        { id: 'info', label: t('common.information') },
        { id: 'action', label: t('common.actions') },
        { id: 'error', label: t('common.errors') },
        { id: 'custom', label: t('common.custom') },
    ]

    const filteredTemplates = DEFAULT_TEMPLATES.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.content.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleSelect = (template: MessageTemplate) => {
        onSelect(template)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('common.use_template')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="shrink-0 pb-4">
                    <DialogTitle>{t('common.select_template')}</DialogTitle>
                    <DialogDescription>
                        {t('common.choose_template')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col gap-4">
                    {/* Search */}
                    <div className="relative shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('agents.search_templates')}
                            className="pl-9"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategory === category.id ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    "flex-1 min-w-[100px]",
                                    selectedCategory === category.id && "bg-secondary hover:bg-secondary/80"
                                )}
                            >
                                {category.label}
                            </Button>
                        ))}
                    </div>

                    {/* Templates grid */}
                    <div className="flex-1 min-h-0 relative overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <div className="p-4">
                                {filteredTemplates.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('common.no_templates_found')}
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {filteredTemplates.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleSelect(template)}
                                                className="p-4 rounded-lg border text-left transition-all hover:border-primary hover:shadow-md hover:bg-muted/20"
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                        <h4 className="font-semibold text-sm">
                                                            {template.name}
                                                        </h4>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {template.category}
                                                    </Badge>
                                                </div>

                                                <div className="bg-muted/50 p-3 rounded-md mb-2">
                                                    <p className="text-sm font-mono whitespace-pre-wrap">
                                                        {template.content}
                                                    </p>
                                                </div>

                                                {template.variables.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        <Sparkles className="w-3 h-3 text-muted-foreground" />
                                                        {template.variables.map((variable, index) => (
                                                            <Badge
                                                                key={index}
                                                                variant="secondary"
                                                                className="text-xs font-mono"
                                                            >
                                                                {variable}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface TemplateEditorProps {
    value: string
    onChange: (value: string) => void
    label?: string
}

export function TemplateEditor({ value, onChange, label }: TemplateEditorProps) {
    const { t } = useTranslation()
    const [showPreview, setShowPreview] = useState(false)

    const handleTemplateSelect = (template: MessageTemplate) => {
        onChange(template.content)
    }

    // Simple preview - replace variables with placeholders
    const previewText = value.replace(/\{\{([^}]+)\}\}/g, (_match, variable) => {
        const exampleValues: Record<string, string> = {
            'contact.name': 'Juan Pérez',
            'business.name': 'Mi Negocio',
            'appointment.date': '15/01/2026',
            'appointment.time': '10:00',
            'payment.amount': '100.00',
            'payment.currency': 'USD',
            'payment.id': 'PAY-12345',
            'error.message': 'Error de ejemplo',
            'data.field1': 'Valor 1',
            'data.field2': 'Valor 2',
        }
        return exampleValues[variable.trim()] || `[${variable.trim()}]`
    })

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? t('common.edit') : t('common.preview')}
                        </Button>
                        <TemplateSelector onSelect={handleTemplateSelect} />
                    </div>
                </div>
            )}

            {showPreview ? (
                <div className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{previewText}</p>
                </div>
            ) : (
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={t('common.write_message')}
                    rows={6}
                    className="font-mono text-sm"
                />
            )}

            {/* Variable hints */}
            <div className="text-xs text-muted-foreground">
                <p>
                    💡 {t('common.variable_hint')} <code className="bg-muted px-1 rounded">{`{{variable}}`}</code>
                </p>
            </div>
        </div>
    )
}
