import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { KpiPopoverProvider } from '@/contexts/KpiPopoverContext'
import { logClientError } from '@/lib/error-logging'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// Fase 21.1: pega erro fora do ciclo de render do React (o
// ErrorBoundary só cobre erro de render) — script quebrado, promise
// rejeitada sem catch, etc.
window.addEventListener('error', (event) => {
  logClientError(event.error ?? event.message)
})
window.addEventListener('unhandledrejection', (event) => {
  logClientError(event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <KpiPopoverProvider>
              <App />
              <Toaster />
            </KpiPopoverProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
