import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Text } from '../../design-system'
import styles from './modules/pageHeader.module.css'

export interface PageHeaderProps {
  backTo?: string
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ backTo, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        {backTo ? (
          <Link to={backTo} className={styles.back} aria-label="Retour">
            <Icon name="arrow-left" size={16} />
          </Link>
        ) : null}
        <div className={styles.block}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {description ? <Text muted>{description}</Text> : null}
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  )
}