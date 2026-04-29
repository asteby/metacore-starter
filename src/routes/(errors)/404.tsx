import { createFileRoute } from '@tanstack/react-router'
import { NotFoundError } from '@asteby/metacore-ui/error-pages'

export const Route = createFileRoute('/(errors)/404')({
  component: NotFoundError,
})
