/**
 * MarketplacePage — default marketplace surface every app built on the
 * metacore starter inherits. Renders the SDK's `MarketplaceCatalog`
 * inside a `MarketplaceProvider` wired against the local app's auth +
 * topology (see `marketplace-clients.ts`).
 *
 * Apps that want a different surface (e.g. integrations-style panel, or
 * a custom catalog layout) can swap this file's contents while keeping
 * the route + clients in place.
 *
 * Apps that don't expose addons at all can delete:
 *   - this feature directory
 *   - `src/routes/_authenticated/marketplace.tsx`
 *   - the marketplace entry in `src/components/layout/app-shell.tsx`
 */
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@asteby/metacore-auth'
import {
  MarketplaceProvider,
  MarketplaceCatalog,
} from '@asteby/metacore-marketplace'
import { useTranslation } from 'react-i18next'
import { useMarketplaceClients } from './marketplace-clients'

export function MarketplacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clients = useMarketplaceClients()
  const organizationId = useAuthStore((s) => s.auth.user?.organization_id ?? '')

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          {t('marketplace.title', 'Marketplace')}
        </h1>
        <p className='text-muted-foreground'>
          {t(
            'marketplace.subtitle',
            'Browse and install addons from the metacore Hub.'
          )}
        </p>
      </div>

      <MarketplaceProvider
        hub={clients.hub}
        ops={clients.ops}
        organizationId={organizationId}
      >
        <MarketplaceCatalog
          onSelectAddon={(addon) =>
            navigate({ to: '/', search: { addon: addon.key } as never })
          }
        />
      </MarketplaceProvider>
    </div>
  )
}
