import { createFileRoute } from '@tanstack/react-router'
import { PurchasePage } from '@/features/purchase'

export const Route = createFileRoute('/_authenticated/purchase/')({
  component: PurchasePage,
})
