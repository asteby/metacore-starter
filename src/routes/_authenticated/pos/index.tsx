import { createFileRoute } from '@tanstack/react-router'
import { POSPage } from '@/features/pos'

export const Route = createFileRoute('/_authenticated/pos/')({
  component: POSPage,
})
