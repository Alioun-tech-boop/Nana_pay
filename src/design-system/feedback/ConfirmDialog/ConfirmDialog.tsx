import type { ReactNode } from 'react'
import { Button } from '../../primitives/Button/Button'
import { Dialog } from '../Dialog/Dialog'
import type { DialogProps } from '../Dialog/Dialog'

export interface ConfirmDialogProps
  extends Omit<DialogProps, 'children' | 'footer' | 'title'> {
  title?: ReactNode
  body?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmTone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Annuler',
  confirmTone = 'primary',
  loading = false,
  onConfirm,
  onClose,
  ...rest
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title ?? `Confirmer l'action`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmTone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
      {...rest}
    >
      {body ? <div>{body}</div> : null}
    </Dialog>
  )
}