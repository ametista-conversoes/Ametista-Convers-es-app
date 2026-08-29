import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { logClientError } from '@/lib/error-logging'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Pega qualquer erro de render em qualquer lugar da árvore do React
 * (Fase 21.1) — sem isso, um erro assim quebra a tela inteira em
 * branco sem deixar rastro nenhum. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logClientError(error, { componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <p className="text-lg font-semibold text-foreground">Algo deu errado.</p>
          <p className="text-sm text-muted-foreground">Recarregue a página para continuar.</p>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </div>
      )
    }
    return this.props.children
  }
}
