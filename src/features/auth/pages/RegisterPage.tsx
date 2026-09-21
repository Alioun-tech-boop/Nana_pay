import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../design-system'
import { AuthLayout } from '../components/AuthLayout'
import styles from './authFlow.module.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !birthDate) return
    navigate('/register/contact', { state: { firstName: firstName.trim(), lastName: lastName.trim(), birthDate } })
  }

  return (
    <AuthLayout
      title="Créer votre compte"
      subtitle="Étape 1 sur 4 · Commençons par faire connaissance."
    >
      <form className={styles.stepForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.stepProgress}><span style={{ width: '25%' }} /></div>
        <Input
          label="Prénom"
          autoComplete="given-name"
          placeholder="Ada"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          required
        />
        <Input
          label="Nom"
          autoComplete="family-name"
          placeholder="Doumbia"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          required
        />
        <Input
          label="Date de naissance"
          type="date"
          autoComplete="bday"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
        />
        <div className={styles.stepFormActions}>
          <Link to="/auth" className={styles.secondaryLink}>Retour</Link>
          <Button type="submit" size="lg">Continuer</Button>
        </div>
      </form>
    </AuthLayout>
  )
}