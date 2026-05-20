import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['keeptang-icon.svg'],
      manifest: {
        name: 'keeptang',
        short_name: 'keeptang',
        description: 'บันทึกรายรับรายจ่ายประจำวัน',
        theme_color: '#FBF3E7',
        background_color: '#FBF3E7',
        display: 'standalone',
        start_url: '/',
        lang: 'th',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/keeptang-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (!normalizedId.includes('node_modules')) return undefined;
          if (normalizedId.includes('/node_modules/recharts/')) return 'charts';
          if (normalizedId.includes('/node_modules/react-day-picker/')) return 'datepicker';
          if (normalizedId.includes('/node_modules/@supabase/')) return 'supabase';
          if (
            [
              '/node_modules/@remix-run/router/',
              '/node_modules/react/',
              '/node_modules/react-dom/',
              '/node_modules/react-router/',
              '/node_modules/react-router-dom/',
              '/node_modules/scheduler/'
            ].some((packagePath) => normalizedId.includes(packagePath))
          ) {
            return 'react';
          }
          return 'vendor';
        }
      }
    }
  }
});
