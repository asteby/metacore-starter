import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { OtpPage } from '@asteby/metacore-auth/pages'

function OtpRoute() {
  const navigate = useNavigate()
  return (
    <OtpPage
      brandName='Metacore'
      onSubmit={async (values) => {
        // TODO: wire to your backend.
        // eslint-disable-next-line no-console
        console.log('otp submit', values)
        await navigate({ to: '/sign-in' })
      }}
    />
  )
}

export const Route = createFileRoute('/(auth)/otp')({
  component: OtpRoute,
})
