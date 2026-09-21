import type { ReactNode } from 'react'
import { cx } from '../utils/className'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/Icon'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'
import { NanaCard } from './NanaCard'
import type { NanaCardTone } from './NanaCard'
import styles from './cards.module.css'

export type NanaSecurityState = 'active' | 'pending' | 'disabled'

const DEFAULT_STATE_LABEL: Record<NanaSecurityState, string> = {
  active: 'Activé',
  pending: 'En attente',
  disabled: 'Désactivé',
}

export interface NanaSecurityCardProps {
  title: ReactNode
  description?: ReactNode
  icon?: IconName
  state?: NanaSecurityState
  statusLabel?: string
  action?: ReactNode
  tone?: NanaCardTone
  loading?: boolean
  onClick?: () => void
  className?: string
}

export function NanaSecurityCard({
  title,
  description,
  icon = 'shield',
  state = 'active',
  statusLabel,
  action,
  tone = 'default',
  loading = false,
  onClick,
  className,
}: NanaSecurityCardProps) {
  return (
    <NanaCard
      tone={tone}
      interactive={Boolean(onClick)}
      loading={loading}
      onClick={onClick}
      className={className}
    >
      <div className={styles.security}>
        <span className={cx(styles.securityIcon, styles[`securityIcon--${state}`])} aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
        <div className={styles.securityBody}>
          <Heading as="h3" variant="h3">
            {title}
          </Heading>
          {description ? (
            <Text variant="body-sm" muted>
              {description}
            </Text>
          ) : null}
          <span className={cx(styles.securityState, styles[`securityState--${state}`])}>
            <span className={styles.securityDot} aria-hidden="true" />
            {statusLabel ?? DEFAULT_STATE_LABEL[state]}
          </span>
        </div>
      </div>
      {action ? <div className={styles.securityAction}>{action}</div> : null}
    </NanaCard>
  )
}
