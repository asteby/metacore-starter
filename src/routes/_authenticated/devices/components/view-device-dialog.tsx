
import { useTranslation } from 'react-i18next'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Smartphone, Bot, Workflow, User } from 'lucide-react'

interface ViewDeviceDialogProps {
    device: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { parsePhoneNumber } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'

export function ViewDeviceDialog({ device, open, onOpenChange }: ViewDeviceDialogProps) {
    const { t } = useTranslation()
    const [processName, setProcessName] = useState<string | null>(null)
    const [isLoadingProcess, setIsLoadingProcess] = useState(false)

    useEffect(() => {
        if (open && device?.process_id && device?.process_type) {
            const fetchProcessName = async () => {
                setIsLoadingProcess(true)
                try {
                    // Normalize endpoint based on type
                    const endpointType = device.process_type === 'user' ? 'users' : `${device.process_type}s`
                    const response = await api.get(`/data/${endpointType}/${device.process_id}`)

                    if (response.data?.success && response.data?.data) {
                        setProcessName(response.data.data.name)
                    } else {
                        setProcessName('Desconocido')
                    }
                } catch (error) {
                    console.error('Error fetching process name:', error)
                    setProcessName('No encontrado')
                } finally {
                    setIsLoadingProcess(false)
                }
            }
            fetchProcessName()
        } else {
            setProcessName(null)
        }
    }, [device, open])

    if (!device) return null

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'active':
            case 'connected':
                return 'default'
            case 'disconnected':
            case 'inactive':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active':
            case 'connected':
                return 'Activo'
            case 'disconnected':
            case 'inactive':
                return 'Desconectado'
            default:
                return status
        }
    }

    const renderIdentifier = () => {
        if (!device.identifier) return <span className="text-muted-foreground">-</span>

        if (device.type === 'whatsapp') {
            // Clean the identifier to get the raw number
            const rawNumber = device.identifier.replace('@s.whatsapp.net', '').split(':')[0]
            const phoneNumber = parsePhoneNumber(`+${rawNumber}`)

            if (phoneNumber && phoneNumber.country) {
                const Flag = flags[phoneNumber.country]
                return (
                    <div className="flex items-center gap-2 bg-muted/30 px-2 py-0.5 rounded w-fit">
                        <span className="flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-sm [&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover">
                            {Flag && <Flag title={phoneNumber.country} />}
                        </span>
                        <span className="text-sm font-mono">{phoneNumber.formatInternational()}</span>
                    </div>
                )
            }

            // Fallback if parsing fails but it's whatsapp
            return (
                <span className="text-sm font-mono bg-muted/30 px-2 py-0.5 rounded w-fit">
                    {rawNumber}
                </span>
            )
        }

        // Default for other types
        return (
            <span className="text-sm font-mono bg-muted/30 px-2 py-0.5 rounded w-fit">
                {device.identifier}
            </span>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>{t('devices.connection_details_title')}</DialogTitle>
                            <DialogDescription>
                                {t('devices.complete_device_info')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Name and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <h4 className="text-sm font-medium text-muted-foreground">Nombre</h4>
                            <p className="text-base font-semibold">{device.name}</p>
                        </div>
                        <div className="space-y-1.5">
                            <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                            <div>
                                <Badge variant={getStatusVariant(device.status)}>
                                    {getStatusLabel(device.status)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Type and Identifier */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <h4 className="text-sm font-medium text-muted-foreground">Tipo</h4>
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 opacity-70" />
                                <span className="text-sm capitalize font-medium">{device.type}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                {device.type === 'whatsapp' ? 'Número' : 'Identificador'}
                            </h4>
                            {renderIdentifier()}
                        </div>
                    </div>

                    {/* Process Info */}
                    <div className="space-y-3 rounded-lg border p-4 bg-muted/10">
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                            {device.process_type === 'agent' && <Bot className="h-4 w-4 text-purple-500" />}
                            {device.process_type === 'flow' && <Workflow className="h-4 w-4 text-blue-500" />}
                            {device.process_type === 'user' && <User className="h-4 w-4 text-green-500" />}
                            Proceso Asignado
                        </h4>

                        {!device.process_type ? (
                            <p className="text-sm text-muted-foreground">Sin proceso asignado</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Tipo</span>
                                    <span className="capitalize font-medium block">
                                        {device.process_type === 'agent' ? 'Agente IA' :
                                            device.process_type === 'flow' ? 'Flujo' :
                                                device.process_type === 'user' ? 'Empleado' : device.process_type}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Nombre</span>
                                    {isLoadingProcess ? (
                                        <Skeleton className="h-5 w-24" />
                                    ) : (
                                        <span className="font-medium block">
                                            {processName || 'No disponible'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Only show raw ID in a minimal tooltip or don't show it at all if name is found */}
                        {device.process_id && !processName && !isLoadingProcess && (
                            <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                                ID: {device.process_id}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
