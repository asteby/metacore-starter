import { createFileRoute } from '@tanstack/react-router'
import { MetacoreMarketplacePage } from '@/features/metacore'

export const Route = createFileRoute('/_authenticated/addons/')({
  component: MetacoreMarketplacePage,
})
