import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base: the same build works at a domain root, a repo subpath,
// or opened from a folder.
const BASE = process.env.VITE_BASE ?? './'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? BASE : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'FieldBook — Corn Trials',
        short_name: 'FieldBook',
        description: 'Record corn variety trial data in the field. Works offline.',
        theme_color: '#15803d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          // maskable lets Android use the full adaptive-icon shape
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Client-side routes must resolve to index.html when offline, otherwise
        // reopening the installed app on /collect/2 fails.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // OSM serves tiles from a.|b.|c. subdomains — the previous pattern
            // only matched the bare host, so no tile was ever cached offline.
            urlPattern: /^https:\/\/[a-c]?\.?tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
}))
