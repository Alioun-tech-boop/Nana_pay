import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Checkbox, InlineAlert, Input, Text } from '../../../design-system'
import { toUserMessage } from '../../../lib/errors'
import { authService } from '../../../services/authService'
import { AuthLayout } from '../components/AuthLayout'
import styles from './authPages.module.css'

type ContactType = 'email' | 'phone'

/**
 * Inscription simplifiée (route `/register`).
 *
 * Seuls l'e-mail/numéro de téléphone, le mot de passe et l'acceptation de la
 * politique de confidentialité sont demandés. Rien d'autre : ni prénom, ni nom,
 * ni date de naissance.
 *
 * Le backend reste la source de vérité : `POST /auth/register` valide les
 * données et peut refuser (email déjà pris, mot de passe trop faible…).
 */
export function RegisterPage() {
  const navigate = useNavigate()
  const [contactType, setContactType] = useState<ContactType>('email')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    const trimmed = contact.trim()
    if (!trimmed) return setError('Merci de renseigner votre e-mail ou numéro de téléphone.')
    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return setError('Merci de saisir une adresse e-mail valide.')
    }
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirmPassword) return setError('Les deux mots de passe ne correspondent pas.')
    if (!accepted) return setError('Veuillez accepter la politique de confidentialité.')

    setSubmitting(true)
    setError('')
    try {
      const isEmail = contactType === 'email'
      await authService.register({
        firstName: '',
        lastName: '',
        birthDate: '',
        contact: trimmed,
        contactType,
        email: isEmail ? trimmed : '',
        phone: isEmail ? '' : trimmed,
        password,
      })
      navigate('/verify', { state: { identifier: trimmed } })
    } catch (caught) {
      setError(toUserMessage(caught))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Créer votre compte" subtitle="Un e-mail ou un numéro, un mot de passe, et c’est prêt.">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error ? <InlineAlert tone="danger" title={error} /> : null}

        <div className={styles.contactSwitch} role="group" aria-label="Type de contact">
          <button
            type="button"
            className={`${styles.contactOption} ${contactType === 'email' ? styles.contactOptionActive : ''}`}
            onClick={() => setContactType('email')}
          >
            E-mail
          </button>
          <button
            type="button"
            className={`${styles.contactOption} ${contactType === 'phone' ? styles.contactOptionActive : ''}`}
            onClick={() => setContactType('phone')}
          >
            Téléphone
          </button>
        </div>

        <Input
          label={contactType === 'email' ? 'Adresse e-mail' : 'Numéro de téléphone'}
          type={contactType === 'email' ? 'email' : 'tel'}
          inputMode={contactType === 'email' ? 'email' : 'tel'}
          autoComplete={contactType === 'email' ? 'email' : 'tel'}
          placeholder={contactType === 'email' ? 'vous@exemple.com' : '+225 07 00 00 00 00'}
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          required
        />

        <Input
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />

        <Input
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          placeholder="Répétez votre mot de passe"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />

        <Checkbox
          label={
            <Text muted>
              J’accepte la{' '}
              <Link to="/privacy" className={styles.linkSubtle}>
                politique de confidentialité
              </Link>
              .
            </Text>
          }
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Créer mon compte
        </Button>

        <p className={styles.centered}>
          <Link to="/login" className={styles.linkSubtle}>
            J’ai déjà un compte — me connecter
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
