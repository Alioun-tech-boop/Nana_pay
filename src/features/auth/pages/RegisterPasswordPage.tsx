import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Checkbox, InlineAlert, Input, Text } from '../../../design-system'
import { toUserMessage } from '../../../lib/errors'
import { authService } from '../../../services/authService'
import { AuthLayout } from '../components/AuthLayout'
import type { RegisterContactState } from './authFlow'
import styles from './authFlow.module.css'

export function RegisterPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const contactState = (location.state ?? {}) as Partial<RegisterContactState>
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirmPassword) return setError('Les deux mots de passe ne correspondent pas.')
    if (!accepted) return setError('Veuillez accepter les conditions d’utilisation.')
    if (!contactState.firstName || !contactState.lastName || !contactState.birthDate || !contactState.contact || !contactState.contactType) return

    setSubmitting(true)
    setError('')
    try {
      const isEmail = contactState.contactType === 'email'
      await authService.register({
        firstName: contactState.firstName,
        lastName: contactState.lastName,
        birthDate: contactState.birthDate,
        contact: contactState.contact,
        contactType: contactState.contactType,
        email: isEmail ? contactState.contact : '',
        phone: isEmail ? '' : contactState.contact,
        password,
      })
      navigate('/verify', { state: { identifier: contactState.contact } })
    } catch (caught) {
      setError(toUserMessage(caught))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Sécurisez votre compte" subtitle="Étape 3 sur 4 · Choisissez un mot de passe solide.">
      <form className={styles.stepForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.stepProgress}><span style={{ width: '75%' }} /></div>
        {error ? <InlineAlert tone="danger" title={error} /> : null}
        <Input label="Mot de passe" type="password" autoComplete="new-password" placeholder="8 caractères minimum" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        <Input label="Confirmer le mot de passe" type="password" autoComplete="new-password" placeholder="Répétez votre mot de passe" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
        <Checkbox label={<Text muted>J’accepte les conditions générales et la politique de confidentialité.</Text>} checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        <div className={styles.stepFormActions}>
          <Link to="/register/contact" state={contactState} className={styles.secondaryLink}>Retour</Link>
          <Button type="submit" size="lg" loading={submitting}>Créer mon compte</Button>
        </div>
      </form>
    </AuthLayout>
  )
}
