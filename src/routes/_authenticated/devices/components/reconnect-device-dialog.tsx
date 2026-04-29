import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckCircle2, XCircle, MoreVertical, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ReconnectDeviceDialogProps {
    device: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

type DialogStep = 'info' | 'qr' | 'success' | 'error'

export function ReconnectDeviceDialog({ device, open, onOpenChange, onSuccess }: ReconnectDeviceDialogProps) {
    const { t } = useTranslation()
    const [step, setStep] = useState<DialogStep>('info')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [_connectionStatus, setConnectionStatus] = useState<'pending' | 'connected' | 'error'>('pending')
    const pollingInterval = useRef<ReturnType<typeof setTimeout> | null>(null)

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
                setConnectionStatus('connected')
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

    const hasCheckedInitialStatus = useRef(false)

    // Reset when dialog opens/closes
    useEffect(() => {
        if (open) {
            setStep('info')
            setQrCode(null)
            setConnectionStatus('pending')

            // Check if already connected immediately
            if (device?.id && !hasCheckedInitialStatus.current) {
                hasCheckedInitialStatus.current = true
                const checkInitialStatus = async () => {
                    try {
                        const response = await api.get(`/whatsapp/sessions/${device.id}`)
                        if (response.data.success && response.data.data?.connected) {
                            setConnectionStatus('connected')
                            setStep('success')
                            toast.success('¡WhatsApp ya está conectado!')
                            onSuccess?.()
                        }
                    } catch {
                        // Ignore error, proceed with normal flow
                    }
                }
                checkInitialStatus()
            }
        } else {
            stopPolling()
            hasCheckedInitialStatus.current = false
        }
    }, [open, stopPolling, device?.id, onSuccess])

    const requestQRCode = async () => {
        if (!device) return

        setIsLoading(true)
        try {
            const response = await api.post('/whatsapp/sessions', {
                sessionId: device.id,
            })

            if (response.data.success) {
                if (response.data.data?.qr) {
                    setQrCode(response.data.data.qr)
                    setStep('qr')
                    startPolling(device.id)
                } else if (response.data.data?.connected) {
                    // Already connected
                    setConnectionStatus('connected')
                    setStep('success')
                    toast.success('¡WhatsApp ya estaba conectado!')
                    onSuccess?.()
                }
            } else {
                throw new Error(response.data.message || 'Error al obtener QR')
            }
        } catch (error: any) {
            console.error('Error requesting QR:', error)
            const message = error.response?.data?.message || error.message || 'Error al conectar con WhatsApp'
            toast.error(message)
            setConnectionStatus('error')
            setStep('error')
        } finally {
            setIsLoading(false)
        }
    }

    const refreshQRCode = async () => {
        if (!device) return
        stopPolling()
        setQrCode(null)
        await requestQRCode()
    }

    const handleClose = () => {
        stopPolling()
        onOpenChange(false)
    }

    const getDisconnectReasonText = (reason: string) => {
        switch (reason) {
            case 'logged_out':
                return t('devices.disconnect_reason_logged_out')
            case 'bad_session':
                return t('devices.disconnect_reason_invalid')
            case 'connection_replaced':
                return t('devices.disconnect_reason_replaced')
            case 'connection_lost':
                return t('devices.disconnect_reason_lost')
            case 'timed_out':
                return t('devices.disconnect_reason_timeout')
            default:
                return t('devices.disconnect_reason_default')
        }
    }

    const renderInfoStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.reconnect_device')}</DialogTitle>
                <DialogDescription>
                    {t('devices.device_disconnected', { name: device?.name })}
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">{t('devices.device_disconnected_title')}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {device?.disconnect_reason
                            ? getDisconnectReasonText(device.disconnect_reason)
                            : t('devices.needs_reconnection')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {t('devices.scan_qr_description')}
                    </p>
                </div>
            </div>
            <DialogFooter className="gap-3">
                <Button variant="outline" onClick={handleClose}>
                    {t('common.cancel')}
                </Button>
                <Button onClick={requestQRCode} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('devices.complete_info')}
                        </>
                    ) : (
                        t('devices.reconnect_device')
                    )}
                </Button>
            </DialogFooter>
        </>
    )

    const renderQRStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">Escanea el Código QR</DialogTitle>
                <DialogDescription>
                    Abre WhatsApp en tu teléfono y escanea este código para reconectar "{device?.name}".
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
                            Abre <span className="font-medium text-foreground">WhatsApp</span> en tu teléfono
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
                            Escanea este <span className="font-medium text-foreground">código QR</span>
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
                    Regenerar QR
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                >
                    Cancelar
                </Button>
            </DialogFooter>
        </>
    )

    const renderSuccessStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">{t('devices.reconnection_success')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">{t('devices.whatsapp_reconnected')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('devices.device_reconnected', { name: device?.name })}
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleClose} className="w-full">
                    Listo
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
                    <h3 className="text-lg font-semibold">No se pudo reconectar</h3>
                    <p className="text-sm text-muted-foreground">
                        Hubo un problema al reconectar con WhatsApp.
                        Por favor, inténtalo de nuevo.
                    </p>
                </div>
            </div>
            <DialogFooter className="gap-3">
                <Button variant="outline" onClick={handleClose}>
                    Cerrar
                </Button>
                <Button onClick={() => {
                    setConnectionStatus('pending')
                    requestQRCode()
                }}>
                    Reintentar
                </Button>
            </DialogFooter>
        </>
    )

    if (!device) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "sm:max-w-[480px]",
                step === 'qr' && "sm:max-w-[680px]"
            )}>
                {step === 'info' && renderInfoStep()}
                {step === 'qr' && renderQRStep()}
                {step === 'success' && renderSuccessStep()}
                {step === 'error' && renderErrorStep()}
            </DialogContent>
        </Dialog>
    )
}
