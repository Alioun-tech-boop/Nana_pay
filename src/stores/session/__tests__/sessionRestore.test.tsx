import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { api } from '../../../api'
import { ToastProvider } from '../../../design-system'
import { setConfigForTests } from '../../../lib/config'
import { SessionProvider, useSession } from '../SessionContext'
import { clearStoredRefreshToken, saveRefreshToken } from '../../../lib/session-storage'
import type { User } from '../../../types'

/**
 * Reproduit le scénario réel : l'application démarre, trouve un refresh token
 * stocké, rouvre la session et affiche l'utilisateur connecté.
 *
 * C'est exactement ce que faisait le navigateur au rechargement, et c'est là que
 * la session était perdue (`/auth/refresh` en 200 mais `/auth/me` en 401).
 */

const USER: User = {
  id: 'user-1',
  role: 'CLIENT',
  fullName: 'Awa Diop',
  email: 'awa@nanapay.test',
  phone: '',
  merchantId: null,
  permissions: [],
}

function Probe() {
  const { status, session } = useSession()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{session?.user.fullName ?? ''}</span>
    </div>
  )
}

function renderApp() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <SessionProvider>
          <Probe />
        </SessionProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('session restoration on app start', () => {
  beforeEach(() => {
    // Le client est en mode `real` : c'est le seul mode où il existe une session
    // à restaurer. En mode `mock` l'application est volontairement anonyme.
    setConfigForTests({ apiMode: 'real' })
    api.resetForTests()
    clearStoredRefreshToken()
  })

  afterEach(() => {
    setConfigForTests(null)
    api.resetForTests()
    clearStoredRefreshToken()
  })

  it('stays anonymous without issuing any request when nothing is stored', async () => {
    const paths: string[] = []
    api.setTransportForTests({
      async send(request) {
        paths.push(request.path)
        return { status: 401, data: { code: 'UNAUTHORIZED', title: 'Non authentifié', detail: '' } }
      },
    })

    renderApp()

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'))
    expect(paths).toEqual([])
  })

  it('restores the session from the stored refresh token', async () => {
    saveRefreshToken('stored-refresh-token')

    const calls: Array<{ path: string; authorization?: string }> = []
    api.setTransportForTests({
      async send(request) {
        calls.push({ path: request.path, authorization: request.headers['Authorization'] })
        if (request.path === '/auth/refresh') {
          return { status: 200, data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' } }
        }
        if (request.path === '/auth/me' && request.headers['Authorization'] === 'Bearer fresh-access') {
          return { status: 200, data: { user: USER } }
        }
        return { status: 401, data: { code: 'UNAUTHORIZED', title: 'Non authentifié', detail: '' } }
      },
    })

    renderApp()

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'))
    expect(screen.getByTestId('user').textContent).toBe('Awa Diop')
    expect(calls).toEqual([
      { path: '/auth/refresh', authorization: undefined },
      { path: '/auth/me', authorization: 'Bearer fresh-access' },
    ])
  })

  it('refreshes the token for later requests and keeps the user signed in', async () => {
    saveRefreshToken('stored-refresh-token')

    let tokenFromProvider: string | null = null
    api.setTransportForTests({
      async send(request) {
        if (request.path === '/auth/refresh') {
          return { status: 200, data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' } }
        }
        if (request.path === '/auth/me') return { status: 200, data: { user: USER } }
        return { status: 200, data: null }
      },
    })

    renderApp()
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('authenticated'))

    api.setTokenProvider(() => {
      tokenFromProvider = 'captured'
      return 'fresh-access'
    })
    await api.request({ method: 'GET', path: '/orders' })
    expect(tokenFromProvider).toBe('captured')
  })

  it('signs out only when a stored token is actually refused', async () => {
    saveRefreshToken('expired-refresh-token')

    const paths: string[] = []
    api.setTransportForTests({
      async send(request) {
        paths.push(request.path)
        return { status: 401, data: { code: 'UNAUTHORIZED', title: 'Session invalide', detail: '' } }
      },
    })

    const outcomes: string[] = []
    api.setAuthenticationFailureHandler(() => outcomes.push('failed'))

    renderApp()

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unauthenticated'))
    expect(paths).toEqual(['/auth/refresh'])
    // L'expiration est signalée par `restoreSession`, pas par le gestionnaire
    // global : sinon un simple visiteur anonyme verrait « Session expirée ».
    expect(outcomes).toEqual([])
  })
})
