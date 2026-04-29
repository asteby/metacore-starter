import { createFileRoute } from '@tanstack/react-router'
import { SalesCreatePage } from '@/features/sales/create-page'

export const Route = createFileRoute('/_authenticated/sales/create')({
  component: SalesCreatePage,
})
