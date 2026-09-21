import type { ReactNode } from 'react'
import { cx } from '../../utils/className'
import { Icon } from '../../icons/Icon'
import styles from './stepper.module.css'

export type StepState = 'done' | 'current' | 'upcoming' | 'error'

export interface StepperStep {
  label: ReactNode
  description?: ReactNode
  state: StepState
}

export interface StepperProps {
  steps: StepperStep[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

const STATE_TEXT: Record<StepState, string> = {
  done: 'Étape réalisée',
  current: 'Étape en cours',
  upcoming: 'Étape à venir',
  error: 'Erreur sur cette étape',
}

export function Stepper({ steps, orientation = 'horizontal', className }: StepperProps) {
  return (
    <ol className={cx(styles.stepper, styles[`stepper--${orientation}`], className)}>
      {steps.map((step, index) => {
        const isDone = step.state === 'done'
        const isError = step.state === 'error'
        const isCurrent = step.state === 'current'
        return (
          <li
            key={index}
            className={cx(styles.step, styles[`step--${step.state}`])}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className={styles.connector} aria-hidden="true" />
            <span className={cx(styles.circle, styles[`circle--${step.state}`])} aria-hidden="true">
              {isDone ? (
                <Icon name="check" size={14} />
              ) : isError ? (
                <Icon name="close" size={14} />
              ) : (
                <span className={styles.number}>{index + 1}</span>
              )}
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{step.label}</span>
              {step.description ? (
                <span className={styles.description}>{step.description}</span>
              ) : null}
              <span className={styles.srOnly}>{STATE_TEXT[step.state]}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}