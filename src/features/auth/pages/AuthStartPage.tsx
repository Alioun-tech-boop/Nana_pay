import { Link } from 'react-router-dom'
import { Icon, Logo } from '../../../design-system'
import styles from './authFlow.module.css'

export function AuthStartPage() {
  return (
    <main className={styles.startPage}>
      <Link to="/" className={styles.startBrand} aria-label="NanoPay, accueil">
        <Logo size={32} />
      </Link>
      <section className={styles.startMain}>
        <p className={styles.startEyebrow}>NanoPay · espace sécurisé</p>
        <h1 className={styles.startTitle}>Votre argent. Votre rythme.</h1>
        <p className={styles.startText}>
          Financez vos achats, suivez vos versements et gardez le contrôle de chaque étape.
        </p>
        <div className={styles.startActions}>
          <Link to="/login" className={styles.startAction}>
            Se connecter <Icon name="arrow-right" size={18} />
          </Link>
          <Link to="/register" className={styles.startAction}>
            Créer un compte <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </section>
      <footer className={styles.startFooter}>
        <span>Des paiements clairs, confirmés par NanoPay.</span>
        <span>© 2026 NanoPay</span>
      </footer>
    </main>
  )
}
