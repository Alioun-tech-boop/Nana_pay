import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { api } from '../../../api'
import { ToastProvider } from '../../../design-system'
import { setConfigForTests } from '../../../lib/config'
import { SessionProvider, useSession } from '../SessionContext'
import type { User } from '../../../types'

const USER: User = {
  id: 'user-1', role: 'CLIENT', fullName: 'Awa Diop', email: 'awa@nanapay.test', phone: '', merchantId: null, permissions: [],
}

function Probe() {
  const { status, session } = useSession()
  return <><span data-testid="status">{status}</span><span data-testid="user">{session?.user.fullName ?? ''}</span></>
}

describe('session restoration', () => {
  beforeEach(() => { setConfigForTests({ apiMode: 'real' }); api.resetForTests() })
  afterEach(() => { setConfigForTests(null); api.resetForTests() })

  it('restores an authenticated session through the httpOnly-cookie refresh endpoint', async () => {
    const calls: Array<{ path: string; authorization?: string }> = []
    api.setTransportForTests({
      async send(request) {
        calls.push({ path: request.path, authorization: request.headers['Authorization'] })
        if (request.path === '/auth/refresh') return { status: 200, data: { accessToken: 'fresh-access' } }
        if (request.path === '/auth/me') return { status: 200, data: { user: USER } }
        return { status: 401, data: {} }
      },
    })
    render(<MemoryRouter><ToastProvider><SessionProvider><Probe /></SessionProvider></ToastProvider></MemoryRouter>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('user')).toHaveTextContent('Awa Diop')

    // L'access token doit être installé AVANT `/auth/me` : sans cela, la
    // restauration rejouait le bug de session perdue (refresh 200, me 401).
    // Aucun refresh token ne doit être envoyé dans le corps : il vit dans un
    // cookie httpOnly, jamais dans le JavaScript.
    expect(calls).toEqual([
      { path: '/auth/refresh', authorization: undefined },
      { path: '/auth/me', authorization: 'Bearer fresh-access' },
    ])
  })

  it('stays anonymous when the refresh cookie is absent (401)', async () => {
    api.setTransportForTests({
      async send() {
        return { status: 401, data: {} }
      },
    })
    render(<MemoryRouter><ToastProvider><SessionProvider><Probe /></SessionProvider></ToastProvider></MemoryRouter>)
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    expect(screen.getByTestId('user')).toHaveTextContent('')
  })
})
