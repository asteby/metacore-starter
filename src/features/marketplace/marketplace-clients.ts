/**
 * marketplace-clients — wires the SDK's HubClient + OpsClient against the
 * deployment topology used by apps built on the metacore starter.
 *
 * Topology:
 *
 *   - HubClient → public marketplace Hub. Browser hits it directly so the
 *     catalog stays a thin CDN read-path. Override the default
 *     (`https://hub.asteby.com/v1`) with `VITE_HUB_BASE_URL` when pointing
 *     at a staging Hub.
 *
 *   - OpsClient → your app's local backend, mounted under
 *     `/api/kernel/marketplace`. Owns the install/uninstall/upgrade
 *     lifecycle and the per-org installed addon list. The base URL is
 *     read from `VITE_API_URL` (already wired in `.env.example`) so the
 *     marketplace shares interceptors / token plumbing with the rest of
 *     the app.
 *
 * Replace this module if your backend mounts the kernel marketplace
 * routes at a different prefix — the rest of the wireup (provider, route)
 * doesn't need to change.
 */
import { useMemo } from 'react'
import {
  createFetchFetcher,
  createHubClient,
  createOpsClient,
  type HubClient,
  type OpsClient,
} from '@asteby/metacore-marketplace/client'
import { useAuthStore } from '@asteby/metacore-auth'

/**
 * Public marketplace Hub. Default points at the asteby production Hub;
 * override with `VITE_HUB_BASE_URL` for staging or self-hosted Hubs.
 */
const HUB_BASE_URL =
  (import.meta.env.VITE_HUB_BASE_URL as string | undefined) ||
  'https://hub.asteby.com/v1'

/**
 * Local API base — already used by axios / fetch elsewhere in the
 * starter. Falls back to `/api` for SSR-style relative builds.
 */
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || '/api'

/**
 * Ops marketplace path prefix. metacore-kernel >= 0.20.0 exposes the
 * marketplace handler at `/kernel/marketplace`; combined with
 * `API_BASE_URL` the full path is `/api/kernel/marketplace/*`.
 *
 * If your backend mounts the kernel under a different prefix, change this
 * constant — every OpsClient call is appended to it.
 */
const OPS_BASE_PATH = '/kernel/marketplace'

export interface MarketplaceClients {
  hub: HubClient
  ops: OpsClient
}

/**
 * Build a fresh pair of marketplace clients. Memoized off the auth user
 * so a sign-out forces a rebuild (stale tokens would 401 against the
 * kernel).
 */
export function useMarketplaceClients(): MarketplaceClients {
  const userId = useAuthStore((s) => s.auth.user?.id)

  return useMemo<MarketplaceClients>(() => {
    const hubFetcher = createFetchFetcher({
      baseUrl: HUB_BASE_URL,
      // Public catalog — no bearer required today. We still forward the
      // browser locale so the Hub can return localized metadata when
      // available (metacore-kernel v0.19.0+ `metadata.i18n`).
      headers: () => ({
        'accept-language':
          (typeof navigator !== 'undefined' && navigator.language) || 'en',
      }),
    })

    const opsFetcher = createFetchFetcher({
      baseUrl: API_BASE_URL,
      headers: () => {
        const token = useAuthStore.getState().auth.accessToken
        const headers: Record<string, string> = {}
        if (token) headers.authorization = `Bearer ${token}`
        return headers
      },
    })

    return {
      hub: createHubClient({ fetcher: hubFetcher }),
      ops: createOpsClient({
        fetcher: opsFetcher,
        basePath: OPS_BASE_PATH,
      }),
    }
    // `userId` participates in the memo key so a tenant switch rebuilds
    // both clients with the fresh token captured by `headers()`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])
}
