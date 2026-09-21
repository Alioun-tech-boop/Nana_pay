import { cx } from '../../design-system'
import type { MerchantAccent } from '../../types'
import viewStyles from './view.module.css'

export type EmblemSize = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<EmblemSize, string> = {
  sm: viewStyles['emblem--sm'],
  md: viewStyles['emblem--md'],
  lg: viewStyles['emblem--lg'],
}

export interface StoreEmblemProps {
  monogram: string
  accent: MerchantAccent
  size?: EmblemSize
  className?: string
}

const ACCENT_CLASS: Record<MerchantAccent, string> = {
  brand: viewStyles.emblemBrand,
  gold: viewStyles.emblemGold,
  success: viewStyles.emblemSuccess,
  warning: viewStyles.emblemWarning,
  danger: viewStyles.emblemDanger,
  ink: viewStyles.emblemInk,
}

export function StoreEmblem({ monogram, accent, size = 'md', className }: StoreEmblemProps) {
  return (
    <span className={cx(viewStyles.emblem, SIZE_CLASS[size], ACCENT_CLASS[accent], className)} aria-hidden="true">
      {monogram}
    </span>
  )
}