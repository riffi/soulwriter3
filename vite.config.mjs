import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({ // Ensure VitePWA is active
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'src/components/layout/NavbarNested/parts/logo/logo.png', 'src/components/layout/NavbarNested/parts/logo/logo_collapsed.png'],
      manifest: {
        name: 'IncLumin',
        short_name: 'IncLumin',
        description: 'Приложение для писателя',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
    // visualizer plugin completely removed
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id, { getModuleInfo }) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('@mantine/core') || id.includes('@mantine/hooks')) {
              return 'mantine-vendor';
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd-kit-vendor';
            }
            if (id.includes('@tiptap')) {
              return 'tiptap-vendor';
            }
            if (id.includes('dexie')) { // Catches dexie and dexie-react-hooks
              return 'dexie-vendor';
            }
            if (id.includes('reactflow')) {
              return 'reactflow-vendor';
            }
            if (id.includes('lodash')) {
              return 'lodash-vendor';
            }
            if (id.includes('react-icons')) {
              return 'react-icons-vendor';
            }
            // Remaining node_modules will be handled by Vite's default chunking
          }
          // App-specific chunking can be added here if needed
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  }
}));
