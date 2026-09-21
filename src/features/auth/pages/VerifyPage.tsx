import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, InlineAlert, Input, OTPInput, Text } from '../../../design-system'
import { toUserMessage } from '../../../lib/errors'
import { authService } from '../../../services/authService'
import { useToast } from '../../../design-system'
import { AuthLayout } from '../components/AuthLayout'
import styles from './authPages.module.css'

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
      setError(toUserMessage(caught))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Vérification"
      subtitle="Étape 4 sur 4 · Saisissez le code reçu pour activer votre compte."
    >
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
            {error ? <InlineAlert tone="danger" title={error} /> : null}
            {!identifier ? (
              <Input
                label="E-mail ou numéro de téléphone utilisé à l’inscription"
                type="text"
                placeholder="vous@exemple.com ou +225..."
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
              />
            ) : (
              <InlineAlert tone="info">
                <Text muted>
                  Un code de vérification a été envoyé à <strong>{identifier}</strong>.
                </Text>
              </InlineAlert>
            )}
            <OTPInput
              label="Code de vérification"
              length={6}
              value={code}
              onChange={setCode}
              hint="Démo : utilisez le code 000000."
            />
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Vérifier mon compte
            </Button>
            <p className={styles.centered}>
              <Link to="/register/password" className={styles.linkSubtle}>
                Modifier mes informations
              </Link>
            </p>
          </>
        )}
      </form>
    </AuthLayout>
  )
}