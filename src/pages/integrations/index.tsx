import { DynamicTable } from '@/components/dynamic-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function IntegrationsPage() {
    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Integraciones 🔌</h2>
                    <p className='text-muted-foreground'>
                        Conecta con CRMs externos, Webhooks y herramientas de terceros.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Marketplace de Integraciones</CardTitle>
                    <CardDescription>
                        Extiende la funcionalidad de tu plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DynamicTable model="integrations" />
                </CardContent>
            </Card>
        </div>
    )
}
