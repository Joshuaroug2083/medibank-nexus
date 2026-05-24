import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages base path for this repo
  base: '/medibank-nexus/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      // Files to precache on install
      includeAssets: ['favicon.svg', 'icons/*.png'],

      // Web App Manifest
      manifest: {
        name:             'MediBank Nexus',
        short_name:       'Nexus',
        description:      'Hospital Management System for Nigeria',
        theme_color:      '#0a6ebd',
        background_color: '#ffffff',
        display:          'standalone',
        orientation:      'portrait-primary',
        start_url:        '/medibank-nexus/',
        scope:            '/medibank-nexus/',
        icons: [
          {
            src:     'icons/icon-192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'any',
          },
          {
            src:     'icons/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name:        'Register Patient',
            short_name:  'Register',
            url:         '/medibank-nexus/?page=register',
            description: 'Register a new patient',
          },
          {
            name:        'Pharmacy Queue',
            short_name:  'Pharmacy',
            url:         '/medibank-nexus/?page=pharmacy',
            description: 'Open the Rx dispensing queue',
          },
        ],
      },

      // Workbox service worker strategy
      workbox: {
        // Cache all static build assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Runtime caching rules
        runtimeCaching: [
          // Google Fonts — cache first, 1 year
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries:    10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Font files — cache first, 1 year
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries:    20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API calls — network first, fallback to cache (5 min)
          {
            urlPattern: /^\/api\/.*/i,
            handler:    'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries:    50,
                maxAgeSeconds: 60 * 5,
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Anthropic AI calls — network only (never cache sensitive data)
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler:    'NetworkOnly',
          },
        ],
      },
    }),
  ],

  // Dev server
  server: {
    port: 5173,
    open: true,
    // Proxy API calls to backend during development
    proxy: {
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // Build output
  build: {
    outDir:    'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split large vendor chunks for better caching
        manualChunks: {
          react:    ['react', 'react-dom'],
          recharts: ['recharts'],
        },
      },
    },
  },
});
