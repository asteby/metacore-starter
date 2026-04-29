import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    phone: z.string().optional(),
})

interface CreateContactDialogProps {
    onSuccess?: () => void
}

export function CreateContactDialog({ onSuccess }: CreateContactDialogProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
        },
    })

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset()
        }
        setOpen(newOpen)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            // Remove + prefix for Baileys/WhatsApp compatibility
            const payload = {
                ...values,
                phone: values.phone?.replace(/^\+/, '') || ''
            }
            const response = await api.post('/data/contacts/me', payload)
            if (response.data.success) {
                toast.success(t('contacts.success'))
                setOpen(false)
                form.reset()
                onSuccess?.()
            } else {
                toast.error(response.data.message || t('contacts.error'))
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('contacts.error')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('contacts.new_contact')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{t('contacts.create_title')}</DialogTitle>
                    <DialogDescription>
                        {t('contacts.create_description')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">{t('contacts.name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('contacts.name_placeholder')} {...field} className="bg-muted/20" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">{t('contacts.phone')}</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            defaultCountry="VE"
                                            placeholder={t('contacts.phone_placeholder')}
                                            {...field}
                                            className="bg-muted/20"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />



                        <DialogFooter className="mt-8 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="w-full sm:w-auto px-8"
                            >
                                {t('contacts.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-8"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('contacts.saving')}
                                    </>
                                ) : t('contacts.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
