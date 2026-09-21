import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import styles from './timeline.module.css'

export type TimelineState = 'done' | 'active' | 'upcoming' | 'error'

export interface TimelineItemData {
  title: ReactNode
  description?: ReactNode
  time?: ReactNode
  action?: ReactNode
  state: TimelineState
}

export interface TimelineProps {
  items: TimelineItemData[]
  className?: string
}

const STATE_TEXT: Record<TimelineState, string> = {
  done: 'Étape réalisée',
  active: 'Étape en cours',
  upcoming: 'Étape à venir',
  error: 'Erreur sur cette étape',
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cx(styles.timeline, className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cx(styles.item, styles[`item--${item.state}`])}
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <span className={styles.rail} aria-hidden="true">
            <span className={cx(styles.marker, styles[`marker--${item.state}`])}>
              {item.state === 'done' ? (
                <Icon name="check" size={12} />
              ) : item.state === 'error' ? (
                <Icon name="close" size={12} />
              ) : null}
            </span>
            {index < items.length - 1 ? (
              <span className={cx(styles.line, styles[`line--${item.state}`])} />
            ) : null}
          </span>
          <span className={styles.content}>
            <span className={styles.titleRow}>
              <span className={styles.title}>{item.title}</span>
              {item.time ? <span className={styles.time}>{item.time}</span> : null}
            </span>
            {item.description ? (
              <span className={styles.description}>{item.description}</span>
            ) : null}
            {item.action ? <span className={styles.action}>{item.action}</span> : null}
            <span className={styles.srOnly}>{STATE_TEXT[item.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}