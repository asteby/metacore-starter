import { createFileRoute } from '@tanstack/react-router'
import { MarketplacePage } from '@/features/marketplace'

export const Route = createFileRoute('/_authenticated/integrations/')({
  component: MarketplacePage,
})
