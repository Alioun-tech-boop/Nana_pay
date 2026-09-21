import { Link } from 'react-router-dom'
import { Button, Icon, Logo, Text } from '../../../design-system'
import type { IconName } from '../../../design-system'
import { useSession } from '../../../stores/session'
import styles from './landing.module.css'

const MODES: Array<{ icon: IconName; title: string; text: string; tone: string }> = [
  {
    icon: 'coins',
    title: 'Épargne progressive',
    text: 'Épargnez un peu chaque mois jusqu’au prix du produit, puis recevez votre QR.',
    tone: 'gold',
  },
  {
    icon: 'vault',
    title: 'Coffre NanoPay',
    text: 'Un coffre alimenté par votre employeur pour financer vos achats en toute simplicité.',
    tone: 'cyan',
  },
  {
    icon: 'bank',
    title: 'Crédit bancaire',
    text: 'Un crédit analysé par un partenaire bancaire pour des achats plus importants.',
    tone: 'brand',
  },
]

const STEPS = ['Choisissez un produit', 'Créez votre commande', 'Sélectionnez un financement', 'Retirez chez le marchand']

export function LandingPage() {
  const { status } = useSession()
  const authenticated = status === 'authenticated'

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="NanoPay, accueil">
          <Logo size={26} />
        </Link>
        <nav className={styles.headerNav} aria-label="Navigation d’accueil">
          {authenticated ? (
            <Link to="/dashboard" className={styles.navLink}>
              Mon espace
            </Link>
          ) : null}
          <Link to="/login" className={styles.navLink}>
            Connexion
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroPanel}>
          <p className={styles.eyebrow}>Épargne progressive · Coffre · Crédit bancaire</p>
          <h1 className={styles.headline}>
            Achetez maintenant.
            <br />
            <span className={styles.headlineAccent}>Payez en toute confiance.</span>
          </h1>
          <p className={styles.lede}>
            NanoPay vous permet de financer vos achats auprès de boutiques vérifiées,
            de suivre votre épargne et de retirer vos produits avec un simple QR code.
          </p>
          <div className={styles.heroActions}>
            {authenticated ? (
              <Link to="/dashboard" className={styles.primaryLink}>
                <Button size="lg">Accéder à mon espace</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className={styles.primaryLink}>
                  <Button size="lg">Commencer</Button>
                </Link>
                <Link to="/login" className={styles.primaryLink}>
                  <Button size="lg" variant="secondary">
                    Se connecter
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={styles.modes}>
        {MODES.map((mode) => (
          <article key={mode.title} className={styles.mode}>
            <span className={`${styles.modeIcon} ${styles[`modeIcon--${mode.tone}`]}`} aria-hidden="true">
              <Icon name={mode.icon} size={22} />
            </span>
            <h3 className={styles.modeTitle}>{mode.title}</h3>
            <Text muted>{mode.text}</Text>
          </article>
        ))}
      </section>

      <section className={styles.flow}>
        <h2 className={styles.flowTitle}>Comment ça marche</h2>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step} className={styles.step}>
              <span className={styles.stepIndex}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.stepLabel}>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <Link to="/" className={styles.footerBrand}>
          <Logo size={20} />
        </Link>
        <div className={styles.footerMeta}>
          <span>Espace client NanoPay</span>
          <span className={styles.footerMuted}>© 2026 NanoPay. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  )
}