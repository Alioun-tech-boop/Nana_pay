import { Link } from 'react-router-dom'
import { Icon } from '../../../design-system'
import styles from './authStart.module.css'

/**
 * Écran de choix (route `/auth`), atteint après « Suivant ».
 *
 * Ne contient QUE les deux boutons « Créer un compte » et « Se connecter »,
 * superposés en haut, sur fond sombre. Aucun texte, aucune carte.
 */
export function AuthStartPage() {
  return (
    <main className={styles.choicePage}>
      <div className={styles.choiceActions}>
        <Link to="/register" className={styles.choiceAction}>
          Créer un compte <Icon name="arrow-right" size={18} />
        </Link>
        <Link to="/login" className={styles.choiceAction}>
          Se connecter <Icon name="arrow-right" size={18} />
        </Link>
      </div>
    </main>
  )
}
