import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@asteby/metacore-auth'
import { AppShell } from '@/components/layout/app-shell'

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
  },
  component: AppShell,
})
