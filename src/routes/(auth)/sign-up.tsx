import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignUpPage } from '@asteby/metacore-auth/pages'

function SignUpRoute() {
  const navigate = useNavigate()
  return (
    <SignUpPage
      brandName='Metacore'
      onSubmit={async (values) => {
        // TODO: wire to your backend.
        // eslint-disable-next-line no-console
        console.log('sign-up submit', values)
        await navigate({ to: '/sign-in' })
      }}
    />
  )
}

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUpRoute,
})
