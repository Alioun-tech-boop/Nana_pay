import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/Icon'
import styles from './toast.module.css'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

export interface ToastInput {
  tone?: ToastTone
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert',
  danger: 'alert-circle',
}

const DURATIONS: Record<ToastTone, number> = {
  info: 4000,
  success: 3500,
  warning: 5000,
  danger: 8000,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++
      const item: ToastItem = {
        id,
        tone: input.tone ?? 'info',
        title: input.title,
        description: input.description,
      }
      setToasts((current) => [...current, item])
      const duration = input.duration ?? DURATIONS[item.tone]
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-relevant="additions">
        {toasts.map((item) => (
          <div key={item.id} role="status" className={styles.toast}>
            <span className={styles.iconWrapper}>
              <Icon name={ICONS[item.tone]} size={18} />
            </span>
            <div className={styles.content}>
              <p className={styles.title}>{item.title}</p>
              {item.description ? <p className={styles.description}>{item.description}</p> : null}
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => dismiss(item.id)}
              aria-label="Fermer la notification"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit être utilisé dans <ToastProvider>')
  }
  return context
}