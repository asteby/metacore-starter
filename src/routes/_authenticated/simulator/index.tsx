import { createFileRoute } from '@tanstack/react-router'
import SimulatorPage from '@/pages/simulator'

export const Route = createFileRoute('/_authenticated/simulator/')({
    component: SimulatorPage,
})
