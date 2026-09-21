import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../design-system'
import { AuthLayout } from '../components/AuthLayout'
import type { RegisterIdentityState } from './authFlow'
import styles from './authFlow.module.css'

export function RegisterContactPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const identity = (location.state ?? {}) as Partial<RegisterIdentityState>
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [contact, setContact] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!identity.firstName || !identity.lastName || !identity.birthDate || !contact.trim()) return
    navigate('/register/password', {
      state: { ...identity, contact: contact.trim(), contactType },
    })
  }

  return (
    <AuthLayout title="Votre contact" subtitle="Étape 2 sur 4 · Où devons-nous vous joindre ?">
      <form className={styles.stepForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.stepProgress}><span style={{ width: '50%' }} /></div>
        <div className={styles.contactSwitch} role="group" aria-label="Type de contact">
          <button type="button" className={`${styles.contactOption} ${contactType === 'email' ? styles.contactOptionActive : ''}`} onClick={() => setContactType('email')}>E-mail</button>
          <button type="button" className={`${styles.contactOption} ${contactType === 'phone' ? styles.contactOptionActive : ''}`} onClick={() => setContactType('phone')}>Téléphone</button>
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
        <div className={styles.stepFormActions}>
          <Link to="/register" state={identity} className={styles.secondaryLink}>Retour</Link>
          <Button type="submit" size="lg">Continuer</Button>
        </div>
      </form>
    </AuthLayout>
  )
}
