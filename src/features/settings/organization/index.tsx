import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Building, Globe, Clock, Check, CreditCard, Search, ChevronRight, ShoppingCart, Warehouse, Percent } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ContentSection } from '../components/content-section'
import { useAuthStore } from '@/stores/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllTimezones } from '@/lib/date-utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const orgFormSchema = z.object({
    name: z.string().min(2, {
        message: 'El nombre debe tener al menos 2 caracteres.',
    }),
    currency_code: z.string().length(3),
    timezone: z.string().min(1),
    checkout_mode: z.enum(['integrated', 'cashier']),
    fulfillment_mode: z.enum(['auto', 'warehouse']),
    tax_rate: z.coerce.number().min(0).max(100),
    tax_included: z.boolean(),
})

type OrgFormValues = z.infer<typeof orgFormSchema>
type OrgFormInput = z.input<typeof orgFormSchema>

export function SettingsOrganization() {
    const { t } = useTranslation()
    const { auth } = useAuthStore()
    const user = auth.user
    const setUser = auth.setUser
    const queryClient = useQueryClient()
    const [openCurrency, setOpenCurrency] = useState(false)
    const [openTimezone, setOpenTimezone] = useState(false)

    const timezones = useMemo(() => getAllTimezones(), [])

    // Fetch currencies from API
    const { data: currenciesData } = useQuery({
        queryKey: ['currencies-options'],
        queryFn: async () => {
            const res = await api.get('/options/organizations?field=currency_code')
            return res.data.success ? res.data.data : []
        },
        staleTime: 24 * 60 * 60 * 1000, // Currencies don't change often
    })

    const currencies = useMemo(() => {
        if (!currenciesData) return []
        return (currenciesData as any[]).map((c: any) => ({
            code: c.value,
            name: c.label,
            symbol: c.description,
            label: `${c.value} (${c.description}) - ${c.label}`
        }))
    }, [currenciesData])

    const form = useForm<OrgFormInput, any, OrgFormValues>({
        resolver: zodResolver(orgFormSchema),
        defaultValues: {
            name: user?.organization_name || '',
            currency_code: user?.currency_code || 'MXN',
            timezone: user?.timezone || 'America/Mexico_City',
            checkout_mode: user?.checkout_mode || 'integrated',
            fulfillment_mode: user?.fulfillment_mode || 'auto',
            tax_rate: user?.tax_rate ?? 16,
            tax_included: user?.tax_included ?? true,
        },
    })

    const currentCurrency = useMemo(() =>
        currencies.find(c => c.code === form.watch('currency_code')) || { symbol: '$', code: 'USD' },
        [currencies, form.watch('currency_code')])

    async function onSubmit(data: OrgFormValues) {
        try {
            const response = await api.put('/organizations/me', data)
            if (response.data.success) {
                setUser(response.data.data)
                queryClient.invalidateQueries({ queryKey: ['navigation'] })
                toast.success(t('settings.organization.success_update'))
            }
        } catch (error: unknown) {
            const axiosErr = error as { response?: { data?: { error?: string; message?: string } } }
            const msg = axiosErr?.response?.data?.message || axiosErr?.response?.data?.error || t('settings.organization.error_update')
            toast.error(msg)
        }
    }

    return (
        <div className='space-y-8 text-foreground'>
            <ContentSection
                title={t('settings.organization.title')}
                desc={t('settings.organization.description')}
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        <div className='grid gap-6 md:grid-cols-2'>
                            <FormField
                                control={form.control}
                                name='name'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('settings.organization.name')}</FormLabel>
                                        <FormControl>
                                            <div className='relative'>
                                                <Building className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                                                <Input className='pl-9' placeholder='Textile Corp' {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='currency_code'
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="mb-1">{t('settings.organization.currency')}</FormLabel>
                                        <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCurrency}
                                                        className={cn(
                                                            "w-full flex items-center justify-start px-3 h-9 font-normal overflow-hidden",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <Globe className='mr-3 h-4 w-4 text-muted-foreground shrink-0' />
                                                        <span className='truncate flex-1 text-left'>
                                                            {field.value
                                                                ? currencies.find((c) => c.code === field.value)?.label
                                                                : t('common.select_placeholder')}
                                                        </span>
                                                        <Search className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl overflow-hidden"
                                                align="start"
                                                side="bottom"
                                                sideOffset={8}
                                                collisionPadding={20}
                                            >
                                                <Command className='rounded-none p-0'>
                                                    <CommandInput
                                                        placeholder={t('common.search')}
                                                        className="h-11 text-base border-none"
                                                    />
                                                    <Separator className='h-px bg-border' />
                                                    <CommandList className='max-h-[250px] overflow-y-auto p-1'>
                                                        <CommandEmpty>{t('common.no_results')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {currencies.map((c: any) => (
                                                                <CommandItem
                                                                    key={c.code}
                                                                    value={c.label}
                                                                    onSelect={() => {
                                                                        form.setValue("currency_code", c.code)
                                                                        setOpenCurrency(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            c.code === field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {c.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            {t('settings.organization.currency_description')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='timezone'
                                render={({ field }) => (
                                    <FormItem className='flex flex-col'>
                                        <FormLabel className='mb-1.5'>{t('settings.organization.timezone')}</FormLabel>
                                        <Popover open={openTimezone} onOpenChange={setOpenTimezone}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between h-10 border pl-3 text-left font-normal bg-background",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <div className='flex items-center gap-2'>
                                                            <Clock className='h-4 w-4 text-muted-foreground' />
                                                            {field.value
                                                                ? timezones.find(tz => tz.value === field.value)?.label
                                                                : t('common.select_placeholder')}
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
                                                <Command className='rounded-none p-0'>
                                                    <CommandInput
                                                        placeholder={t('common.search')}
                                                        className="h-11 text-base border-none"
                                                    />
                                                    <Separator className='h-px bg-border' />
                                                    <CommandList className='max-h-[300px] overflow-y-auto p-1'>
                                                        <CommandEmpty>{t('common.no_results')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {timezones.map((tz) => (
                                                                <CommandItem
                                                                    key={tz.value}
                                                                    value={tz.label} // Search by both offset and value
                                                                    onSelect={() => {
                                                                        form.setValue("timezone", tz.value)
                                                                        setOpenTimezone(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            tz.value === field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {tz.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            {t('settings.organization.timezone_description')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator className='my-2' />

                        <h3 className='text-sm font-semibold'>Modo de Operación</h3>
                        <p className='text-xs text-muted-foreground mb-3'>
                            Configura cómo funciona el flujo de ventas y despacho en tu negocio.
                        </p>

                        <div className='grid gap-6 md:grid-cols-2'>
                            <FormField
                                control={form.control}
                                name='checkout_mode'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className='flex items-center gap-2'>
                                            <ShoppingCart className='h-4 w-4 text-muted-foreground' />
                                            Modo de Cobro
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value='integrated'>Integrado — El vendedor cobra directamente</SelectItem>
                                                <SelectItem value='cashier'>Caja separada — El vendedor crea la orden, el cajero cobra</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {field.value === 'integrated'
                                                ? 'El vendedor selecciona productos y cobra en un solo paso.'
                                                : 'El vendedor crea la orden y el cajero la cobra desde su caja.'}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='fulfillment_mode'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className='flex items-center gap-2'>
                                            <Warehouse className='h-4 w-4 text-muted-foreground' />
                                            Modo de Despacho
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value='auto'>Auto-despacho — Stock baja al cobrar</SelectItem>
                                                <SelectItem value='warehouse'>Almacén — Genera orden de picking</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {field.value === 'auto'
                                                ? 'El inventario se descuenta automáticamente al completar la venta.'
                                                : 'Se crea una orden de picking en almacén para preparar y despachar.'}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator className='my-2' />

                        <h3 className='text-sm font-semibold'>Impuestos</h3>
                        <p className='text-xs text-muted-foreground mb-3'>
                            Configura el porcentaje de impuesto y si los precios de tus productos ya lo incluyen.
                        </p>

                        <div className='grid gap-6 md:grid-cols-2'>
                            <FormField
                                control={form.control}
                                name='tax_rate'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className='flex items-center gap-2'>
                                            <Percent className='h-4 w-4 text-muted-foreground' />
                                            Tasa de Impuesto (%)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                {...field}
                                                value={Number(field.value) || 0}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Porcentaje de IVA o impuesto aplicado a las ventas.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='tax_included'
                                render={({ field }) => (
                                    <FormItem className='flex flex-col gap-3'>
                                        <FormLabel>Impuesto incluido en precio</FormLabel>
                                        <div className='flex items-center gap-3'>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <span className='text-sm text-muted-foreground'>
                                                {field.value ? 'Sí — los precios ya incluyen impuesto' : 'No — el impuesto se agrega al precio'}
                                            </span>
                                        </div>
                                        <FormDescription>
                                            {field.value
                                                ? 'Un producto de $116 tiene $100 de base + $16 de IVA.'
                                                : 'Un producto de $100 se cobra $116 con IVA (16%).'}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type='submit' disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? t('common.saving') : t('common.save_changes')}
                        </Button>
                    </form>
                </Form>
            </ContentSection>

            <Separator />

            <div className='grid gap-6 md:grid-cols-2'>
                <Card className='overflow-hidden border-primary/20 bg-primary/5 shadow-none'>
                    <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='text-lg font-bold'>{t('settings.billing.current_plan')}</CardTitle>
                            <Badge variant={user?.is_subscription_active ? 'default' : 'destructive'} className='px-2'>
                                {user?.subscription_status === 'trialing' ? t('settings.billing.free_trial') : t('common.active')}
                            </Badge>
                        </div>
                        <CardDescription>
                            Tu organización está suscrita al plan <strong>{user?.plan_name || 'Básico'}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-baseline gap-1.5 mb-4'>
                            <span className='text-3xl font-bold'>
                                {currentCurrency?.symbol || '$'}
                            </span>
                            <span className='text-4xl font-black tracking-tight'>
                                {user?.plan_slug === 'basico' ? '19' : user?.plan_slug === 'pro' ? '49' : user?.plan_slug === 'negocio' ? '99' : '0'}
                            </span>
                            <span className='text-muted-foreground font-medium'>
                                /{t('settings.billing.per_month')}
                            </span>
                        </div>

                        <ul className='space-y-2 text-sm text-muted-foreground mb-6'>
                            <li className='flex items-center gap-2'>
                                <Check className='h-4 w-4 text-primary' />
                                Acceso a todos los agentes de IA
                            </li>
                            <li className='flex items-center gap-2'>
                                <Check className='h-4 w-4 text-primary' />
                                Soporte prioritario
                            </li>
                            <li className='flex items-center gap-2'>
                                <Check className='h-4 w-4 text-primary' />
                                Hasta 5,000 mensajes mensuales
                            </li>
                        </ul>

                        <Button variant='outline' className='w-full'>
                            {t('common.change')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className='shadow-none'>
                    <CardHeader>
                        <CardTitle className='text-lg font-bold'>{t('settings.organization.next_payment')}</CardTitle>
                        <CardDescription>
                            Detalles sobre tu siguiente ciclo de pago.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='flex items-center justify-between py-2 border-b border-dashed'>
                            <span className='text-muted-foreground'>{t('common.back' as any)}</span>
                            <span className='font-medium'>
                                {user?.current_period_end ? new Date(user.current_period_end).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className='flex items-center justify-between py-2 border-b border-dashed'>
                            <span className='text-muted-foreground'>{t('settings.organization.payment_method')}</span>
                            <div className='flex items-center gap-2'>
                                <CreditCard className='h-4 w-4' />
                                <span className='font-medium'>•••• 4242</span>
                            </div>
                        </div>
                        <Button variant='link' className='px-0 text-primary'>
                            Ver historial de facturas
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
