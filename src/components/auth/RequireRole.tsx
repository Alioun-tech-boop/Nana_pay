import type { ReactNode } from 'react'
import { Skeleton } from '../../design-system'
import { useSession } from '../../stores/session'
import type { Permission, UserRole } from '../../types'

export interface RequireRoleProps {
  roles?: readonly UserRole[]
  permissions?: readonly Permission[]
  fallback?: ReactNode
  loading?: ReactNode
  children: ReactNode
}

export function RequireRole({
  roles,
  permissions,
  fallback = null,
  loading = <Skeleton width={140} height={16} />,
  children,
}: RequireRoleProps) {
  const { session, status } = useSession()

  if (status === 'idle' || status === 'loading') return <>{loading}</>
  if (status !== 'authenticated' || !session) return <>{fallback}</>

  const roleAllowed = roles === undefined || roles.includes(session.user.role)
  const permissionsAllowed =
    permissions === undefined || permissions.every((permission) => session.user.permissions.includes(permission))

  if (!roleAllowed || !permissionsAllowed) return <>{fallback}</>

  return <>{children}</>
}