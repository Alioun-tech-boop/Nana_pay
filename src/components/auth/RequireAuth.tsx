import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Logo, Spinner } from '../../design-system'
import { useSession } from '../../features/auth'
import styles from './requireAuth.module.css'

function AppLoader() {
  return (
    <div className={styles.loader} role="status" aria-label="Chargement de votre espace">
      <Logo size={30} />
      <Spinner size={22} />
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return <AppLoader />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}