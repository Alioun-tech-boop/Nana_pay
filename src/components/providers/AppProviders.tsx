import type { ReactNode } from 'react'
import { ThemeProvider, ToastProvider } from '../../design-system'
import { SessionProvider } from '../../stores/session'
import { CartProvider } from '../../stores/cart'

export interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider lang="fr">
      <ToastProvider>
        <SessionProvider>
          <CartProvider>{children}</CartProvider>
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}