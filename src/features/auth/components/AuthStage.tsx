import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../../design-system'
import { OnboardingBackdrop } from './OnboardingBackdrop'
import styles from './authStage.module.css'

export interface AuthStageProps {
  title: string
  children: ReactNode
}

/**
 * Cadre sombre commun aux écrans de connexion et de vérification.
 *
 * Réutilise le fond animé de l'écran d'ouverture pour garder une continuité
 * visuelle, mais dans une variante atténuée : sur ces écrans l'utilisateur doit
 * lire et saisir des informations, donc le décor ne doit jamais gêner la
 * lisibilité (AGENTS.md §32, §36, §42).
 *
 * Les formulaires restent inchangés : validations, états d'erreur et anti
 * double-clic sont gérés par les pages elles-mêmes.
 */
export function AuthStage({ title, children }: AuthStageProps) {
  return (
    <div className={styles.root}>
      <div className={styles.backdropLayer}>
        <OnboardingBackdrop />
      </div>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="NanaPay, accueil">
          <Logo size={26} />
        </Link>
      </header>
      <main className={styles.stage}>
        <section className={styles.panel} aria-labelledby="auth-stage-title">
          <h1 id="auth-stage-title" className={styles.title}>
            {title}
          </h1>
          <div className={styles.body}>{children}</div>
        </section>
      </main>
    </div>
  )
}
