# metacore-starter

Vite + React starter that consumes the [metacore SDK](https://github.com/asteby) modularly. Use this as the source of truth when bootstrapping a new app in the metacore ecosystem — clone, rename, build.

## Stack

- **Build:** [Vite](https://vitejs.dev/) + [`@asteby/metacore-starter-config`](https://www.npmjs.com/package/@asteby/metacore-starter-config) (`defineMetacoreConfig` preset)
- **Framework:** React 19 + TypeScript
- **Routing:** [TanStack Router](https://tanstack.com/router/latest)
- **Data:** [TanStack Query](https://tanstack.com/query/latest)
- **Styling:** [Tailwind v4](https://tailwindcss.com/) + [`@asteby/metacore-theme`](https://www.npmjs.com/package/@asteby/metacore-theme)
- **UI primitives:** [`@asteby/metacore-ui`](https://www.npmjs.com/package/@asteby/metacore-ui) (shadcn-derived, RTL-aware)
- **Auth pages + store:** [`@asteby/metacore-auth`](https://www.npmjs.com/package/@asteby/metacore-auth)
- **i18n:** [`@asteby/metacore-i18n`](https://www.npmjs.com/package/@asteby/metacore-i18n) (i18next under the hood)

## What's included

- Auth flow: `/sign-in`, `/sign-up`, `/forgot-password`, `/otp` (wired to `@asteby/metacore-auth/pages` — wire `onSubmit` to your backend).
- Authenticated shell: `AppShell` consumes `AuthenticatedLayout` + `AppSidebar` + `Header` + `ProfileDropdown` from `@asteby/metacore-ui/layout`.
- Minimal dashboard placeholder.
- Settings: profile, appearance (theme + font), notifications.
- Marketplace: `/marketplace` renders [`@asteby/metacore-marketplace`](https://www.npmjs.com/package/@asteby/metacore-marketplace) wired against the public Hub (catalog) and your local backend (install/upgrade). See [Marketplace](#marketplace) below.
- Error pages: 401, 403, 404, 500, 503 — all from `@asteby/metacore-ui/error-pages`.

## Run locally

```bash
pnpm install
pnpm dev
```

Other scripts:

- `pnpm typecheck` — TypeScript check
- `pnpm lint` — ESLint
- `pnpm build` — production build (runs `tsc -b && vite build`)
- `pnpm preview` — serve the build

## Customize

1. Update the brand name & logo in `src/components/layout/app-shell.tsx`, `src/assets/logo.tsx` and the auth route components.
2. Replace the `onSubmit` stubs in `src/routes/(auth)/*.tsx` with real backend calls (see `@asteby/metacore-auth/api-client`).
3. Add navigation entries in `src/components/layout/app-shell.tsx` (`navGroups`).
4. Drop your features in `src/features/` and routes in `src/routes/_authenticated/`.
5. Translation strings live in `src/i18n/locales/{en,es}.json`. The base SDK strings are merged from `@asteby/metacore-i18n/locales`.

## Marketplace

The starter wires `@asteby/metacore-marketplace` into `/marketplace` by default so every app in the ecosystem inherits the addon catalog without re-implementing it.

Topology (see `src/features/marketplace/marketplace-clients.ts`):

- **Catalog** — the browser hits the public marketplace Hub directly. Default `https://hub.asteby.com/v1`; override with `VITE_HUB_BASE_URL` to point at a staging or self-hosted Hub.
- **Install / upgrade / uninstall** — handled by your backend at `/api/kernel/marketplace/*`. Your app only needs to expose the kernel marketplace routes (metacore-kernel >= 0.20.0 ships them) and the SDK does the rest.

To customize copy, labels or filters, edit `src/features/marketplace/index.tsx`. To disable the marketplace entirely (apps that don't expose addons), delete:

- `src/features/marketplace/`
- `src/routes/_authenticated/marketplace.tsx`
- the `Marketplace` entry in `src/components/layout/app-shell.tsx`

## License

[MIT](./LICENSE)
