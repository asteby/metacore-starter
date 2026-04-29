import type { RouteContribution } from '@asteby/metacore-sdk'
import { useAddonRoutes } from '@asteby/metacore-sdk/react'
import { useLocation } from '@tanstack/react-router'

/**
 * AddonRoutesOutlet — rendered under a tanstack-router catch-all (e.g.
 * /addons/$) so addons can contribute pages at runtime. Ops does not use a
 * basepath, so the raw pathname is matched directly.
 */
export function AddonRoutesOutlet() {
  const routes = useAddonRoutes()
  const pathname = useLocation({ select: (l) => l.pathname })

  const effective = pathname || '/'

  const match = routes.find(
    (r: RouteContribution) => normalize(r.path) === normalize(effective),
  )
  if (!match) {
    return (
      <div className='p-6 text-sm text-muted-foreground'>
        Ningún addon registra la ruta <code>{effective}</code>.
      </div>
    )
  }

  const Component = match.component
  return <Component />
}

function normalize(p: string): string {
  if (!p) return '/'
  const trimmed = p.replace(/\/+$/g, '')
  return trimmed.startsWith('/') ? trimmed || '/' : `/${trimmed}`
}
