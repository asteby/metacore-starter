import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { toast } from 'sonner'
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
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Trash2, Settings2, Pencil } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'

const detailTypeSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "El nombre del campo es requerido"),
    type: z.enum(["text", "number", "color", "select", "badge"]),
})

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    description: z.string().optional(),
    detail_types: z.array(detailTypeSchema),
})

type FormValues = z.infer<typeof formSchema>

interface CategoryDialogProps {
    category?: any // If provided, we are in edit mode
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
    showTrigger?: boolean
}

export function CategoryDialog({
    category,
    onSuccess,
    open: externalOpen,
    onOpenChange: setExternalOpen,
    showTrigger = true
}: CategoryDialogProps) {
    const { t } = useTranslation()
    const [internalOpen, setInternalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const queryClient = useQueryClient()

    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen

    const isEdit = !!category

    const form = useForm<FormValues>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            detail_types: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "detail_types",
    })

    // Update form when category changes
    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name || "",
                description: category.description || "",
                detail_types: category.detail_types || [],
            })
        } else {
            form.reset({
                name: "",
                description: "",
                detail_types: [],
            })
        }
    }, [category, form, open])

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset()
        }
        setOpen(newOpen)
    }

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true)
        try {
            const url = isEdit
                ? `/data/categories/me/${category.id}`
                : '/data/categories/me'

            const method = isEdit ? 'put' : 'post'

            const response = await api[method](url, values)

            if (response.data.success) {
                toast.success(isEdit ? t('categories.category_updated') : t('categories.category_created'))
                queryClient.invalidateQueries({ queryKey: ['categories-sidebar'] })
                queryClient.invalidateQueries({ queryKey: ['categories'] })
                queryClient.invalidateQueries({ queryKey: ['category-details'] })
                setOpen(false)
                form.reset()
                onSuccess?.()
            } else {
                toast.error(response.data.message || t('categories.error_processing'))
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('categories.error_processing')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "sm" : "default"}>
                        {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {!isEdit && t('categories.new_category')}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {isEdit ? t('categories.edit_category') : t('categories.new_category')}
                            </DialogTitle>
                            <DialogDescription>
                                {isEdit ? t('categories.edit_description') : t('categories.create_description')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold">{t('categories.category_name')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Llantas, Lubricantes..." {...field} className="bg-muted/20" />
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
                                            <FormLabel className="text-sm font-semibold">{t('categories.category_description')}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descripción breve..."
                                                    {...field}
                                                    className="bg-muted/20 resize-none"
                                                    rows={2}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        {t('categories.custom_fields')}
                                        <Badge variant="secondary" className="font-normal">{fields.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ name: "", type: "text" })}
                                        className="h-8 border-dashed hover:border-primary hover:text-primary transition-colors"
                                    >
                                        <Plus className="mr-2 h-3.5 w-3.5" />
                                        {t('categories.add_attribute')}
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {fields.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed rounded-xl bg-muted/5">
                                            <p className="text-xs text-muted-foreground italic">{t('categories.no_custom_fields')}</p>
                                        </div>
                                    ) : (
                                        fields.map((field, index) => (
                                            <div key={field.id} className="group relative flex items-start gap-3 p-4 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 hover:bg-muted/30 transition-all">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`detail_types.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={t('categories.attribute_name')}
                                                                        {...field}
                                                                        className="h-9 text-sm bg-background border-muted-foreground/20 focus-visible:ring-primary"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`detail_types.${index}.type`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-9 text-sm bg-background border-muted-foreground/20">
                                                                            <SelectValue placeholder={t('categories.type')} />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="text">{t('categories.text')}</SelectItem>
                                                                        <SelectItem value="number">{t('categories.number')}</SelectItem>
                                                                        <SelectItem value="color">{t('categories.color')}</SelectItem>
                                                                        <SelectItem value="select">{t('categories.select')}</SelectItem>
                                                                        <SelectItem value="badge">{t('categories.badge')}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-4 border-t bg-background shrink-0 sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="px-6 hover:bg-muted/50"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEdit ? t('categories.saving_changes') : t('categories.saving_category')}
                                    </>
                                ) : (isEdit ? t('common.save_changes') : t('categories.save_category'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
