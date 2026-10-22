import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import type { RefreshOutcome } from '../../api/client'
import { useToast } from '../../design-system'
import { isMockMode } from '../../lib/config'
import { authService, type LoginInput } from '../../services/authService'
import type { Session } from '../../types'

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface SessionContextValue {
  session: Session | null
  status: SessionStatus
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
}

const EMPTY: SessionContextValue = {
  session: null,
  status: 'unauthenticated',
  login: async () => {},
  logout: async () => {},
  clearSession: () => {},
}

const SessionContext = createContext<SessionContextValue>(EMPTY)

function buildSession(accessToken: string, user: Session['user']): Session {
  return { accessToken, user }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SessionStatus>('idle')
  const tokenRef = useRef<string | null>(null)
  const refreshInFlightRef = useRef<Promise<RefreshOutcome> | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const clearSession = useCallback(() => {
    tokenRef.current = null
    refreshInFlightRef.current = null
    api.clearCache()
    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const refreshSession = useCallback(async (): Promise<RefreshOutcome> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current

    refreshInFlightRef.current = (async () => {
      if (isMockMode()) return 'failed'
      try {
        const response = await authService.refresh()
        tokenRef.current = response.accessToken
        setSession((current) => (current ? buildSession(response.accessToken, current.user) : current))
        return 'refreshed'
      } catch {
        return 'failed'
      } finally {
        refreshInFlightRef.current = null
      }
    })()

    return refreshInFlightRef.current
  }, [])

  const handleAuthenticationFailure = useCallback(() => {
    clearSession()
    navigate('/login', { state: { sessionExpired: true }, replace: true })
    toast({
      tone: 'danger',
      title: 'Session expirée',
      description: 'Votre session a expiré. Veuillez vous reconnecter.',
    })
  }, [clearSession, navigate, toast])

  useEffect(() => {
    api.setTokenProvider(() => tokenRef.current)
    api.setRefreshProvider(refreshSession)
    api.setAuthenticationFailureHandler(handleAuthenticationFailure)
  }, [refreshSession, handleAuthenticationFailure])

  useEffect(() => {
    let cancelled = false

    if (isMockMode()) {
      setStatus('unauthenticated')
      return () => {
        cancelled = true
      }
    }

    // Le refresh token est un cookie httpOnly. Une tentative de restauration est
    // donc nécessaire ; un 401 signifie simplement qu'aucune session n'est active.
    setStatus('loading')
    authService
      .restoreSession()
      .then((restored) => {
        if (cancelled) return
        if (!restored) {
          setStatus('unauthenticated')
          return
        }
        tokenRef.current = restored.accessToken
        // Les réponses obtenues AVANT l'établissement de la session ont pu être
        // mises en cache anonymement (le catalogue public accepte les requêtes
        // sans jeton). Les rejouer après connexion renverrait des données
        // d'avant-connexion : on vide le cache à la restauration.
        api.clearCache()
        setSession(restored)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('unauthenticated')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    setStatus('loading')
    try {
      const response = await authService.login(input)
      api.clearCache()
      tokenRef.current = response.accessToken
      setSession(response)
      setStatus('authenticated')
    } catch (error) {
      setStatus('unauthenticated')
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setStatus('loading')
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<SessionContextValue>(
    () => ({ session, status, login, logout, clearSession }),
    [session, status, login, logout, clearSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext)
}
