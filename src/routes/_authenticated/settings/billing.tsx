import { createFileRoute } from '@tanstack/react-router'
import { Billing } from '@/features/settings/billing'

export const Route = createFileRoute('/_authenticated/settings/billing')({
  component: Billing,
})
