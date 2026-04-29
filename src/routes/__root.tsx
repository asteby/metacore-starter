import { useEffect } from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router'
//import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
//import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { NotificationPermissionPrompt } from '@/components/notification-permission-prompt'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { useAuthStore } from '@/stores/auth-store'
import { AuthProvider } from '@/context/auth-provider'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  beforeLoad: ({ location }) => {
    // Root path: nginx handles unauthenticated users (302 → /es landing page).
    // The SW skips landing routes, so this only runs if the PWA is already loaded
    // (e.g. user navigates to / within the SPA). Redirect to dashboard or sign-in.
    if (location.pathname === '/') {
      const { auth } = useAuthStore.getState()
      if (!auth.accessToken || !auth.user) {
        throw redirect({ to: '/sign-in' })
      }
    }
  },
  component: () => {
    useEffect(() => {
      const loader = document.getElementById('initial-loader')
      if (loader) {
        // Find the root element to ensure we don't remove loader before content is ready?
        // Actually, just mounting this component means the JS has loaded and React has started rendering.
        // Let's add a small delay or transition for smoothness.

        // Ensure transition property exists (it might not be in the CSS, so adding it inline)
        loader.style.transition = 'opacity 0.5s ease-out'
        loader.style.opacity = '0'

        const timeout = setTimeout(() => {
          loader.remove()
        }, 500)

        return () => clearTimeout(timeout)
      }
    }, [])

    return (
      <AuthProvider>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} position="bottom-right" />
        <NotificationPermissionPrompt />
        {import.meta.env.MODE === 'development' && (
          <>
            {/* <ReactQueryDevtools buttonPosition='bottom-left' /> */}
            {/* <TanStackRouterDevtools position='bottom-right' /> */}
          </>
        )}
      </AuthProvider>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
