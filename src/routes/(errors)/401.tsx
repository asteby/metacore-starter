import { createFileRoute } from '@tanstack/react-router'
import { UnauthorisedError } from '@asteby/metacore-ui/error-pages'

export const Route = createFileRoute('/(errors)/401')({
  component: UnauthorisedError,
})
