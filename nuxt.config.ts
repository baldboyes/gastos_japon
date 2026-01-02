import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      }
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    'shadcn-nuxt',
    '@vite-pwa/nuxt',
    '@clerk/nuxt'
  ],
  nitro: {
    preset: 'vercel',
    debug: true,
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui'
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    registerWebManifestInRouteRules: true,
    base: '/',
    scope: '/',
    includeAssets: ['favicon.ico', 'favicon.png', 'icon.svg', 'robots.txt'],
    manifest: {
      name: 'Gastos Japón',
      short_name: 'Gastos',
      description: 'Gastos del viaje a Japón',
      theme_color: '#40C4AA',
      background_color: '#F8FAFC',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      lang: 'es',
      categories: ['finance', 'travel', 'productivity'],
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'geocoding-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'mapbox-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module'
    }
  }
})