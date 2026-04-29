import { createFileRoute } from '@tanstack/react-router'
import BotsPage from '@/pages/bots'

export const Route = createFileRoute('/_authenticated/bots/')({
    component: BotsPage,
})
