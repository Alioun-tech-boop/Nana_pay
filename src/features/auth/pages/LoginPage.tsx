import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, InlineAlert, Input, Text } from '../../../design-system'
import { toUserMessage } from '../../../lib/errors'
import { safeRedirectPath } from '../../../lib/redirect'
import { useSession } from '../../../stores/session'
import { AuthLayout } from '../components/AuthLayout'
import styles from './authPages.module.css'

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
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre espace client NanaPay."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {sessionExpired ? (
          <InlineAlert tone="warning" title="Votre session a expiré">
            Veuillez vous reconnecter pour continuer.
          </InlineAlert>
        ) : null}
        {error ? <InlineAlert tone="danger" title={error} /> : null}
        <Input
          label="E-mail ou numéro de téléphone"
          type="text"
          autoComplete="username"
          placeholder="ada.doumbia@example.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Se connecter
        </Button>
        <div className={styles.divider}>
          <span>ou</span>
        </div>
        <Link to="/register" className={styles.secondaryLink}>
          Créer un compte client
        </Link>
        <InlineAlert tone="info">
          <Text muted>
            Démo : <code className={styles.demoCode}>ada.doumbia@example.com</code>,{' '}
            <code className={styles.demoCode}>commercant@NanaPay.demo</code>,{' '}
            <code className={styles.demoCode}>banque@NanaPay.demo</code> ou{' '}
            <code className={styles.demoCode}>admin@NanaPay.demo</code> — mot de passe{' '}
            <code className={styles.demoCode}>correct</code>.
          </Text>
        </InlineAlert>
      </form>
    </AuthLayout>
  )
}
