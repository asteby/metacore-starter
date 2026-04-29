import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Upload, X, ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountries } from '@/lib/countries'
import { api } from '@/lib/api'
import type { SignUpFormData } from '../index'

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function detectFromLocale(): string {
  // "es-MX" → "MX", "en-US" → "US", "pt-BR" → "BR"
  const parts = (navigator.language || '').split('-')
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase()
    if (region.length === 2) return region
  }
  return ''
}

const formSchema = z.object({
  organizationName: z.string().min(1, 'Ingresa el nombre de tu negocio'),
  organizationLogo: z.string().optional(),
  country: z.string().min(1, 'Selecciona tu país'),
})

type Props = {
  formData: SignUpFormData
  updateFormData: (data: Partial<SignUpFormData>) => void
  onNext: () => void
}

export const SignUpStepOrganization = forwardRef<{ submit: () => void }, Props>(
  ({ formData, updateFormData, onNext }, ref) => {
    const [logoPreview, setLogoPreview] = useState<string>(formData.organizationLogo || '')
    const [countryOpen, setCountryOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const countries = useMemo(() => getCountries(), [])

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        organizationName: formData.organizationName,
        organizationLogo: formData.organizationLogo,
        country: formData.country,
      },
    })

    // Auto-detect country: API (IP-based) → locale fallback
    useEffect(() => {
      if (formData.country) return
      api.get('/geo').then(res => {
        const country = res.data?.data?.country
        if (country) form.setValue('country', country)
        else form.setValue('country', detectFromLocale())
      }).catch(() => {
        form.setValue('country', detectFromLocale())
      })
    }, [])

    const selectedCountry = countries.find(c => c.code === form.watch('country'))

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          setLogoPreview(base64)
          form.setValue('organizationLogo', base64)
        }
        reader.readAsDataURL(file)
      }
    }

    function removeLogo() {
      setLogoPreview('')
      form.setValue('organizationLogo', '')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    function onSubmit(data: z.infer<typeof formSchema>) {
      updateFormData(data)
      onNext()
    }

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
    }))

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nombre de tu negocio</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Empresa" className="h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs">País</FormLabel>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-9 w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedCountry
                            ? `${selectedCountry.flag} ${selectedCountry.name}`
                            : "Selecciona tu país"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side="bottom" sideOffset={4}>
                      <Command filter={(value, search) => normalize(value).includes(normalize(search)) ? 1 : 0}>
                        <CommandInput placeholder="Buscar país..." />
                        <CommandList className="max-h-[200px]">
                          <CommandEmpty>No se encontró el país.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.name} ${country.code}`}
                                onSelect={() => {
                                  form.setValue('country', country.code)
                                  setCountryOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === country.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {country.flag} {country.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationLogo"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs">Logo (opcional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="size-14 rounded-lg object-cover border"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-1.5 -right-1.5 size-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="size-14 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="size-4 text-muted-foreground" />
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG hasta 2MB
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </motion.div>
    )
  }
)

SignUpStepOrganization.displayName = 'SignUpStepOrganization'
