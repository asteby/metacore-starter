import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Network, Bot, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ViewOrchestratorDialogProps {
    orchestrator: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewOrchestratorDialog({ orchestrator, open, onOpenChange }: ViewOrchestratorDialogProps) {
    if (!orchestrator) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        Detalles del Orquestador
                    </DialogTitle>
                    <DialogDescription>
                        Información completa del orquestador.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">{orchestrator.name}</h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Calendar className="mr-1 h-3 w-3" />
                                Creado el {format(new Date(orchestrator.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                            </div>
                        </div>
                        <Badge variant={orchestrator.status === 'active' ? 'default' : 'secondary'}>
                            {orchestrator.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none">Descripción</h4>
                        <p className="text-sm text-muted-foreground">
                            {orchestrator.description || "Sin descripción disponible."}
                        </p>
                    </div>

                    {/* Agents */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Agentes Conectados
                        </h4>
                        {orchestrator.agents && orchestrator.agents.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {orchestrator.agents.map((agent: any) => (
                                    <Badge key={agent.id} variant="outline" className="pl-1 pr-2 py-1 flex items-center gap-1">
                                        <Bot className="h-3 w-3 text-muted-foreground" />
                                        <div className="flex flex-col items-start text-xs">
                                            <span className="font-medium">{agent.name}</span>
                                        </div>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No hay agentes conectados a este orquestador.</p>
                        )}
                    </div>

                    {/* JSON Config (Hidden if empty) */}
                    {orchestrator.config && Object.keys(orchestrator.config).length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium leading-none">Configuración Avanzada</h4>
                            <div className="bg-muted p-2 rounded-md overflow-x-auto">
                                <pre className="text-xs">{JSON.stringify(orchestrator.config, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
