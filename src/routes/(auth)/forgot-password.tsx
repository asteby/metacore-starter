import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@asteby/metacore-auth/pages'

function ForgotPasswordRoute() {
  const navigate = useNavigate()
  return (
    <ForgotPasswordPage
      brandName='Metacore'
      onSubmit={async (values) => {
        // TODO: wire to your backend.
        // eslint-disable-next-line no-console
        console.log('forgot-password submit', values)
        await navigate({ to: '/otp' })
      }}
    />
  )
}

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPasswordRoute,
})
