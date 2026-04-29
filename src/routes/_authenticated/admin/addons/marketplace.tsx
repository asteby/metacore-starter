import { createFileRoute } from '@tanstack/react-router'
import { AddonsMarketplace } from '@/features/admin/addons/marketplace'

export const Route = createFileRoute('/_authenticated/admin/addons/marketplace')({
  component: AddonsMarketplace,
})
