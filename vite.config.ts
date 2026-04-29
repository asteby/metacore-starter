import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '.((css|styl|less|sass|scss)|d.ts)$|components/.*',
    }),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      includeAssets: ['images/**/*'],
      manifest: {
        name: 'Ops',
        short_name: 'Ops',
        description: 'ERP SaaS Platform',
        theme_color: '#84cc16',
        background_color: '#1a2e05',
        start_url: '/',
        display: 'standalone',
        // @ts-expect-error gcm_sender_id is required for Android push notifications but not in ManifestOptions type
        gcm_sender_id: '103953800507',
        icons: [
          {
            src: '/images/icons/android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/maskable_icon_x48.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/maskable_icon_x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/maskable_icon_x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/maskable_icon_x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/maskable_icon_x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/maskable_icon_x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/maskable_icon_x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/monochrome.png',
            sizes: '194x194',
            type: 'image/png',
            purpose: 'monochrome'
          },
          {
            src: '/images/icons/ios/180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple-touch-icon'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@asteby/metacore-sdk/react': path.resolve(__dirname, '../../metacore-sdk/packages/sdk/src/react.tsx'),
      '@asteby/metacore-sdk': path.resolve(__dirname, '../../metacore-sdk/packages/sdk/src/index.ts'),
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify((() => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const now = new Date();
      const buildId = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      return `${pkg.version}.${buildId}`;
    })()),
  },
})
