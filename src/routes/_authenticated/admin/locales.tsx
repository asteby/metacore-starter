import { createFileRoute } from '@tanstack/react-router'
import { AdminLocales } from '@/features/admin/locales'

export const Route = createFileRoute('/_authenticated/admin/locales')({
  component: AdminLocales,
})
