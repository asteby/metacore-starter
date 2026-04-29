import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { useMetadataCache } from '@/stores/metadata-cache'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    if (!auth.accessToken || !auth.user) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: window.location.pathname,
        },
      })
    }

    // Fire-and-forget: prefetch all metadata into cache once after auth
    useMetadataCache.getState().prefetchAll()
  },
  component: AuthenticatedLayout,
})
