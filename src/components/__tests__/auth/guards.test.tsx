import { render, screen } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { RequireAuth } from '../../../components/auth/RequireAuth'
import { RequireRole } from '../../../components/auth/RequireRole'
import { SessionProvider } from '../../../stores/session'
import type { SessionContextValue } from '../../../stores/session'
import type { Session, UserRole } from '../../../types'

const mockSession = vi.hoisted(() => {
  return { getValue: (): SessionContextValue => ({ status: 'unauthenticated', session: null, login: async () => {}, logout: async () => {}, clearSession: () => {} }) }
})

vi.mock('../../../stores/session', async () => {
  const React = await import('react')
  const ctx = React.createContext<SessionContextValue | null>(null)
  return {
    SessionProvider: ({ value, children }: { value: SessionContextValue; children: ReactNode }) =>
      React.createElement(ctx.Provider, { value }, children),
    useSession: () => {
      const value = React.useContext(ctx)
      if (!value) throw new Error('useSession called outside SessionProvider')
      return value
    },
  }
})

function buildSession(role: UserRole): SessionContextValue {
  const user = {
    id: 'usr_01TEST',
    role,
    fullName: 'Test User',
    email: 'test@nanopay.demo',
    phone: '+225 07 00 00 00 00',
    merchantId: role === 'MERCHANT' ? 'mer_01HPLUS1' : null,
    permissions: role === 'CLIENT' ? [] : [`${role.toLowerCase()}:read`],
  } as Session['user']
  return {
    status: 'authenticated',
    session: { accessToken: 'access', refreshToken: 'refresh', user },
    login: async () => {},
    logout: async () => {},
    clearSession: () => {},
  }
}

function GuardRoutes() {
  return (
    <Routes>
      <Route
        path="/protected"
        element={
          <RequireAuth>
            <RequireRole roles={['CLIENT']} fallback={<div>Access Denied</div>}>
              <div>Client Content</div>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/merchant-only"
        element={
          <RequireAuth>
            <RequireRole roles={['MERCHANT']} fallback={<div>Access Denied</div>}>
              <div>Merchant Content</div>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>
  )
}

function renderGuarded(value: SessionContextValue, route: string) {
  window.history.pushState({}, '', route)
  const MockProvider = SessionProvider as unknown as (props: { value: SessionContextValue; children: ReactNode }) => ReactNode
  return render(
    <BrowserRouter>
      <MockProvider value={value}>
        <GuardRoutes />
      </MockProvider>
    </BrowserRouter>,
  )
}

describe('auth guards', () => {
  it('redirects to /login when unauthenticated', async () => {
    renderGuarded(mockSession.getValue(), '/protected')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('shows client content when client is authenticated', async () => {
    renderGuarded(buildSession('CLIENT'), '/protected')
    expect(await screen.findByText('Client Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })

  it('shows fallback when client accesses merchant-only route', async () => {
    renderGuarded(buildSession('CLIENT'), '/merchant-only')
    expect(await screen.findByText('Access Denied')).toBeInTheDocument()
  })

  it('shows merchant content for merchant role', async () => {
    renderGuarded(buildSession('MERCHANT'), '/merchant-only')
    expect(await screen.findByText('Merchant Content')).toBeInTheDocument()
  })
})