import { DynamicTable } from '@/components/dynamic-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function AutomationsPage() {
    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Automatizaciones ⚡</h2>
                    <p className='text-muted-foreground'>
                        Crea flujos de trabajo, reglas y respuestas automáticas.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Flujos Activos</CardTitle>
                    <CardDescription>
                        Gestiona tus triggers y acciones automatizadas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DynamicTable model="automations" />
                </CardContent>
            </Card>
        </div>
    )
}
