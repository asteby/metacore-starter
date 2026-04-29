import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
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
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, Clock, DollarSign, Calendar, Hash } from 'lucide-react'

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
] as const

const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (UTC-6)' },
  { value: 'America/Cancun', label: 'Cancún (UTC-5)' },
  { value: 'America/Tijuana', label: 'Tijuana (UTC-8)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (UTC-7)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (UTC-7)' },
  { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
  { value: 'America/Lima', label: 'Lima (UTC-5)' },
  { value: 'America/Santiago', label: 'Santiago (UTC-4)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'UTC', label: 'UTC' },
] as const

const CURRENCIES = [
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
  { value: 'PEN', label: 'PEN - Sol Peruano' },
  { value: 'CLP', label: 'CLP - Peso Chileno' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'BRL', label: 'BRL - Real Brasileño' },
  { value: 'GBP', label: 'GBP - British Pound' },
] as const

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2026)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2026)' },
] as const

const NUMBER_FORMATS = [
  { value: 'es-MX', label: '1,234,567.89 (punto decimal)' },
  { value: 'de-DE', label: '1.234.567,89 (coma decimal)' },
  { value: 'en-US', label: '1,234,567.89 (US format)' },
  { value: 'fr-FR', label: '1 234 567,89 (espacio millar)' },
] as const

const localesFormSchema = z.object({
  language: z.string().min(1),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  date_format: z.string().min(1),
  number_format: z.string().min(1),
})

type LocalesFormValues = z.infer<typeof localesFormSchema>

const defaultLocaleValues: LocalesFormValues = {
  language: 'es',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  date_format: 'DD/MM/YYYY',
  number_format: 'es-MX',
}

export function LocalesForm() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: localeConfig, isLoading } = useQuery({
    queryKey: ['admin', 'locales'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/admin/locales')
        return data.success ? data.data : defaultLocaleValues
      } catch {
        return defaultLocaleValues
      }
    },
  })

  const form = useForm<LocalesFormValues>({
    resolver: zodResolver(localesFormSchema),
    values: localeConfig ?? defaultLocaleValues,
  })

  const saveMutation = useMutation({
    mutationFn: async (values: LocalesFormValues) => {
      const { data } = await api.put('/admin/locales', values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'locales'] })
      toast.success(t('admin.locales.saved'))
    },
    onError: () => {
      toast.error(t('admin.locales.save_error'))
    },
  })

  function onSubmit(values: LocalesFormValues) {
    saveMutation.mutate(values)
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='mt-2 h-4 w-96' />
        </div>
        <Separator />
        <div className='space-y-8'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-10 w-full max-w-md' />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>
          {t('admin.locales.title')}
        </h2>
        <p className='text-muted-foreground'>
          {t('admin.locales.description')}
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='language'
            render={({ field }) => (
              <FormItem className='max-w-md'>
                <FormLabel className='flex items-center gap-2'>
                  <Globe className='h-4 w-4' />
                  {t('admin.locales.language')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('admin.locales.language_description')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='timezone'
            render={({ field }) => (
              <FormItem className='max-w-md'>
                <FormLabel className='flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  {t('admin.locales.timezone')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('admin.locales.timezone_description')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='currency'
            render={({ field }) => (
              <FormItem className='max-w-md'>
                <FormLabel className='flex items-center gap-2'>
                  <DollarSign className='h-4 w-4' />
                  {t('admin.locales.currency')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('admin.locales.currency_description')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='date_format'
            render={({ field }) => (
              <FormItem className='max-w-md'>
                <FormLabel className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  {t('admin.locales.date_format')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATE_FORMATS.map((fmt) => (
                      <SelectItem key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('admin.locales.date_format_description')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='number_format'
            render={({ field }) => (
              <FormItem className='max-w-md'>
                <FormLabel className='flex items-center gap-2'>
                  <Hash className='h-4 w-4' />
                  {t('admin.locales.number_format')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NUMBER_FORMATS.map((fmt) => (
                      <SelectItem key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('admin.locales.number_format_description')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={saveMutation.isPending}>
            {saveMutation.isPending
              ? t('common.loading')
              : t('common.save')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
