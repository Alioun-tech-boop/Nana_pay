import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { api } from '../../api'
import type { Transport } from '../../api/transport'
import { authService, resetAuthServiceForTests } from '../authService'
import type { User } from '../../types'

const USER: User = {
  id: 'user-1', role: 'CLIENT', fullName: 'Awa Diop', email: 'awa@nanapay.test', phone: '', merchantId: null, permissions: [],
}

describe('authService session restoration', () => {
  beforeEach(() => { api.resetForTests(); resetAuthServiceForTests() })
  afterEach(() => { api.resetForTests(); resetAuthServiceForTests() })

  it('uses the httpOnly refresh-cookie flow and never sends a refresh token body', async () => {
    const calls: Array<{ path: string; body: unknown; authorization?: string }> = []
    const transport: Transport = {
      async send(request) {
        calls.push({ path: request.path, body: request.body, authorization: request.headers.Authorization })
        if (request.path === '/auth/refresh') return { status: 200, data: { accessToken: 'fresh-access' } }
        return { status: 200, data: { user: USER } }
      },
    }
    api.setTransportForTests(transport)

    await expect(authService.restoreSession()).resolves.toEqual({ accessToken: 'fresh-access', user: USER })
    expect(calls).toEqual([
      { path: '/auth/refresh', body: undefined, authorization: undefined },
      { path: '/auth/me', body: undefined, authorization: 'Bearer fresh-access' },
    ])
  })

  it('returns anonymous when no refresh cookie exists', async () => {
    api.setTransportForTests({ async send() { return { status: 401, data: {} } } })
    await expect(authService.restoreSession()).resolves.toBeNull()
  })
})
