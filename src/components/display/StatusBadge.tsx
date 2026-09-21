import {
  StatusBadge as DesignStatusBadge,
  type StatusBadgeProps as DesignStatusBadgeProps,
} from '../../design-system'
import { getStatusDefinition } from '../../lib/status'

export type StatusBadgeProps = Omit<DesignStatusBadgeProps, 'label' | 'tone'>

export function StatusBadge({ status, ...rest }: StatusBadgeProps) {
  const definition = getStatusDefinition(status)
  return <DesignStatusBadge status={status} label={definition.label} tone={definition.tone} {...rest} />
}

export { getStatusLabel, getStatusDefinition, isKnownStatus } from '../../lib/status'
export type { StatusDefinition } from '../../lib/status'