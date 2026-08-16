import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
