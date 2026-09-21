import { Navigate } from 'react-router-dom'
import { useSession } from '../../stores/session'
import { homePathForRole } from '../../app/roleNavigation'

export function RoleHomeRedirect() {
  const { session, status } = useSession()
  if (status === 'authenticated' && session) {
    return <Navigate to={homePathForRole(session.user.role)} replace />
  }
  return <Navigate to="/login" replace />
}
