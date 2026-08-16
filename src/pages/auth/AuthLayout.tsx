import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Ametista Conversões" className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6">{children}</div>

        {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  )
}
