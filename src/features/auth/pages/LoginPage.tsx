import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, InlineAlert } from '../../../design-system'
import { toUserMessage } from '../../../lib/errors'
import { safeRedirectPath } from '../../../lib/redirect'
import { useSession } from '../../../stores/session'
import { AuthStage } from '../components/AuthStage'
import styles from './authPages.module.css'

/**
 * Connexion (route `/login`).
 *
 * Cadre sombre cohérent avec l'écran d'ouverture. Le backend reste seul juge :
 * identifiants, statut du compte et permissions ne sont jamais décidés ici.
 *
 * Aucun identifiant de démonstration n'est affiché : le code frontend est
 * public (AGENTS.md §29).
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useSession()

  const rawFrom = typeof location.state === 'object' && location.state && 'from' in location.state
    ? (location.state as { from: unknown }).from
    : null
  const from = safeRedirectPath(rawFrom, '/dashboard')

  const sessionExpired =
    typeof location.state === 'object' && location.state && (location.state as { sessionExpired?: unknown }).sessionExpired === true

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await login({ identifier: identifier.trim(), password })
      navigate(from, { replace: true })
    } catch (caught) {
      setError(toUserMessage(caught))
      setSubmitting(false)
    }
  }

  return (
    <AuthStage title="Connexion">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {sessionExpired ? (
          <InlineAlert tone="warning" title="Votre session a expiré">
            Veuillez vous reconnecter pour continuer.
          </InlineAlert>
        ) : null}
        {error ? <InlineAlert tone="danger" title={error} /> : null}
        <input
          className={styles.field}
          aria-label="E-mail ou numéro de téléphone"
          type="text"
          autoComplete="username"
          placeholder="E-mail ou numéro de téléphone"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
        <input
          className={styles.field}
          aria-label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Se connecter
        </Button>
        <p className={styles.centered}>
          <Link to="/register" className={styles.linkSubtle}>
            Créer un compte
          </Link>
        </p>
      </form>
    </AuthStage>
  )
}
