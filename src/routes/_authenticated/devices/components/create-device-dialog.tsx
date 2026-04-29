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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Globe, Check, Loader2, RefreshCw, CheckCircle2, XCircle, Bot, Workflow, User, QrCode, X, Settings, Copy, Smartphone, HelpCircle, ExternalLink, Network, MoreVertical, Trash2 } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


const formSchema = (t: any) => z.object({
    name: z.string().min(2, {
        message: t('devices.name_min_length'),
    }),
    type: z.string().min(1, t('devices.select_connection_type')),
    provider: z.string().min(1, t('devices.select_connection_method')),
    process_type: z.enum(['agent', 'flow', 'user', 'orchestrator']),
    process_id: z.string().optional(),
    manual_identifier: z.string().optional(), // For manual entry of Phone ID (Meta)
    metadata: z.any().optional(),
})

type DeviceFormValues = z.infer<ReturnType<typeof formSchema>>

interface CreateDeviceDialogProps {
    onSuccess?: () => void
    // Make these optional if component handles its own state via Trigger
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

type DialogStep = 'select-type' | 'select-provider' | 'details' | 'qr' | 'success' | 'error'

interface DeviceData {
    id: string
    name: string
    type: string
    provider?: string
    identifier: string
    metadata?: any
}

export function CreateDeviceDialog({ onSuccess, open: constrainedOpen, onOpenChange }: CreateDeviceDialogProps) {
    const { t } = useTranslation()
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = typeof constrainedOpen !== 'undefined'
    const open = isControlled ? constrainedOpen : internalOpen

    // Wrapper for onOpenChange to handle both cases
    const setOpen = useCallback((newOpen: boolean) => {
        if (onOpenChange) {
            onOpenChange(newOpen)
        }
        if (!isControlled) {
            setInternalOpen(newOpen)
        }
    }, [isControlled, onOpenChange])

    const [_isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<DialogStep>('details')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [_connectionStatus, setConnectionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
    const [isPolling, setIsPolling] = useState(false)
    const [deviceData, setDeviceData] = useState<any>(null)
    const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<{ id: string; name: string; display_number: string }[]>([])
    const [showTutorial, setShowTutorial] = useState(false)
    const pollingInterval = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [agents, setAgents] = useState<any[]>([])
    const [flows, setFlows] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [orchestrators, setOrchestrators] = useState<any[]>([])

    const form = useForm<DeviceFormValues, any, DeviceFormValues>({
        resolver: zodResolver(formSchema(t)),
        defaultValues: {
            name: "",
            type: "",
            provider: "",
            process_type: "agent",
            process_id: "",
        },
    })

    // Fetch resources on mount
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const [agentsRes, flowsRes, usersRes, res4] = await Promise.all([
                    api.get('/data/agents/me'),
                    api.get('/data/flows/me'),
                    api.get('/data/users/me'),
                    api.get('/data/orchestrators/me')
                ])
                if (agentsRes.data.success) setAgents(agentsRes.data.data || [])
                if (flowsRes.data.success) setFlows(flowsRes.data.data || [])
                if (usersRes.data.success) setEmployees(usersRes.data.data || [])
                if (res4 && res4.data.success) setOrchestrators(res4.data.data || [])
            } catch (error) {
                console.error('Error fetching resources:', error)
            }
        }
        fetchResources()
    }, [])



    const stopPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current)
            pollingInterval.current = null
        }
        setIsPolling(false)
    }, [])

    const checkSessionStatus = useCallback(async (sessionId: string) => {
        try {
            const response = await api.get(`/whatsapp/sessions/${sessionId}`)
            if (response.data.success && response.data.data?.connected) {
                setConnectionStatus('success')
                setStep('success')
                stopPolling()
                toast.success(t('devices.whatsapp_connected'))
                onSuccess?.()
            }
        } catch {
            // Session not ready yet, continue polling
        }
    }, [stopPolling, onSuccess])

    const startPolling = useCallback((sessionId: string) => {
        setIsPolling(true)
        pollingInterval.current = setInterval(() => {
            checkSessionStatus(sessionId)
        }, 3000) // Check every 3 seconds
    }, [checkSessionStatus])

    // Cleanup polling on unmount or dialog close
    useEffect(() => {
        return () => stopPolling()
    }, [stopPolling])

    const resetDialog = useCallback(() => {
        stopPolling()
        setStep('details')
        setQrCode(null)
        setDeviceData(null)
        setConnectionStatus('idle')
        form.reset()
    }, [form, stopPolling])

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetDialog()
        }
        setOpen(newOpen)
    }

    const requestQRCode = async (sessionId: string) => {
        try {
            const response = await api.post('/whatsapp/sessions', {
                sessionId: sessionId,
            })

            if (response.data.success) {
                if (response.data.data?.qr) {
                    setQrCode(response.data.data.qr)
                    setStep('qr')
                    startPolling(sessionId)
                } else if (response.data.data?.connected) {
                    // Already connected
                    setConnectionStatus('success')
                    setStep('success')
                    toast.success(t('devices.whatsapp_already_connected'))
                    onSuccess?.()
                }
            } else {
                throw new Error(response.data.message || t('devices.qr_error'))
            }
        } catch (error: any) {
            console.error('Error requesting QR:', error)
            const message = error.response?.data?.message || error.message || t('devices.whatsapp_connection_error')
            toast.error(message)
            setConnectionStatus('error')
            setStep('error')
        }
    }

    const refreshQRCode = async () => {
        if (!deviceData) return
        stopPolling()
        setQrCode(null)
        await requestQRCode(deviceData.id)
    }

    async function onSubmit(values: DeviceFormValues, fbToken?: string) {
        setIsSubmitting(true)
        try {
            // Use manual identifier if provided (Meta), otherwise generate random
            const identifier = values.manual_identifier
                ? values.manual_identifier
                : `id_${Math.random().toString(36).substring(2, 10)}`

            // 1. Create device
            const devicePayload = {
                name: values.name,
                type: values.type,
                provider: values.provider,
                identifier: identifier,
                status: 'disconnected',
                process_type: values.process_type,
                process_id: (!values.process_id || values.process_id === 'none') ? null : values.process_id,
                metadata: values.provider === 'meta'
                    ? (fbToken ? { source: 'fb', token: fbToken } : { source: 'env' })
                    : {},
            }

            const response = await api.post('/data/devices/me', devicePayload)
            if (response.data.success) {
                const device = response.data.data as DeviceData
                setDeviceData(device)

                // If WhatsApp and QR provider, request QR code
                if (values.type === 'whatsapp' && values.provider === 'qr') {
                    toast.info(t('devices.complete_info'))
                    await requestQRCode(device.id)
                } else if (values.type === 'whatsapp' && values.provider === 'meta') {
                    // Trigger session creation for Meta to mark as connected
                    try {
                        await api.post('/whatsapp/sessions', { sessionId: device.id })
                        setConnectionStatus('success')
                        setStep('success')
                        toast.success(t('devices.meta_connection_established'))
                        onSuccess?.()
                    } catch (e) {
                        toast.error(t('devices.meta_connection_error'))
                    }
                } else {
                    // For other types, just show success
                    toast.success(t('devices.connection_established'))
                    setOpen(false)
                    form.reset()
                    onSuccess?.()
                }
            } else {
                toast.error(response.data.message || t('devices.connection_error_message'))
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('devices.connection_error_message')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const typeOptions = [
        {
            id: 'whatsapp',
            title: t('devices.whatsapp'),
            description: t('devices.whatsapp_description'),
            icon: QrCode,
            color: 'bg-green-500/10 text-green-600 border-green-200'
        },
        {
            id: 'web',
            title: t('devices.web_widget'),
            description: t('devices.web_widget_description'),
            icon: Globe,
            color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
        }
    ]

    const handleTypeSelect = (typeId: string) => {
        form.setValue('type', typeId)
        if (typeId === 'whatsapp') {
            setStep('select-provider')
        } else {
            // For Web or others, we might need a dummy provider or just submit
            form.setValue('provider', 'web')
            form.handleSubmit((data) => onSubmit(data))()
        }
    }

    const launchWhatsAppSignup = () => {
        // Facebook Login for Business (Embedded Signup)
        // https://developers.facebook.com/docs/whatsapp/embedded-signup/

        // Ensure FB is initialized
        if (!(window as any).FB) {
            toast.error(t('devices.fb_sdk_loading'));
            return;
        }

        // Initialize if not already done (though typically done in window.fbAsyncInit)
        // Since we didn't add the window.fbAsyncInit script in index.html, we do it here safely.
        // But FB.login typically requires init first.
        try {
            (window as any).FB.init({
                appId: import.meta.env.VITE_META_APP_ID,
                autoLogAppEvents: true,
                xfbml: true,
                version: import.meta.env.VITE_META_API_VERSION || 'v24.0'
            });
        } catch (e) {
            // Provide a graceful fallback if already initialized or error
            console.log("FB.init might have been called already", e);
        }

        (window as any).FB.login(function (response: any) {
            // Wrap async logic in an IIFE because FB.login might not support async callbacks directly
            // checks like (typeof cb !== 'function') work, but some specific checks for [object Function] vs [object AsyncFunction] might fail.
            (async () => {
                if (response.authResponse) {
                    const accessToken = response.authResponse.accessToken;

                    // Try to fetch numbers automatically
                    try {
                        // Request WABAs and Phone Numbers
                        const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=businesses{owned_whatsapp_business_accounts{phone_numbers{id,display_phone_number,name_status}}}&access_token=${accessToken}`)
                        const data = await res.json()

                        const numbers: any[] = []
                        if (data.businesses) {
                            data.businesses.data.forEach((biz: any) => {
                                if (biz.owned_whatsapp_business_accounts) {
                                    biz.owned_whatsapp_business_accounts.data.forEach((waba: any) => {
                                        if (waba.phone_numbers) {
                                            waba.phone_numbers.data.forEach((phone: any) => {
                                                numbers.push({
                                                    id: phone.id,
                                                    name: phone.display_phone_number,
                                                    display_number: phone.display_phone_number
                                                })
                                            })
                                        }
                                    })
                                }
                            })
                        }

                        if (numbers.length > 0) {
                            setAvailablePhoneNumbers(numbers)
                            if (numbers.length === 1) {
                                // Auto-select if only one
                                form.setValue('manual_identifier', numbers[0].id)
                            }
                            toast.success(t('devices.numbers_found', { count: numbers.length }))
                        } else {
                            toast.info(t('devices.no_auto_numbers'))
                        }
                    } catch (e) {
                        console.error("Error fetching numbers", e)
                    }

                    form.setValue('provider', 'meta');
                    // Store token tentatively, user still needs to click Connect/Save or we auto-submit if ID is resolved?
                    // Let's keep the manual flow but with the dropdown populated.
                    // We need to pass the token to onSubmit later.
                    // HACK: Store token in a hidden field or state to pass it later
                    form.setValue('metadata' as any, { token: accessToken, source: 'fb' })

                } else {
                    console.log('User cancelled login or did not fully authorize.');
                    toast.error(t('devices.auth_cancelled'));
                }
            })();
        }, {
            // Request ample permissions
            scope: 'whatsapp_business_management,whatsapp_business_messaging', // business_management is deprecated/invalid for this flow
        });
    }

    const handleProviderSelect = (providerId: string) => {
        form.setValue('provider', providerId)
        if (providerId === 'meta') {
            // Trigger Facebook Login
            launchWhatsAppSignup();
        } else {
            form.handleSubmit((data) => onSubmit(data))();
        }
    }

    const goBack = () => {
        if (step === 'select-type') {
            setStep('details')
        } else if (step === 'select-provider') {
            setStep('select-type')
        }
    }

    const renderDetailsStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.connection_details')}</DialogTitle>
                <DialogDescription>
                    {t('devices.configure_details')}
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <div className="pt-4">
                    <div className="space-y-6 mt-0 animate-in fade-in slide-in-from-left-2 duration-300">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">{t('devices.connection_name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('devices.connection_name_placeholder')} {...field} className="bg-muted/20" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="process_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold">{t('devices.process_type')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/20">
                                                    <SelectValue placeholder={t('devices.type')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="agent">
                                                    <div className="flex items-center gap-2">
                                                        <Bot className="h-4 w-4 text-purple-500" />
                                                        <span>{t('devices.agent_ai')}</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="flow">
                                                    <div className="flex items-center gap-2">
                                                        <Workflow className="h-4 w-4 text-blue-500" />
                                                        <span>{t('devices.flow')}</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="user">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-green-500" />
                                                        <span>{t('devices.employee')}</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="orchestrator">
                                                    <div className="flex items-center gap-2">
                                                        <Network className="h-4 w-4 text-orange-500" />
                                                        <span>{t('devices.orchestrator')}</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="process_id"
                                render={({ field }) => {
                                    const type = form.watch('process_type')
                                    const options = type === 'agent' ? agents : type === 'flow' ? flows : type === 'orchestrator' ? orchestrators : employees
                                    const label = type === 'agent' ? t('devices.agent') : type === 'flow' ? t('devices.flow') : type === 'orchestrator' ? t('devices.orchestrator') : t('devices.employee')

                                    return (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold">{label}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/20">
                                                        <SelectValue placeholder={t('common.search_placeholder')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">{t('devices.no_agent')}</SelectItem>
                                                    {options.map((opt: any) => (
                                                        <SelectItem key={opt.id} value={opt.id}>
                                                            {opt.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:justify-between pt-6 mt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                        <Button
                            type="button"
                            className="bg-primary px-8"
                            onClick={async () => {
                                const isValid = await form.trigger(['name', 'process_type', 'process_id'])
                                if (isValid) {
                                    setStep('select-type')
                                }
                            }}
                        >
                            {t('devices.continue')}
                        </Button>
                    </DialogFooter>
                </div >
            </Form >
        </>
    )

    const renderSelectTypeStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.new_connection')}</DialogTitle>
                <DialogDescription>
                    {t('devices.select_channel')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-6 grid grid-cols-2 gap-4">
                {typeOptions.map((option) => (
                    <div
                        key={option.id}
                        onClick={() => handleTypeSelect(option.id)}
                        className={cn(
                            "relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50",
                            form.watch('type') === option.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-muted bg-background"
                        )}
                    >
                        {form.watch('type') === option.id && (
                            <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                                <Check className="h-3 w-3" />
                            </div>
                        )}
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg border transition-colors",
                                form.watch('type') === option.id
                                    ? (option.id === 'whatsapp' ? "bg-green-500/10 border-green-200" : "bg-indigo-500/10 border-indigo-200")
                                    : "bg-muted/30")}>
                                <option.icon className={cn("h-6 w-6 transition-colors",
                                    form.watch('type') === option.id
                                        ? (option.id === 'whatsapp' ? "text-green-600" : "text-indigo-600")
                                        : "text-muted-foreground")} />
                            </div>
                            <div className="space-y-1">
                                <h4 className={cn("text-sm font-bold transition-colors",
                                    form.watch('type') === option.id
                                        ? (option.id === 'whatsapp' ? "text-green-700 dark:text-green-400" : "text-indigo-700 dark:text-indigo-400")
                                        : "text-foreground")}>
                                    {option.title}
                                </h4>
                                <p className="text-[10px] leading-tight text-muted-foreground">
                                    {option.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <DialogFooter className="gap-3 sm:justify-between">
                <Button variant="ghost" onClick={goBack}>{t('devices.back')}</Button>
            </DialogFooter>
        </>
    )

    const renderSelectProviderStep = () => (
        <div className="flex flex-col sm:flex-row h-full">
            {/* Left Column: Form */}
            <div className="flex-1 flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">{t('devices.connection_method')}</DialogTitle>
                    <DialogDescription>
                        {t('devices.choose_connection')}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => form.setValue('provider', 'qr')}
                            className={cn(
                                "relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50",
                                form.watch('provider') === 'qr'
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-muted bg-background"
                            )}
                        >
                            {form.watch('provider') === 'qr' && (
                                <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30 border">
                                    <QrCode className="h-5 w-5 text-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold">{t('devices.qr_code')}</h4>
                                    <p className="text-[10px] leading-tight text-muted-foreground">
                                        {t('devices.qr_code_description')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => form.setValue('provider', 'meta')}
                            className={cn(
                                "relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50",
                                form.watch('provider') === 'meta'
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-muted bg-background"
                            )}
                        >
                            {form.watch('provider') === 'meta' && (
                                <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-200">
                                    <div
                                        className="h-5 w-5 bg-blue-600"
                                        style={{
                                            maskImage: 'url(/images/icons/whatsapp.svg)',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                            maskSize: 'contain',
                                            WebkitMaskImage: 'url(/images/icons/whatsapp.svg)',
                                            WebkitMaskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',
                                            WebkitMaskSize: 'contain'
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold">{t('devices.meta_cloud')}</h4>
                                    <p className="text-[10px] leading-tight text-muted-foreground">
                                        {t('devices.meta_cloud_description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Selection UI - Only show after Login (Token acquired) */}
                    {form.watch('provider') === 'meta' && (form.watch('metadata') as any)?.token && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                            {availablePhoneNumbers.length > 0 ? (
                                <div className="space-y-2">
                                    <Label>{t('devices.select_whatsapp_number')}</Label>
                                    <Select
                                        onValueChange={(val) => form.setValue('manual_identifier', val)}
                                        defaultValue={form.watch('manual_identifier')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('devices.select_number')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePhoneNumbers.map((num) => (
                                                <SelectItem key={num.id} value={num.id}>
                                                    {num.display_number} (ID: {num.id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="manual_identifier">{t('devices.phone_id')}</Label>
                                    <Input
                                        id="manual_identifier"
                                        placeholder={t('devices.phone_id_placeholder')}
                                        value={form.watch('manual_identifier') || ''}
                                        onChange={(e) => form.setValue('manual_identifier', e.target.value)}
                                    />
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-muted-foreground">
                                            {t('devices.auto_detect_failed')} <br />
                                            {t('devices.find_id_in')} <a
                                                href="https://business.facebook.com/wa/manage/phone-numbers/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {t('devices.whatsapp_manager')} {'>'} {t('devices.phones')}
                                            </a>.
                                            <br />
                                            {t('devices.or_in')} <a
                                                href={import.meta.env.VITE_META_APP_ID
                                                    ? `https://developers.facebook.com/apps/${import.meta.env.VITE_META_APP_ID}/use_cases/customize/api-testing/?use_case_enum=WHATSAPP_BUSINESS_MESSAGING`
                                                    : "https://developers.facebook.com/apps/"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-primary hover:underline"
                                            >
                                                {t('devices.api_setup')}
                                            </a>.
                                        </p>

                                        {!showTutorial && (
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto text-primary text-xs flex items-center gap-1.5 animate-pulse hover:animate-none transition-all"
                                                type="button"
                                                onClick={() => setShowTutorial(!showTutorial)}
                                            >
                                                <HelpCircle className="h-3.5 w-3.5" />
                                                {showTutorial ? t('devices.hide_guide') : t('devices.where_find')}
                                            </Button>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter className="gap-3 sm:justify-between mt-auto pt-4 border-t">
                    <Button variant="ghost" onClick={goBack}>{t('devices.back')}</Button>
                    <Button
                        onClick={() => {
                            const metaData = form.watch('metadata') as any;
                            const token = metaData?.token;
                            const identifier = form.watch('manual_identifier');

                            if (form.watch('provider') === 'meta') {
                                if (token && identifier) {
                                    onSubmit({ ...form.getValues(), provider: 'meta' } as z.infer<ReturnType<typeof formSchema>>, token);
                                    return;
                                }
                                if (token && !identifier) {
                                    toast.error(t('devices.select_or_enter_id'));
                                    return;
                                }
                                handleProviderSelect('meta');
                            } else {
                                handleProviderSelect('qr');
                            }
                        }}
                        disabled={form.watch('provider') === 'meta' && availablePhoneNumbers.length > 0 && !form.watch('manual_identifier')}
                    >
                        {form.watch('provider') === 'meta'
                            ? (form.watch('metadata')?.token ? t('devices.save_connection') : t('devices.connect_facebook'))
                            : t('devices.continue')}
                    </Button>
                </DialogFooter>
            </div>

            {/* Right Column: Tutorial */}
            {showTutorial && (
                <div className="w-full sm:w-[400px] border-l pl-8 ml-2 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 bg-background/50 h-[500px]">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <h3 className="font-semibold text-sm">{t('devices.quick_guide')}</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                            onClick={() => setShowTutorial(false)}
                        >
                            {t('devices.hide')}
                        </Button>
                    </div>

                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                        {/* Step 1: Link to Manager */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
                                <h5 className="text-sm font-medium">{t('devices.step_1_title')}</h5>
                            </div>

                            <div className="pl-8 space-y-3">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t('devices.step_1_description')}
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full text-xs gap-2 h-9 border-primary/20 hover:bg-primary/5 text-primary"
                                    onClick={() => window.open('https://business.facebook.com/wa/manage/phone-numbers/', '_blank')}
                                >
                                    {t('devices.open_whatsapp_manager')}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Step 2: Mockup of the Row */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
                                <h5 className="text-sm font-medium">{t('devices.step_2_title')}</h5>
                            </div>

                            {/* Mockup Container */}
                            <div className="bg-card dark:bg-slate-950 rounded-lg border shadow-sm overflow-hidden select-none relative group/step1">
                                {/* Fake Header */}
                                <div className="bg-muted/30 border-b px-3 py-2 flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                                    <span className="flex-1">{t('devices.phone_number')}</span>
                                    <span>{t('devices.actions')}</span>
                                </div>
                                {/* Fake Row */}
                                <div className="p-3 flex items-center justify-between bg-card dark:bg-slate-950 relative">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                            <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-foreground">1 555 123 4567</span>
                                            <span className="text-[10px] text-muted-foreground">{t('devices.test_number')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 relative">
                                        <div className="h-7 w-7 flex items-center justify-center rounded border text-muted-foreground/40">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </div>
                                        {/* highlighted target */}
                                        <div className="h-7 w-7 flex items-center justify-center rounded border border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 ring-2 ring-green-500/30 ring-offset-1 shadow-[0_0_8px_rgba(34,197,94,0.2)]">
                                            <Settings className="h-3.5 w-3.5 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                                {t('devices.step_2_description')}
                            </p>
                        </div>

                        {/* Step 3: Mockup of the ID Drawer */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</div>
                                <h5 className="text-sm font-medium">{t('devices.step_3_title')}</h5>
                            </div>

                            {/* Mockup Container - Replicating the Drawer/Panel View */}
                            <div className="bg-card dark:bg-slate-950 rounded-lg border shadow-sm select-none overflow-hidden font-sans relative group/step2">
                                {/* Header Section */}
                                <div className="p-4 pb-2 relative">
                                    <div className="absolute top-2 right-2 text-muted-foreground/50">
                                        <X className="h-4 w-4" />
                                    </div>
                                    <div className="flex items-start gap-3">
                                        {/* Big Icon */}
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        {/* Text Content */}
                                        <div className="flex flex-col gap-0.5 relative">
                                            <span className="text-sm font-bold text-foreground">1 555 123 4567</span>
                                            <span className="text-[10px] text-muted-foreground">{t('devices.test_number')}</span>

                                            {/* The Target ID - Highlighted with Green Border */}
                                            <div className="flex items-center gap-1.5 mt-0.5 bg-green-50 dark:bg-green-500/10 -ml-1 pl-1 pr-2 py-0.5 rounded w-fit border border-green-500 dark:border-green-400 ring-2 ring-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.1)] relative">
                                                <span className="text-[10px] text-muted-foreground">{t('devices.identifier')}:</span>
                                                <span className="text-[10px] font-medium text-green-700 dark:text-green-400">109238475610...</span>
                                                <Copy className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs Strip */}
                                <div className="flex items-center gap-4 px-4 border-b text-[10px] font-medium text-muted-foreground overflow-hidden text-nowrap">
                                    <div className="py-2 border-b-2 border-primary text-primary">{t('devices.statistics')}</div>
                                    <div className="py-2 border-b-2 border-transparent opacity-60">{t('devices.profile')}</div>
                                    <div className="py-2 border-b-2 border-transparent opacity-60">{t('devices.automations')}</div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                                {t('devices.step_3_description')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )



    const renderQRStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.scan_qr')}</DialogTitle>
                <DialogDescription>
                    {t('devices.scan_qr_description')}
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-4">
                    {qrCode ? (
                        <div className="p-4 bg-white rounded-2xl shadow-lg border">
                            <img
                                src={qrCode}
                                alt="WhatsApp QR Code"
                                className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 bg-muted/20 rounded-2xl border">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {isPolling && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('devices.waiting_connection')}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="flex flex-col justify-center space-y-5 text-left">
                    {/* Connection Animation */}
                    <div className="flex items-center justify-center gap-4 pb-3">
                        {/* Ops Logo */}
                        <div className="relative">
                            <img
                                src="/images/favicon.svg"
                                alt="Ops"
                                className="h-12 w-12 drop-shadow-md"
                            />
                            <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                        </div>

                        {/* Connection Dots */}
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '600ms' }} />
                        </div>

                        {/* WhatsApp Logo */}
                        <div className="relative">
                            <div
                                className="h-14 w-14 bg-green-500 drop-shadow-md"
                                style={{
                                    maskImage: 'url(/images/icons/whatsapp.svg)',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    maskSize: 'contain',
                                    WebkitMaskImage: 'url(/images/icons/whatsapp.svg)',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                    WebkitMaskSize: 'contain'
                                }}
                            />
                            <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</div>
                        <p className="text-sm text-muted-foreground">
                            {t('devices.step_1_open')}
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {t('devices.step_2_tap')} <MoreVertical className="inline h-4 w-4 text-foreground" /> {t('devices.and')} <span className="font-medium text-foreground">{t('devices.linked_devices')}</span>
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</div>
                        <p className="text-sm text-muted-foreground">
                            {t('devices.step_3_tap')} <span className="font-medium text-foreground">{t('devices.link_device')}</span>
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">4</div>
                        <p className="text-sm text-muted-foreground">
                            {t('devices.step_4_scan')} <span className="font-medium text-foreground">{t('devices.qr_code_text')}</span>
                        </p>
                    </div>
                </div>
            </div>
            <DialogFooter className="gap-3 sm:justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={refreshQRCode}
                    disabled={!qrCode}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    {t('devices.regenerate_qr')}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        stopPolling()
                        handleOpenChange(false)
                    }}
                >
                    {t('common.cancel')}
                </Button>
            </DialogFooter>
        </>
    )

    const renderSuccessStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.connection_success')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">{t('devices.whatsapp_linked')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('devices.whatsapp_linked_description')}
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => handleOpenChange(false)} className="w-full">
                    {t('devices.done')}
                </Button>
            </DialogFooter>
        </>
    )

    const renderErrorStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.connection_error')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">{t('devices.connection_failed')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('devices.connection_failed_description')}
                    </p>
                </div>
            </div>
            <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    {t('devices.close')}
                </Button>
                <Button onClick={() => {
                    if (deviceData) {
                        setConnectionStatus('pending')
                        requestQRCode(deviceData.id)
                    }
                }}>
                    {t('devices.retry')}
                </Button>
            </DialogFooter>
        </>
    )

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('devices.connect')}
                </Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "sm:max-w-[480px] transition-all duration-300",
                step === 'details' && "sm:max-w-[680px]",
                step === 'qr' && "sm:max-w-[680px]",
                showTutorial && "sm:max-w-[900px]"
            )}>
                {step === 'select-type' && renderSelectTypeStep()}
                {step === 'select-provider' && renderSelectProviderStep()}

                {step === 'details' && renderDetailsStep()}
                {step === 'qr' && renderQRStep()}
                {step === 'success' && renderSuccessStep()}
                {step === 'error' && renderErrorStep()}
            </DialogContent>
        </Dialog>
    )
}
