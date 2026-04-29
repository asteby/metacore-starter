import { useEffect } from 'react'
import { type QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AuthProvider, useAuthStore } from '@asteby/metacore-auth'
import { GeneralError, NotFoundError } from '@asteby/metacore-ui/error-pages'
import { Toaster } from '@asteby/metacore-ui/primitives'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/') {
      const { auth } = useAuthStore.getState()
      if (!auth.accessToken || !auth.user) {
        throw redirect({ to: '/sign-in' })
      }
    }
  },
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})

function RootComponent() {
  useEffect(() => {
    const loader = document.getElementById('initial-loader')
    if (loader) {
      loader.style.transition = 'opacity 0.5s ease-out'
      loader.style.opacity = '0'
      const timeout = setTimeout(() => loader.remove(), 500)
      return () => clearTimeout(timeout)
    }
  }, [])

  return (
    <AuthProvider>
      <Outlet />
      <Toaster duration={5000} position='bottom-right' />
    </AuthProvider>
  )
}
