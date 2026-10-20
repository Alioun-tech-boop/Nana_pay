import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api } from '../../api'
import type { Transport } from '../../api/transport'
import { authService, resetAuthServiceForTests } from '../authService'
import { clearStoredRefreshToken, readStoredRefreshToken, saveRefreshToken } from '../../lib/session-storage'
import type { RefreshResponse, User } from '../../types'

/**
 * La restauration de session est le point où un utilisateur connecté perdait sa
 * session à chaque rechargement. Ces tests verrouillent le contrat :
 * - aucun refresh token stocké  -> aucune requête, aucun 401 ;
 * - refresh token valide        -> session rouverte, jeton réellement envoyé ;
 * - refresh token refusé        -> une seule fois, sans 401 parasite ;
 * - appels concurrents          -> un seul échange (le jeton est à usage unique).
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

interface Call {
  method: string
  path: string
  authorization: string | undefined
  body: unknown
}

function recordingTransport(
  handler: (call: Call) => { status: number; data: unknown },
): { transport: Transport; calls: Call[] } {
  const calls: Call[] = []
  return {
    calls,
    transport: {
      async send(request) {
        const call: Call = {
          method: request.method,
          path: request.path,
          authorization: request.headers['Authorization'],
          body: request.body,
        }
        calls.push(call)
        return handler(call)
      },
    },
  }
}

describe('authService.restoreSession', () => {
  beforeEach(() => {
    api.resetForTests()
    resetAuthServiceForTests()
    clearStoredRefreshToken()
  })

  afterEach(() => {
    api.resetForTests()
    resetAuthServiceForTests()
    clearStoredRefreshToken()
    vi.restoreAllMocks()
  })

  it('issues no request at all when no refresh token is stored', async () => {
    const { transport, calls } = recordingTransport(() => ({ status: 200, data: USER }))
    api.setTransportForTests(transport)

    await expect(authService.restoreSession()).resolves.toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('reopens the session and uses the new access token for /auth/me', async () => {
    saveRefreshToken('stored-refresh-token')

    const { transport, calls } = recordingTransport((call) => {
      if (call.path === '/auth/refresh') {
        return {
          status: 200,
          data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' } satisfies RefreshResponse,
        }
      }
      if (call.authorization === 'Bearer fresh-access') return { status: 200, data: { user: USER } }
      return { status: 401, data: { code: 'UNAUTHORIZED', title: 'Non authentifié', detail: '' } }
    })
    api.setTransportForTests(transport)

    const session = await authService.restoreSession()

    expect(session).toEqual({
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
      user: USER,
    })
    expect(calls).toEqual([
      { method: 'POST', path: '/auth/refresh', authorization: undefined, body: { refreshToken: 'stored-refresh-token' } },
      { method: 'GET', path: '/auth/me', authorization: 'Bearer fresh-access', body: undefined },
    ])
    // Le jeton rotationné remplace immédiatement l'ancien : un rechargement ou un
    // appel concurrent ne doit jamais rejouer un jeton déjà consommé.
    expect(readStoredRefreshToken()).toBe('fresh-refresh')
  })

  it('issues a single refresh for concurrent callers (single-use token)', async () => {
    saveRefreshToken('stored-refresh-token')

    // Le backend révoque l'ancien jeton dès qu'il en émet un nouveau : rejouer le
    // même jeton doit échouer, comme en production.
    let consumed = false
    const { transport, calls } = recordingTransport((call) => {
      if (call.path === '/auth/refresh') {
        const body = call.body as { refreshToken?: string } | undefined
        if (body?.refreshToken !== 'stored-refresh-token' || consumed) {
          return { status: 401, data: { code: 'UNAUTHORIZED', title: 'Jeton révoqué', detail: '' } }
        }
        consumed = true
        return {
          status: 200,
          data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' } satisfies RefreshResponse,
        }
      }
      if (call.authorization === 'Bearer fresh-access') return { status: 200, data: { user: USER } }
      return { status: 401, data: { code: 'UNAUTHORIZED', title: 'Non authentifié', detail: '' } }
    })
    api.setTransportForTests(transport)

    const [first, second] = await Promise.all([
      authService.restoreSession(),
      authService.restoreSession(),
    ])

    expect(first).toEqual({ accessToken: 'fresh-access', refreshToken: 'fresh-refresh', user: USER })
    expect(second).toEqual(first)
    expect(calls.filter((c) => c.path === '/auth/refresh')).toHaveLength(1)
  })

  it('reports expiry once when the stored refresh token is refused', async () => {
    saveRefreshToken('stale-refresh-token')

    const { transport, calls } = recordingTransport(() => ({
      status: 401,
      data: { code: 'UNAUTHORIZED', title: 'Session invalide', detail: '' },
    }))
    api.setTransportForTests(transport)

    const onExpired = vi.fn()
    await expect(authService.restoreSession(onExpired)).resolves.toBeNull()

    expect(onExpired).toHaveBeenCalledTimes(1)
    expect(calls).toHaveLength(1)
  })

  it('does not leave an unusable refresh token behind', async () => {
    saveRefreshToken('some-refresh-token')
    expect(readStoredRefreshToken()).toBe('some-refresh-token')

    const { transport } = recordingTransport(() => ({
      status: 500,
      data: { code: 'INTERNAL', title: 'Erreur', detail: '' },
    }))
    api.setTransportForTests(transport)

    await expect(authService.restoreSession()).resolves.toBeNull()
    // Le token est toujours stocké : c'est à l'appelant (clearSession) de
    // décider de l'effacer, sinon une panne réseau déconnecterait l'utilisateur.
    expect(readStoredRefreshToken()).toBe('some-refresh-token')
  })
})

describe('authService.me', () => {
  beforeEach(() => {
    api.resetForTests()
    resetAuthServiceForTests()
    clearStoredRefreshToken()
  })

  afterEach(() => {
    api.resetForTests()
    resetAuthServiceForTests()
    clearStoredRefreshToken()
    vi.restoreAllMocks()
  })

  /**
   * `API-CONTRACT.md` §3 : `/auth/me` répond `{ user }`, comme `login` et
   * `refresh`. Ne pas déballer l'enveloppe faisait valoir à `session.user` la
   * valeur `{ user: {...} }` après un rechargement : `role` devenait `undefined`
   * et toutes les gardes de rôle échouaient sans message.
   */
  it('unwraps the { user } envelope so callers receive a plain User', async () => {
    const { transport } = recordingTransport(() => ({ status: 200, data: { user: USER } }))
    api.setTransportForTests(transport)

    const user = await authService.me()

    expect(user).toEqual(USER)
    expect(user.role).toBe('CLIENT')
    expect(user.permissions).toEqual([])
    expect((user as unknown as { user?: unknown }).user).toBeUndefined()
  })

  it('does not silently invent a user when the backend refuses', async () => {
    const { transport } = recordingTransport(() => ({
      status: 401,
      data: { code: 'UNAUTHORIZED', title: 'Non authentifié', detail: '' },
    }))
    api.setTransportForTests(transport)

    await expect(authService.me()).rejects.toThrow()
  })
})
