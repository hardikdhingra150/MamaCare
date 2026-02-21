// vite.config.js
import { defineConfig }  from 'vite';
import react             from '@vitejs/plugin-react';
import { VitePWA }       from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name:             'MamaCare',
        short_name:       'MamaCare',
        description:      'Your personal maternal health companion',
        theme_color:      '#f472b6',
        background_color: '#fdf6f0',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache all Firebase reads for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler:    'NetworkFirst',
            options: {
              cacheName:         'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration:        { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler:   'CacheFirst',
            options:   { cacheName: 'google-fonts', expiration: { maxAgeSeconds: 604800 } },
          },
        ],
      },
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});
