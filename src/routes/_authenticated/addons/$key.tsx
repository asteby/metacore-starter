import { createFileRoute } from '@tanstack/react-router'
import { MetacoreAddonDetailPage } from '@/features/metacore'

export const Route = createFileRoute('/_authenticated/addons/$key')({
  component: MetacoreAddonDetailPage,
})
