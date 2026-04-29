import { createFileRoute } from '@tanstack/react-router'
import { SystemLicense } from '@/features/admin/system/license'

export const Route = createFileRoute('/_authenticated/admin/system/license')({
  component: SystemLicense,
})
