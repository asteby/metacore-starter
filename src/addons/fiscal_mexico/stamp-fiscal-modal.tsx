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
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, FileCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { ActionModalProps } from '@/components/dynamic/action-registry'

// SAT catalogs
const CFDI_USAGE = [
    { value: 'G01', label: 'G01 - Adquisición de mercancías', desc: 'Compra de bienes' },
    { value: 'G03', label: 'G03 - Gastos en general', desc: 'Gastos operativos' },
    { value: 'I01', label: 'I01 - Construcciones', desc: 'Inmuebles y obras' },
    { value: 'P01', label: 'P01 - Por definir', desc: 'Uso pendiente' },
    { value: 'S01', label: 'S01 - Sin efectos fiscales', desc: 'Sin deducción' },
]

const PAYMENT_FORMS = [
    { value: '01', label: '01 - Efectivo' },
    { value: '02', label: '02 - Cheque nominativo' },
    { value: '03', label: '03 - Transferencia electrónica' },
    { value: '04', label: '04 - Tarjeta de crédito' },
    { value: '28', label: '28 - Tarjeta de débito' },
    { value: '99', label: '99 - Por definir' },
]

const PAYMENT_METHODS = [
    { value: 'PUE', label: 'PUE - Pago en una sola exhibición', desc: 'Pago inmediato completo' },
    { value: 'PPD', label: 'PPD - Pago en parcialidades o diferido', desc: 'Pago a crédito o parcialidades' },
]

type StampStep = 'form' | 'confirm' | 'stamping' | 'success' | 'error'

export function StampFiscalModal({
    open,
    onOpenChange,
    action,
    model,
    record,
    endpoint,
    onSuccess,
}: ActionModalProps) {
    const { t } = useTranslation()
    const [step, setStep] = useState<StampStep>('form')
    const [cfdiUsage, setCfdiUsage] = useState('')
    const [paymentForm, setPaymentForm] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('PUE')
    const [testMode, setTestMode] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState('')

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setStep('form')
            setCfdiUsage(record?.fiscal_data?.cfdi_usage || '')
            setPaymentForm(record?.fiscal_data?.payment_form || '')
            setPaymentMethod(record?.fiscal_data?.payment_method || 'PUE')
            setTestMode(false)
            setResult(null)
            setErrorMsg('')
        }
    }, [open, record])

    const isFormValid = cfdiUsage && paymentForm && paymentMethod

    const handleConfirm = () => {
        if (!isFormValid) return
        setStep('confirm')
    }

    const handleStamp = async () => {
        setStep('stamping')
        try {
            const url = endpoint
                ? `${endpoint}/${record.id}/action/${action.key}`
                : `/data/${model}/me/${record.id}/action/${action.key}`

            const res = await api.post(url, {
                cfdi_usage: cfdiUsage,
                payment_form: paymentForm,
                payment_method: paymentMethod,
                test_mode: testMode,
            })

            if (res.data.success) {
                setResult(res.data.data)
                setStep('success')
            } else {
                setErrorMsg(res.data.message || 'Error al timbrar')
                setStep('error')
            }
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'Error de conexión al timbrar')
            setStep('error')
        }
    }

    const handleClose = (isOpen: boolean) => {
        if (!isOpen && step === 'success') {
            onSuccess()
        }
        onOpenChange(isOpen)
    }

    const invoiceTotal = record?.total != null
        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: record.currency || 'MXN' }).format(record.total)
        : null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        {t('erp.fiscal.actions.stamp', 'Timbrado CFDI')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'form' && t('erp.fiscal.stamp.description', 'Configura los datos fiscales para el timbrado')}
                        {step === 'confirm' && t('erp.fiscal.stamp.confirm_desc', 'Verifica los datos antes de timbrar')}
                        {step === 'stamping' && t('erp.fiscal.stamp.processing', 'Enviando al SAT...')}
                        {step === 'success' && t('erp.fiscal.stamp.success', 'Documento timbrado exitosamente')}
                        {step === 'error' && t('erp.fiscal.stamp.error', 'Error al timbrar el documento')}
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
                        {record?.customer_name && (
                            <p className="mt-1 text-sm font-medium">{record.customer_name}</p>
                        )}
                        {invoiceTotal && (
                            <p className="mt-1 text-lg font-semibold">{invoiceTotal}</p>
                        )}
                    </div>
                )}

                {/* Step: Form */}
                {step === 'form' && (
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="cfdi_usage">
                                Uso de CFDI <span className="text-red-500">*</span>
                            </Label>
                            <Select value={cfdiUsage} onValueChange={setCfdiUsage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar uso de CFDI..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {CFDI_USAGE.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex flex-col">
                                                <span>{opt.label}</span>
                                                <span className="text-xs text-muted-foreground">{opt.desc}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_form">
                                Forma de pago <span className="text-red-500">*</span>
                            </Label>
                            <Select value={paymentForm} onValueChange={setPaymentForm}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar forma de pago..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_FORMS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_method">
                                Método de pago <span className="text-red-500">*</span>
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex flex-col">
                                                <span>{opt.label}</span>
                                                <span className="text-xs text-muted-foreground">{opt.desc}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="test_mode" className="cursor-pointer">
                                    Modo de prueba
                                </Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Timbra en sandbox sin afectar producción</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Switch
                                id="test_mode"
                                checked={testMode}
                                onCheckedChange={setTestMode}
                            />
                        </div>
                    </div>
                )}

                {/* Step: Confirm */}
                {step === 'confirm' && (
                    <div className="space-y-3 py-2">
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    {testMode
                                        ? 'Se timbrará en modo SANDBOX. No genera un CFDI válido ante el SAT.'
                                        : 'Esta acción generará un CFDI válido ante el SAT. Verifique los datos antes de continuar.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Uso CFDI</div>
                            <div className="font-medium">{CFDI_USAGE.find(o => o.value === cfdiUsage)?.label}</div>
                            <div className="text-muted-foreground">Forma de pago</div>
                            <div className="font-medium">{PAYMENT_FORMS.find(o => o.value === paymentForm)?.label}</div>
                            <div className="text-muted-foreground">Método de pago</div>
                            <div className="font-medium">{PAYMENT_METHODS.find(o => o.value === paymentMethod)?.label}</div>
                            <div className="text-muted-foreground">Ambiente</div>
                            <div className="font-medium">
                                <Badge variant={testMode ? 'secondary' : 'default'}>
                                    {testMode ? 'Sandbox' : 'Producción'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Stamping */}
                {step === 'stamping' && (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                        <div className="text-center">
                            <p className="font-medium">Timbrando documento...</p>
                            <p className="text-sm text-muted-foreground">
                                Conectando con el PAC para generar el CFDI
                            </p>
                        </div>
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="space-y-3 py-2">
                        <div className="flex flex-col items-center gap-3">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                            <p className="font-medium">CFDI timbrado correctamente</p>
                        </div>
                        {result && (
                            <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                {result.fiscal_uuid && (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                                        <span className="text-muted-foreground">UUID Fiscal</span>
                                        <span className="font-mono text-xs break-all">{result.fiscal_uuid}</span>
                                    </div>
                                )}
                                {result.stamped_at && (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-1">
                                        <span className="text-muted-foreground">Fecha timbrado</span>
                                        <span>{new Date(result.stamped_at).toLocaleString('es-MX')}</span>
                                    </div>
                                )}
                                {result.status && (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-1">
                                        <span className="text-muted-foreground">Estado</span>
                                        <Badge variant="default">{result.status}</Badge>
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
                            <p className="font-medium text-red-600">Error al timbrar</p>
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
                                onClick={handleConfirm}
                                disabled={!isFormValid}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <FileCheck className="mr-2 h-4 w-4" />
                                Revisar y timbrar
                            </Button>
                        </>
                    )}
                    {step === 'confirm' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('form')}>
                                Regresar
                            </Button>
                            <Button
                                onClick={handleStamp}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <FileCheck className="mr-2 h-4 w-4" />
                                {testMode ? 'Timbrar (Sandbox)' : 'Timbrar CFDI'}
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
