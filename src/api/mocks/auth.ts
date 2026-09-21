import { mockPendingUser, mockUser } from './db'
import { mockBankUser, mockAdminUser, mockMerchantUser } from './proDb'
import { badRequest, bodyOf, created, ok, unauthorized } from './helpers'
import type { MockContext, MockRoute } from './types'

const DEMO_USERS = [mockUser, mockMerchantUser, mockBankUser, mockAdminUser]

const ACCESS_TOKEN = 'mock-access-token'
const REFRESH_TOKEN = 'mock-refresh-token'
let pendingIdentifier = mockPendingUser.email

function bearerToken(ctx: MockContext): string {
  const header = ctx.headers['Authorization'] ?? ctx.headers['authorization'] ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
}

function hasAccessToken(ctx: MockContext): boolean {
  return bearerToken(ctx) === ACCESS_TOKEN
}

function hasValidSessionToken(ctx: MockContext): boolean {
  if (hasAccessToken(ctx)) return true
  const body = bodyOf(ctx)
  return body.refreshToken === REFRESH_TOKEN
}

export const authRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: '/auth/login',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const identifier = typeof body.identifier === 'string' ? body.identifier : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const user = DEMO_USERS.find(
        (candidate) => candidate.email === identifier || candidate.phone === identifier,
      )
      if (!user) {
        return unauthorized('Identifiants incorrects.')
      }
      if (password !== 'correct') {
        return unauthorized('Identifiants incorrects.')
      }
      return ok({
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        user,
      })
    },
  },
  {
    method: 'POST',
    pattern: '/auth/register',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if ((!email && !phone) || !fullName || !password) {
        return badRequest('Champs incomplets.', 'Merci de renseigner toutes les informations.')
      }
      pendingIdentifier = email || phone
      return created({
        id: 'usr_01HREG',
        fullName,
        email,
        phone,
        status: 'PENDING_VERIFICATION' as const,
      })
    },
  },
  {
    method: 'POST',
    pattern: '/auth/verify',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      const identifier = typeof body.identifier === 'string'
        ? body.identifier.trim().toLowerCase()
        : typeof body.email === 'string'
          ? body.email.trim().toLowerCase()
          : ''
      const code = typeof body.code === 'string' ? body.code : ''
      if (identifier !== pendingIdentifier && identifier !== mockPendingUser.email && identifier !== mockPendingUser.phone) {
        return badRequest('Compte introuvable.', 'Aucun compte en attente correspond à cet identifiant.')
      }
      if (code !== '000000') {
        return badRequest('Code invalide.', 'Le code de vérification saisi est incorrect.')
      }
      return ok({ verified: true, id: 'usr_01HREG' })
    },
  },
  {
    method: 'POST',
    pattern: '/auth/refresh',
    handler: (ctx) => {
      const body = bodyOf(ctx)
      if (body.refreshToken !== REFRESH_TOKEN) {
        return unauthorized('Votre session a expiré. Veuillez vous reconnecter.')
      }
      return ok({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN })
    },
  },
  {
    method: 'POST',
    pattern: '/auth/logout',
    handler: (ctx) => {
      if (!hasValidSessionToken(ctx)) {
        return unauthorized('Session introuvable.')
      }
      return { status: 204 }
    },
  },
  {
    method: 'GET',
    pattern: '/auth/me',
    handler: (ctx) => {
      if (!hasAccessToken(ctx)) {
        return unauthorized('Non authentifié.')
      }
      return ok(mockUser)
    },
  },
]