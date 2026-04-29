import { z } from 'zod'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@asteby/metacore-auth'
import { SignInPage } from '@asteby/metacore-auth/pages'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

function SignInRoute() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const setAccessToken = useAuthStore((s) => s.auth.setAccessToken)

  return (
    <SignInPage
      brandName='Metacore'
      onSubmit={async ({ email, password, redirectTo }) => {
        // TODO: replace this stub with a real backend call.
        // See `@asteby/metacore-auth/api-client` for a fetcher factory.
        // eslint-disable-next-line no-console
        console.log('sign-in submit', { email, password })
        setAccessToken('demo-token')
        await navigate({ to: redirectTo ?? '/' })
      }}
      redirectTo={redirect}
    />
  )
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInRoute,
  validateSearch: searchSchema,
})
