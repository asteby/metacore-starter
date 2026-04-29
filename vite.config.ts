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
