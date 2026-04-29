import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Network, Bot } from 'lucide-react'
import { useState } from 'react'
import { MultiSelect } from '@/components/ui/multi-select'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = (t: any) => z.object({
    name: z.string().min(2, {
        message: t('orchestrators.name_min_length'),
    }),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive']),
    agents: z.array(z.string()).min(1, t('orchestrators.select_at_least_one')),
})

type OrchestratorFormValues = z.infer<ReturnType<typeof formSchema>>

interface CreateOrchestratorDialogProps {
    onSuccess?: () => void
}

export function CreateOrchestratorDialog({ onSuccess }: CreateOrchestratorDialogProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<OrchestratorFormValues, any, OrchestratorFormValues>({
        resolver: zodResolver(formSchema(t)),
        defaultValues: {
            name: "",
            description: "",
            status: "active",
            agents: [],
        },
    })

    // Fetch agents for selection
    const [agents, setAgents] = useState<{ label: string, value: string, icon: any }[]>([])

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await api.get('/data/agents/me')
                if (res.data.success && res.data.data) {
                    setAgents(res.data.data.map((a: any) => ({
                        label: a.name,
                        value: a.id,
                        icon: Bot
                    })))
                }
            } catch (error) {
                console.error("Failed to load agents", error)
            }
        }
        if (open) fetchAgents()
    }, [open])

    async function onSubmit(values: OrchestratorFormValues) {
        setIsSubmitting(true)
        try {
            // Transform selected agent IDs into object array for backend association
            const payload = {
                ...values,
                agents: values.agents.map((id: string) => ({ id }))
            }

            const response = await api.post('/data/orchestrators/me', payload)

            if (response.data.success) {
                toast.success(t('orchestrators.create_orchestrator') + " exitosamente")
                setOpen(false)
                form.reset()
                onSuccess?.()
            } else {
                toast.error(response.data.message || t('orchestrators.error_creating'))
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('orchestrators.error_creating')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                    <Plus className="h-4 w-4" />
                    {t('orchestrators.new_orchestrator')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        {t('orchestrators.create_orchestrator')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('orchestrators.create_description')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('orchestrators.name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('orchestrators.name_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('orchestrators.description_label')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('orchestrators.description_placeholder')}
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('orchestrators.status')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('common.select_placeholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">{t('orchestrators.active')}</SelectItem>
                                            <SelectItem value="inactive">{t('orchestrators.inactive')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="agents"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('orchestrators.connected_agents')}</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={agents}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder={t('orchestrators.select_agents')}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('orchestrators.select_agents_description')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('orchestrators.creating') : t('orchestrators.create_orchestrator')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
