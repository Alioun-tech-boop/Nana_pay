import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, InlineAlert, OTPInput, Text, useToast } from '../../../design-system'
import { isAppError, toUserMessage } from '../../../lib/errors'
import { authService } from '../../../services/authService'
import { AuthStage } from '../components/AuthStage'
import styles from './authPages.module.css'

/**
 * Vérification du compte (route `/verify`), atteinte après l'inscription.
 *
 * Le backend décide si le code est valide : l'écran ne fait que transmettre et
 * afficher le résultat. Tant que `POST /auth/verify` n'est pas implémenté, on
 * l'annonce clairement au lieu d'exposer une erreur technique (AGENTS.md §21).
 */
export function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const stateIdentifier =
    typeof location.state === 'object' && location.state && 'identifier' in location.state
      ? String((location.state as { identifier: string }).identifier)
      : ''

  const [identifier, setIdentifier] = useState(stateIdentifier)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    if (identifier.trim().length === 0) {
      setError('Merci de renseigner votre e-mail ou numéro de téléphone.')
      return
    }
    if (code.length < 6) {
      setError('Merci de saisir le code complet de 6 chiffres.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await authService.verify({ identifier: identifier.trim(), code })
      setVerified(true)
      toast({
        tone: 'success',
        title: 'Compte vérifié',
        description: 'Vous pouvez maintenant vous connecter.',
      })
    } catch (caught) {
      // La vérification par code n'est pas encore disponible côté backend
      // (pas de table OTP ni de canal d'envoi). On l'annonce clairement au lieu
      // d'afficher « Cannot POST /api/auth/verify » (AGENTS.md §21 et §24).
      if (isAppError(caught) && (caught.status === 404 || caught.status === 501)) {
        setUnavailable(true)
      } else {
        setError(toUserMessage(caught))
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthStage title="Vérification">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {verified ? (
          <InlineAlert tone="success" title="Votre compte est vérifié.">
            <div className={styles.verifiedActions}>
              <Text muted>Connectez-vous pour commencer votre première épargne.</Text>
              <Button onClick={() => navigate('/login')}>Se connecter</Button>
            </div>
          </InlineAlert>
        ) : (
          <>
            {unavailable ? (
              <InlineAlert tone="warning" title="Vérification par code bientôt disponible">
                <div className={styles.verifiedActions}>
                  <Text muted>
                    L’envoi et le contrôle du code ne sont pas encore activés sur cette
                    version. Votre compte existe déjà : vous pouvez vous connecter dès
                    maintenant.
                  </Text>
                  <Button onClick={() => navigate('/login')}>Se connecter</Button>
                </div>
              </InlineAlert>
            ) : (
              <>
                {error ? <InlineAlert tone="danger" title={error} /> : null}
                {!identifier ? (
                  <input
                    className={styles.field}
                    aria-label="E-mail ou numéro de téléphone utilisé à l’inscription"
                    type="text"
                    placeholder="E-mail ou numéro de téléphone"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    required
                  />
                ) : (
                  <Text muted>
                    Un code de vérification a été envoyé à <strong>{identifier}</strong>.
                  </Text>
                )}
                <OTPInput
                  label="Code de vérification"
                  length={6}
                  value={code}
                  onChange={setCode}
                />
                <Button type="submit" fullWidth size="lg" loading={submitting}>
                  Vérifier mon compte
                </Button>
              </>
            )}
            <p className={styles.centered}>
              <Link to="/register" className={styles.linkSubtle}>
                Modifier mes informations
              </Link>
            </p>
          </>
        )}
      </form>
    </AuthStage>
  )
}
