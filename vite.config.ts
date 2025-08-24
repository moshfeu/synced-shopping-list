import { defineConfig } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      pwaAssets: {
        disabled: true, // Disable PWA assets generator to avoid dependency issues
      },
      manifest: {
        name: 'Synced Shopping List',
        short_name: 'SSL',
        description: 'Synced Shopping List - a Shopping list app which synced in multiple devices',
        theme_color: '#FFFFFF',
        background_color: '#6C63FF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.png',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/png',
          },
          {
            src: 'logo192.png',
            type: 'image/png',
            sizes: '192x192',
          },
          {
            src: 'logo512.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
        shortcuts: [
          {
            name: 'Add from History',
            url: '/history',
            description: 'Add items from history',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/_/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return url.origin === self.location.origin && url.pathname.endsWith('.png');
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});