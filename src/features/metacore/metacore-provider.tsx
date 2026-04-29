import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MarketplaceClient, Registry, bootstrapAddons } from '@asteby/metacore-sdk'
import { MetacoreProvider } from '@asteby/metacore-sdk/react'
import { useAuthStore } from '@/stores/auth-store'
import i18n from '@/i18n/i18n'

/**
 * MetacoreAppProvider — host-side wrapper that wires the Metacore SDK into the
 * ops shell. It creates a shared Registry + MarketplaceClient (pointed at
 * /api/metacore), kicks off `bootstrapAddons` on mount and renders the SDK's
 * <MetacoreProvider> below. Coexists with the legacy src/addons system.
 */

const METACORE_BASE_URL =
  (import.meta.env.VITE_METACORE_URL as string | undefined) || '/api/metacore'

const KERNEL_VERSION =
  (import.meta.env.VITE_METACORE_KERNEL as string | undefined) || '2.0.0'

interface MetacoreAppProviderProps {
  children: ReactNode
}

export function MetacoreAppProvider({ children }: MetacoreAppProviderProps) {
  const token = useAuthStore((s) => s.auth.accessToken)
  const [booted, setBooted] = useState(false)

  const registry = useMemo(() => new Registry(), [])
  const client = useMemo(
    () =>
      new MarketplaceClient({
        baseUrl: METACORE_BASE_URL,
        headers: () => {
          const headers: Record<string, string> = {
            'Accept-Language': i18n.language || 'es',
          }
          const current = useAuthStore.getState().auth.accessToken
          if (current) headers['Authorization'] = `Bearer ${current}`
          return headers
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    if (!token || booted) return
    let cancelled = false
    bootstrapAddons({
      client,
      registry,
      kernelVersion: KERNEL_VERSION,
      telemetry: (event, data) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug('[metacore]', event, data ?? '')
        }
      },
    })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[metacore] bootstrap failed', err)
      })
      .finally(() => {
        if (!cancelled) setBooted(true)
      })
    return () => {
      cancelled = true
    }
  }, [token, booted, client, registry])

  return (
    <MetacoreProvider client={client} registry={registry}>
      {children}
    </MetacoreProvider>
  )
}
