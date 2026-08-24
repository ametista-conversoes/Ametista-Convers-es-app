import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: {
        // Injeta o listener de notificação push (public/push-worker.js)
        // dentro do sw.js gerado — evita trocar de estratégia pra
        // injectManifest, que precisaria reescrever à mão o
        // pré-cache que já funciona em produção desde a Fase 10b.
        importScripts: ['push-worker.js'],
      },
      manifest: {
        name: 'Ametista Conversões',
        short_name: 'Ametista',
        description: 'Plataforma de gestão para agências de marketing de performance',
        lang: 'pt-BR',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Só os testes unitários dentro de src/ — os specs em tests/e2e usam
    // o test runner do Playwright (@playwright/test), não o do Vitest, e
    // por padrão o Vitest também pegaria arquivos "*.spec.ts".
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
