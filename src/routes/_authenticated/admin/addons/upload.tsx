import { createFileRoute } from '@tanstack/react-router'
import { AddonsUpload } from '@/features/admin/addons/upload'

export const Route = createFileRoute('/_authenticated/admin/addons/upload')({
  component: AddonsUpload,
})
