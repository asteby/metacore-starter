import { DynamicTable } from '@/components/dynamic-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function OrganizationsPage() {
    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Organizaciones</h2>
                    <p className='text-muted-foreground'>
                        Gestión de tenants y empresas clientes. Solo visible para Superadmin.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Empresas</CardTitle>
                    <CardDescription>
                        Administra los planes y estados de cada organización.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DynamicTable model="organizations" />
                </CardContent>
            </Card>
        </div>
    )
}
