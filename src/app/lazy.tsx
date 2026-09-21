import { lazy, Suspense } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Skeleton } from '../design-system'
import styles from './routeFallback.module.css'

function RouteFallback() {
  return (
    <div className={styles.fallback} role="status" aria-label="Chargement de la page">
      <div className={styles.heading}>
        <Skeleton width={220} height={22} />
        <Skeleton width={150} height={12} />
      </div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={14} />
        </div>
        <div className={styles.card}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={14} />
        </div>
        <div className={styles.card}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={14} />
        </div>
      </div>
    </div>
  )
}

export function lazyPage(
  loader: () => Promise<{ default: ComponentType }>,
  fallback: ReactNode = <RouteFallback />,
): ComponentType {
  const Inner = lazy(loader)
  return function LazyPageRoute(props: Record<string, never>) {
    return (
      <Suspense fallback={fallback}>
        <Inner {...props} />
      </Suspense>
    )
  }
}