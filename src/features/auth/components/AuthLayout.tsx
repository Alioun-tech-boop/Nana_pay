import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Logo, Text } from '../../../design-system'
import type { IconName } from '../../../design-system'
import styles from './authLayout.module.css'

export interface AuthLayoutProps {
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}

const ASSURANCES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'shield',
    title: 'Supervision bancaire',
    text: 'Chaque financement est analysé par un partenaire bancaire.',
  },
  {
    icon: 'wallet',
    title: 'Paiement mobile money',
    text: 'Versements simples via votre compte Mobile Money.',
  },
  {
    icon: 'lock',
    title: 'Données protégées',
    text: 'Vos informations financières restent confidentielles.',
  },
]

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="NanoPay, accueil">
          <Logo size={26} />
        </Link>
        <div className={styles.headerNote}>
          <Text muted>Vous avez déjà un compte ?</Text>
          <Link to="/login" className={styles.headerLink}>
            Se connecter
          </Link>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.panel}>
          <p className={styles.eyebrow}>Épargne progressive · Coffre · Crédit</p>
          <h2 className={styles.headline}>Achetez maintenant, payez progressivement.</h2>
          <p className={styles.lede}>
            NanoPay rend vos achats accessibles avec des modes de paiement flexibles,
            simples et transparents.
          </p>
          <ul className={styles.assurances}>
            {ASSURANCES.map((item) => (
              <li key={item.title} className={styles.assurance}>
                <span className={styles.assuranceIcon} aria-hidden="true">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className={styles.assuranceBody}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.stage}>
          <section className={styles.card} aria-labelledby="auth-title">
            <p id="auth-title" className={styles.cardEyebrow}>
              NanoPay
            </p>
            <h1 className={styles.cardTitle}>{title}</h1>
            {subtitle ? <Text muted>{subtitle}</Text> : null}
            <div className={styles.cardBody}>{children}</div>
          </section>
        </main>
      </div>

      <footer className={styles.footer}>
        <span>NanoPay · Espace client</span>
        <span className={styles.footerMuted}>© 2026 NanoPay. Tous droits réservés.</span>
      </footer>
    </div>
  )
}