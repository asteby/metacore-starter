import { createFileRoute } from '@tanstack/react-router'
import { MaintenanceError } from '@asteby/metacore-ui/error-pages'

export const Route = createFileRoute('/(errors)/503')({
  component: MaintenanceError,
})
