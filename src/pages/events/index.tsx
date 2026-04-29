import { DynamicTable } from '@/components/dynamic-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function EventsPage() {
    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Auditoría y Eventos 📜</h2>
                    <p className='text-muted-foreground'>
                        Registro histórico de todas las acciones del sistema.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Log de Eventos</CardTitle>
                    <CardDescription>
                        Depuración y trazar de actividades.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DynamicTable model="events" />
                </CardContent>
            </Card>
        </div>
    )
}
