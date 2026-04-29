import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, FileX, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { ActionModalProps } from '@/components/dynamic/action-registry'

const CANCEL_REASONS = [
    { value: '01', label: '01 - Comprobante emitido con errores con relación', requiresUUID: true },
    { value: '02', label: '02 - Comprobante emitido con errores sin relación', requiresUUID: false },
    { value: '03', label: '03 - No se llevó a cabo la operación', requiresUUID: false },
    { value: '04', label: '04 - Operación nominativa relacionada en factura global', requiresUUID: false },
]

type CancelStep = 'form' | 'confirm' | 'cancelling' | 'success' | 'error'

export function CancelFiscalModal({
    open,
    onOpenChange,
    action,
    model,
    record,
    endpoint,
    onSuccess,
}: ActionModalProps) {
    const { t } = useTranslation()
    const [step, setStep] = useState<CancelStep>('form')
    const [cancelReason, setCancelReason] = useState('')
    const [replacementUuid, setReplacementUuid] = useState('')
    const [result, setResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState('')

    const selectedReason = CANCEL_REASONS.find(r => r.value === cancelReason)
    const requiresUUID = selectedReason?.requiresUUID ?? false

    useEffect(() => {
        if (open) {
            setStep('form')
            setCancelReason('')
            setReplacementUuid('')
            setResult(null)
            setErrorMsg('')
        }
    }, [open])

    const isFormValid = cancelReason && (!requiresUUID || replacementUuid.trim().length > 0)

    const handleCancel = async () => {
        setStep('cancelling')
        try {
            const url = endpoint
                ? `${endpoint}/${record.id}/action/${action.key}`
                : `/data/${model}/me/${record.id}/action/${action.key}`

            const payload: Record<string, any> = { cancel_reason: cancelReason }
            if (requiresUUID && replacementUuid) {
                payload.replacement_uuid = replacementUuid.trim()
            }

            const res = await api.post(url, payload)

            if (res.data.success) {
                setResult(res.data.data)
                setStep('success')
            } else {
                setErrorMsg(res.data.message || 'Error al cancelar')
                setStep('error')
            }
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'Error de conexión al cancelar')
            setStep('error')
        }
    }

    const handleClose = (isOpen: boolean) => {
        if (!isOpen && step === 'success') {
            onSuccess()
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileX className="h-5 w-5 text-red-500" />
                        {t('erp.fiscal.actions.cancel', 'Cancelación de CFDI')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'form' && 'Selecciona el motivo de cancelación del CFDI'}
                        {step === 'confirm' && 'Confirma la cancelación del documento fiscal'}
                        {step === 'cancelling' && 'Procesando cancelación...'}
                        {step === 'success' && 'Documento cancelado exitosamente'}
                        {step === 'error' && 'Error al cancelar el documento'}
                    </DialogDescription>
                </DialogHeader>

                {/* Invoice summary */}
                {(step === 'form' || step === 'confirm') && (
                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {record?.series || ''}{record?.number || record?.folio || record?.id?.slice(0, 8)}
                            </span>
                            <Badge variant="outline">{record?.status}</Badge>
                        </div>
                        {record?.fiscal_data?.fiscal_uuid && (
                            <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                                UUID: {record.fiscal_data.fiscal_uuid}
                            </p>
                        )}
                    </div>
                )}

                {/* Step: Form */}
                {step === 'form' && (
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>
                                Motivo de cancelación <span className="text-red-500">*</span>
                            </Label>
                            <Select value={cancelReason} onValueChange={(v) => {
                                setCancelReason(v)
                                if (v !== '01') setReplacementUuid('')
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar motivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {CANCEL_REASONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {requiresUUID && (
                            <div className="grid gap-2">
                                <Label>
                                    UUID del CFDI que sustituye <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={replacementUuid}
                                    onChange={(e) => setReplacementUuid(e.target.value)}
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Requerido para el motivo 01. Ingresa el UUID del nuevo CFDI que reemplaza al cancelado.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Confirm */}
                {step === 'confirm' && (
                    <div className="space-y-3 py-2">
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    Esta acción cancelará el CFDI ante el SAT. Esta operación no se puede deshacer.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                            <span className="text-muted-foreground">Motivo</span>
                            <span className="font-medium">{selectedReason?.label}</span>
                            {requiresUUID && replacementUuid && (
                                <>
                                    <span className="text-muted-foreground">Sustituye</span>
                                    <span className="font-mono text-xs break-all">{replacementUuid}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Step: Cancelling */}
                {step === 'cancelling' && (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                        <div className="text-center">
                            <p className="font-medium">Cancelando documento fiscal...</p>
                            <p className="text-sm text-muted-foreground">
                                Enviando solicitud de cancelación al SAT
                            </p>
                        </div>
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="space-y-3 py-2">
                        <div className="flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                            <p className="font-medium">CFDI cancelado correctamente</p>
                        </div>
                        {result && (
                            <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                {result.cancelled_document_id && (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                                        <span className="text-muted-foreground">Documento</span>
                                        <span className="font-mono text-xs break-all">{result.cancelled_document_id}</span>
                                    </div>
                                )}
                                {result.fiscal_uuid && (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-1">
                                        <span className="text-muted-foreground">UUID cancelado</span>
                                        <span className="font-mono text-xs break-all">{result.fiscal_uuid}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Error */}
                {step === 'error' && (
                    <div className="space-y-3 py-2">
                        <div className="flex flex-col items-center gap-3">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                            <p className="font-medium text-red-600">Error al cancelar</p>
                        </div>
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                            <p className="text-sm text-red-800 dark:text-red-200">{errorMsg}</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <DialogFooter>
                    {step === 'form' && (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                {t('common.cancel', 'Cancelar')}
                            </Button>
                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={!isFormValid}
                                variant="destructive"
                            >
                                <FileX className="mr-2 h-4 w-4" />
                                Continuar
                            </Button>
                        </>
                    )}
                    {step === 'confirm' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('form')}>
                                Regresar
                            </Button>
                            <Button variant="destructive" onClick={handleCancel}>
                                <FileX className="mr-2 h-4 w-4" />
                                Confirmar cancelación
                            </Button>
                        </>
                    )}
                    {step === 'success' && (
                        <Button onClick={() => handleClose(false)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Cerrar
                        </Button>
                    )}
                    {step === 'error' && (
                        <>
                            <Button variant="outline" onClick={() => handleClose(false)}>
                                Cerrar
                            </Button>
                            <Button variant="outline" onClick={() => setStep('form')}>
                                Reintentar
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
