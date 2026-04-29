import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
// Moved external component imports to comment as they are not used
// import { Overview } from '@/pages/dashboard/components/overview'
// import { RecentSales } from '@/pages/dashboard/components/recent-sales'

export default function AnalyticsPage() {
    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold tracking-tight'>Analytics 📊</h2>
                    <p className='text-muted-foreground'>
                        Métricas de rendimiento, tiempos de respuesta y uso de IA.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45,231</div>
                        <p className="text-xs text-muted-foreground">+20.1% mes pasado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">IA Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1.2M</div>
                        <p className="text-xs text-muted-foreground">$24.00 cost est.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Actividad Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Placeholder for chart */}
                        <div className="h-[200px] flex items-center justify-center border-dashed border rounded">
                            Chart Component
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
