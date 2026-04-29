import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenError } from '@asteby/metacore-ui/error-pages'

export const Route = createFileRoute('/(errors)/403')({
  component: ForbiddenError,
})
