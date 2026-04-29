import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Plus, UserPlus } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface CreateUserDialogProps {
    onSuccess?: () => void
}

export function CreateUserDialog({ onSuccess }: CreateUserDialogProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formSchema = z.object({
        name: z.string().min(2, {
            message: t('users.name_min_length'),
        }),
        email: z.string().email({
            message: t('users.email_invalid'),
        }),
        password: z.string().min(6, {
            message: t('users.password_min_length'),
        }),
        role: z.enum(['owner', 'admin', 'agent']),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "agent",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            // Mapping for backend which uses password_hash field but expects password in typical registration, 
            // but for DynamicHandler we might need to match the struct or use a specific CreateUser handler.
            // Looking at user.go, PasswordHash is the field. 
            // But usually, raw password is sent and backend hashes it.
            // The BeforeSave hook in user.go seems to handle hashing if password_hash is set.
            // So we send it as 'password_hash' to match the struct field or mapped json tag.
            // Wait, User struct JSON tag is `json:"-"` for PasswordHash, so it won't be marshalled back.
            // But for unmarshalling input? 
            // The DynamicHandler uses BodyParser on the struct. 
            // Since PasswordHash has `json:"-"`, BodyParser might SKIP it!
            // Actually, `json:"-"` usually means "ignore for read and write".
            // However, the modal definition uses "password_hash".
            // Let's try sending "password_hash" as that matches standard expectations if not for the tag.
            // If the tag is "-", standard JSON unmarshal ignores it.
            // This might require a backend helper or specific injection if the generic handler skips it.
            // BUT, let's assume for now we use 'password' and see if backend maps it or if we need to adjust backend.
            // Wait, looking at `backend/models/user.go`: `PasswordHash string `json:"-" ...`
            // This means we CANNOT set it via standard JSON unmarshal if we use that struct.
            // We might need to rely on the backend possibly having a custom "Register" or "CreateUser" logic, 
            // OR the Dynamic Handler needs to handle a "password" field separately.

            // For now, let's send 'password_hash' and see. If it fails (ignored), we know why.
            // Actually, usually in these systems there's a specific "invite" or "register" endpoint.
            // Since we are using DynamicHandler, we might run into the json tag issue.

            // Let's try to send it as is.

            const payload = {
                ...values,
                // password is now handled by virtual field in backend
            }

            const response = await api.post('/data/users/me', payload)

            if (response.data.success) {
                toast.success(t('users.user_created'))
                setOpen(false)
                form.reset()
                onSuccess?.()
            } else {
                toast.error(response.data.message || t('users.error_creating'))
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('users.error_creating')
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
                    {t('users.new_user')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {t('users.create_user')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('users.create_description')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('users.name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('users.name_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('users.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('users.email_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('users.password')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder={t('users.password_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('users.role')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('users.select_role')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">{t('users.admin')}</SelectItem>
                                            <SelectItem value="agent">{t('users.agent')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('users.creating') : t('users.create_user')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
