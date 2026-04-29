import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { ArrowLeft, Save, GripVertical } from 'lucide-react'
import { TriggerSelector } from './trigger-selector'
import { nodePaletteItems, nodeCategories } from '../nodes/flow-nodes'
import { TriggerType } from '../types/flow-types'
import { cn } from '@/lib/utils'

interface FlowPaletteSidebarProps {
    name: string
    setName: (name: string) => void
    description: string
    setDescription: (desc: string) => void
    triggerType: TriggerType
    triggerConfig: Record<string, any>
    onTriggerChange: (type: TriggerType, config: Record<string, any>) => void
    onClose: () => void
    onSave: () => void
}

export const FlowPaletteSidebar = memo(function FlowPaletteSidebar({
    name,
    setName,
    description,
    setDescription,
    triggerType,
    triggerConfig,
    onTriggerChange,
    onClose,
    onSave
}: FlowPaletteSidebarProps) {
    const { t } = useTranslation()

    return (
        <div className="w-80 bg-card border-r border-border flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border shrink-0">
                <Button variant="ghost" size="sm" onClick={onClose} className="mb-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.back')}
                </Button>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('common.flow_name')}
                    className="font-semibold"
                />
            </div>

            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                        {/* Trigger Configuration */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t('agents.trigger_configuration')}
                            </h3>
                            <TriggerSelector
                                selectedTriggerType={triggerType}
                                triggerConfig={triggerConfig}
                                onSelect={onTriggerChange}
                            />
                        </div>

                        <Separator />

                        {/* Node Palette - Categorized */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                {t('common.node_library')}
                            </h3>

                            <Accordion type="single" collapsible defaultValue="actions" className="w-full">
                                {nodeCategories.map((category) => (
                                    <AccordionItem key={category.id} value={category.id}>
                                        <AccordionTrigger className="py-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <category.icon className="w-4 h-4" />
                                                {category.label}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-2 space-y-2">
                                                {nodePaletteItems
                                                    .filter(item => item.category === category.id)
                                                    .map((item) => (
                                                        <div
                                                            key={item.type}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('application/reactflow', item.type)
                                                                e.dataTransfer.effectAllowed = 'move'
                                                            }}
                                                            className={cn(
                                                                'flow-node-item',
                                                                item.color,
                                                                'text-white'
                                                            )}
                                                        >
                                                            <GripVertical className="w-4 h-4 opacity-50" />
                                                            <item.icon className="w-5 h-5" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm">{item.label}</p>
                                                                <p className="text-xs opacity-75">{item.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        <Separator />

                        {/* Flow Metadata */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t('common.flow_details')}
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('common.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('common.flow_purpose')}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            <div className="p-4 border-t border-border shrink-0">
                <Button onClick={onSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {t('agents.save_flow')}
                </Button>
            </div>
        </div>
    )
})
