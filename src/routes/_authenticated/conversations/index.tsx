import { createFileRoute } from '@tanstack/react-router'
import ConversationsPage from '@/pages/conversations'

export const Route = createFileRoute('/_authenticated/conversations/')({
    component: ConversationsPage,
})
