import path from 'path'
import { defineConfig } from 'vite'
import { defineMetacoreConfig } from '@asteby/metacore-starter-config/vite'
import fs from 'fs'

export default defineConfig(async () => {
  const metacore = await defineMetacoreConfig({
    router: true,
    routerIgnorePattern: '.((css|styl|less|sass|scss)|d.ts)$|components/.*',
    pwa: {
      name: 'Metacore Starter',
      shortName: 'Metacore',
      description: 'Vite + React starter for the metacore ecosystem',
    },
  })

  return {
    ...metacore,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // metacoreOptimizeDeps (starter-config <= 0.3.0) doesn't yet include
    // @asteby/metacore-marketplace; declare it here so Vite pre-bundles the
    // package (and its subpath exports). See memory note "Vite optimizeDeps
    // obligatorio para @asteby/metacore-* linked".
    optimizeDeps: {
      ...metacore.optimizeDeps,
      include: [
        ...(metacore.optimizeDeps?.include ?? []),
        '@asteby/metacore-marketplace',
        '@asteby/metacore-marketplace/client',
        '@asteby/metacore-marketplace/hooks',
        '@asteby/metacore-marketplace/components',
        '@asteby/metacore-marketplace/providers',
      ],
    },
    define: {
      __APP_VERSION__: JSON.stringify(
        (() => {
          const pkg = JSON.parse(
            fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
          )
          const now = new Date()
          const buildId = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
          return `${pkg.version}.${buildId}`
        })()
      ),
    },
  }
})
