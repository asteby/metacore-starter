import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { Network, Bot } from 'lucide-react'
import { MultiSelect } from '@/components/ui/multi-select'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive']),
    agents: z.array(z.string()).min(1, "Selecciona al menos un agente"),
})

interface EditOrchestratorDialogProps {
    orchestrator: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function EditOrchestratorDialog({ orchestrator, open, onOpenChange, onSuccess }: EditOrchestratorDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [agents, setAgents] = useState<{ label: string, value: string, icon: any }[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            status: "active",
            agents: [],
        },
    })

    // Reset form when orchestrator changes
    useEffect(() => {
        if (orchestrator) {
            form.reset({
                name: orchestrator.name || "",
                description: orchestrator.description || "",
                status: orchestrator.status || "active",
                // Map existing agents objects to their IDs
                agents: orchestrator.agents ? orchestrator.agents.map((a: any) => a.id) : [],
            })
        }
    }, [orchestrator, form])

    // Fetch available agents
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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!orchestrator) return

        setIsSubmitting(true)
        try {
            // Transform selected agent IDs into object array for backend association
            // Note: For updates with GORM many2many, replacing the association usually works 
            // if we send the list of IDs properly formatted or handle it in backend.
            // The DynamicHandler store/update logic uses reflection.
            // However, DynamicHandler implementation for Update might need specific handling for many2many replacement
            // OR we rely on the fact that we are sending the `agents` field which matches the struct.

            // Standardizing payload:
            const payload = {
                ...values,
                agents: values.agents.map(id => ({ id }))
            }

            const response = await api.put(`/data/orchestrators/me/${orchestrator.id}`, payload)

            if (response.data.success) {
                toast.success("Orquestador actualizado exitosamente")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(response.data.message || "Error al actualizar orquestador")
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Error al actualizar orquestador"
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        Editar Orquestador
                    </DialogTitle>
                    <DialogDescription>
                        Modifica la configuración de tu orquestador.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Orquestador Principal" {...field} />
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
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe el propósito de este orquestador..."
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
                                    <FormLabel>Estado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar estado" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">Activo</SelectItem>
                                            <SelectItem value="inactive">Inactivo</SelectItem>
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
                                    <FormLabel>Agentes Conectados</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={agents}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            placeholder="Seleccionar agentes..."
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Selecciona los agentes que este orquestador podrá gestionar.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
