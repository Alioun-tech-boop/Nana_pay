import { api } from '../api'
import { readStoredRefreshToken, saveRefreshToken } from '../lib/session-storage'
import type { LoginRequest, LoginResponse, RefreshResponse, RegisterRequest, RegisterResponse, Session, User, VerifyRequest, VerifyResponse } from '../types'

export interface LoginInput extends LoginRequest {}

/**
 * Échange de restauration en cours, partagé entre les appelants concurrents.
 * Voir `restoreSession` : le refresh token est à usage unique côté backend.
 */
let restoreInFlight: Promise<Session | null> | null = null

/** Réservé aux tests : oublie un échange en cours entre deux fichiers. */
export function resetAuthServiceForTests(): void {
  restoreInFlight = null
}

export interface RegisterInput {
  firstName: string
  lastName: string
  birthDate: string
  contact: string
  contactType: 'email' | 'phone'
  email: string
  phone: string
  password: string
}

export const authService = {
  login(input: LoginInput): Promise<LoginResponse> {
    return api.request<LoginResponse>({
      method: 'POST',
      path: '/auth/login',
      body: input,
      auth: false,
    })
  },

  register(input: RegisterInput): Promise<RegisterResponse> {
    return api.request<RegisterResponse>({
      method: 'POST',
      path: '/auth/register',
      body: {
        ...input,
        fullName: `${input.firstName} ${input.lastName}`.trim(),
      } satisfies RegisterRequest,
      auth: false,
    })
  },

  verify(input: VerifyRequest): Promise<VerifyResponse> {
    return api.request<VerifyResponse>({
      method: 'POST',
      path: '/auth/verify',
      body: input,
      auth: false,
    })
  },

  refresh(refreshToken: string): Promise<RefreshResponse> {
    return api.request<RefreshResponse>({
      method: 'POST',
      path: '/auth/refresh',
      body: { refreshToken },
      auth: false,
    })
  },

  logout(refreshToken: string): Promise<void> {
    return api.request<void>({
      method: 'POST',
      path: '/auth/logout',
      body: { refreshToken },
      auth: false,
    })
  },

  /**
   * Profil de l'utilisateur connecté.
   *
   * `API-CONTRACT.md` §3 : le backend renvoie `{ user }`, pas l'utilisateur nu —
   * comme `login` et `refresh`. On déballe donc l'enveloppe ici, au seul endroit
   * qui connaît la forme du transport : les appelants manipulent un `User`.
   *
   * Ne pas le faire laissait `session.user` valoir `{ user: {...} }` après un
   * rechargement : `role` devenait `undefined` et toutes les gardes de rôle
   * (`RequireRole`) échouaient silencieusement.
   */
  async me(): Promise<User> {
    const response = await api.request<{ user: User }>({
      method: 'GET',
      path: '/auth/me',
      // La restauration de session au chargement ne doit PAS déclencher le
      // gestionnaire global d'échec d'authentification : sans jeton (visiteur
      // non connecté) le 401 est normal et provoquerait une redirection vers
      // /login avec « Session expirée » (voir restoreSession).
      auth: false,
    })
    return response.user
  },

  /**
   * Rouvre une session à partir du refresh token stocké.
   *
   * Le backend renvoie un refresh token OPAQUE, pas un JWT : il ne peut pas être
   * transmis tel quel à `/auth/me` (Bearer). Seul `POST /auth/refresh` l'accepte.
   * On échange donc le refresh token contre un access token, puis on lit le
   * profil. Aucun secret n'est décodé ni interprété côté navigateur.
   *
   * Le refresh token est à USAGE UNIQUE côté backend : chaque appel en révoque le
   * précédent. Un second appel concurrent avec le même jeton échoue donc en 401.
   * Or `StrictMode` monte les effets deux fois en développement. Pour ne jamais
   * rejouer un jeton déjà consommé, l'appel en cours est mémorisé et partagé.
   *
   * L'access token est transmis à `/auth/me` via l'en-tête `Authorization`. Il
   * est donc impératif de l'installer AVANT l'appel — `tokenProvider` est la
   * seule source de vérité du jeton pour le client HTTP, et il lit une valeur
   * déjà installée, pas une valeur de retour.
   *
   * `onExpired` n'est appelé que si un refresh token EXISTE mais a été refusé :
   * c'est le seul cas où la session a réellement expiré. Sans refresh token, le
   * visiteur est simplement anonyme.
   */
  async restoreSession(onExpired?: (requestId: string) => void): Promise<Session | null> {
    // Un seul échange à la fois : le jeton est à usage unique.
    if (restoreInFlight) return restoreInFlight

    const refreshToken = readStoredRefreshToken()
    if (!refreshToken) return null

    restoreInFlight = (async () => {
      try {
        const refreshed = await authService.refresh(refreshToken)
        // Le jeton est rotationné immédiatement : si un autre appel survient, il
        // repartira du jeton valide et non de celui qu'on vient de consommer.
        saveRefreshToken(refreshed.refreshToken)

        const previousToken = api.currentAccessToken()
        api.setRestoredAccessToken(refreshed.accessToken)
        let user: User
        try {
          user = await authService.me()
        } finally {
          api.setRestoredAccessToken(previousToken)
        }
        return { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken, user }
      } catch {
        onExpired?.('')
        return null
      } finally {
        restoreInFlight = null
      }
    })()

    return restoreInFlight
  },
}