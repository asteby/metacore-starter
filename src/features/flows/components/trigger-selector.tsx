import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Sparkles } from 'lucide-react'
import { TRIGGER_CONFIGS, TRIGGER_ICONS } from '../types/trigger-configs'
import { TriggerType, FlowVariable } from '../types/flow-types'
import { cn } from '@/lib/utils'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'

interface TriggerSelectorProps {
    selectedTriggerType?: TriggerType
    triggerConfig?: Record<string, any>
    onSelect: (triggerType: TriggerType, config: Record<string, any>) => void
}

export function TriggerSelector({
    selectedTriggerType,
    triggerConfig = {},
    onSelect,
}: TriggerSelectorProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    const selectedConfig = selectedTriggerType ? TRIGGER_CONFIGS[selectedTriggerType] : null

    const handleSelect = (triggerType: TriggerType) => {
        const config = TRIGGER_CONFIGS[triggerType]
        const defaultConfig: Record<string, any> = {}

        // Set default values
        config.configFields.forEach(field => {
            if (field.defaultValue !== undefined) {
                defaultConfig[field.name] = field.defaultValue
            }
        })

        onSelect(triggerType, defaultConfig)
        setOpen(false)
    }

    const updateConfig = (key: string, value: any) => {
        if (!selectedTriggerType) return
        const newConfig = { ...triggerConfig, [key]: value }
        onSelect(selectedTriggerType, newConfig)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>{t('flows.trigger_type')}</Label>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            {selectedTriggerType ? t('common.change') : t('common.select')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-6 overflow-hidden">
                        <DialogHeader className="shrink-0 pb-4">
                            <DialogTitle>{t('common.select_trigger')}</DialogTitle>
                            <DialogDescription>
                                {t('common.choose_event')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 min-h-0 relative">
                            <ScrollArea className="h-full pr-4">
                                <div className="grid grid-cols-2 gap-3 pb-2">
                                    {Object.entries(TRIGGER_CONFIGS).map(([type, config]) => {
                                        const IconComponent = TRIGGER_ICONS[config.icon as keyof typeof TRIGGER_ICONS]

                                        return (
                                            <button
                                                key={type}
                                                onClick={() => handleSelect(type as TriggerType)}
                                                className={cn(
                                                    'p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:shadow-md hover:bg-muted/10',
                                                    selectedTriggerType === type
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border'
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        'p-2 rounded-lg text-white shrink-0',
                                                        config.color
                                                    )}>
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm mb-1">
                                                            {config.label}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground leading-tight">
                                                            {config.description}
                                                        </p>
                                                        {config.defaultVariables.length > 0 && (
                                                            <div className="mt-2 flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {config.defaultVariables.length} variables
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {selectedConfig && (
                <div className="space-y-4 p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'p-2 rounded-lg text-white',
                            selectedConfig.color
                        )}>
                            {(() => {
                                const IconComponent = TRIGGER_ICONS[selectedConfig.icon as keyof typeof TRIGGER_ICONS]
                                return <IconComponent className="w-5 h-5" />
                            })()}
                        </div>
                        <div>
                            <h4 className="font-semibold">{selectedConfig.label}</h4>
                            <p className="text-sm text-muted-foreground">
                                {selectedConfig.description}
                            </p>
                        </div>
                    </div>

                    {/* Configuration fields */}
                    {selectedConfig.configFields.length > 0 && (
                        <div className="space-y-3 pt-3 border-t">
                            <h5 className="text-sm font-semibold">{t('agents.configuration')}</h5>
                            {selectedConfig.configFields.map((field) => (
                                <div key={field.name} className="space-y-2">
                                    <Label htmlFor={field.name}>
                                        {field.label}
                                        {field.required && (
                                            <span className="text-destructive ml-1">*</span>
                                        )}
                                    </Label>

                                    {field.type === 'select' ? (
                                        <Select
                                            value={triggerConfig[field.name] || field.defaultValue}
                                            onValueChange={(value) => updateConfig(field.name, value)}
                                        >
                                            <SelectTrigger id={field.name}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.type === 'number' ? (
                                        <Input
                                            id={field.name}
                                            type="number"
                                            value={triggerConfig[field.name] || field.defaultValue || ''}
                                            onChange={(e) => updateConfig(field.name, parseInt(e.target.value))}
                                            placeholder={field.placeholder}
                                        />
                                    ) : (
                                        <Input
                                            id={field.name}
                                            type={field.type}
                                            value={triggerConfig[field.name] || field.defaultValue || ''}
                                            onChange={(e) => updateConfig(field.name, e.target.value)}
                                            placeholder={field.placeholder}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Show default variables */}
                    {selectedConfig.defaultVariables.length > 0 && (
                        <div className="pt-3 border-t">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="variables" className="border-none">
                                    <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-muted-foreground" />
                                            {t('common.available_variables')} ({selectedConfig.defaultVariables.length})
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2 pt-2">
                                            {selectedConfig.defaultVariables.map((variable: FlowVariable) => (
                                                <div
                                                    key={variable.name}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded text-primary shrink-0">
                                                        {`{{${variable.name}}}`}
                                                    </code>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                                {variable.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-tight">
                                                            {variable.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
