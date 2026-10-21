import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../../design-system'
import { useSession } from '../../../stores/session'
import { homePathForRole } from '../../../app/roleNavigation'
import { OnboardingBackdrop } from '../components/OnboardingBackdrop'
import styles from './landing.module.css'

/**
 * Écran d'ouverture (route `/`).
 *
 * Affiche UNIQUEMENT un bouton « Suivant » sur un fond sombre animé de cartes
 * de crédit et de produits. Aucun texte marketing, aucune carte de contenu.
 *
 * Un utilisateur déjà connecté ne voit jamais cet écran : il est redirigé vers
 * son espace. Tant qu'il n'est pas connecté, l'écran réapparaît à chaque
 * ouverture de l'app (clair ou après rechargement).
 */
export function LandingPage() {
  const { status, session } = useSession()
  const navigate = useNavigate()

  if (status === 'authenticated' && session) {
    return <Navigate to={homePathForRole(session.user.role)} replace />
  }

  return (
    <main className={styles.splash}>
      <OnboardingBackdrop />
      <div className={styles.splashActions}>
        <Button size="lg" onClick={() => navigate('/auth')}>
          Suivant
        </Button>
      </div>
    </main>
  )
}
