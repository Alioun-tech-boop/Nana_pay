import { Icon } from '../../design-system'
import type { IconName } from '../../design-system'
import type { MerchantAccent } from '../../types'
import { cx } from '../../design-system'
import viewStyles from './view.module.css'

export type TileSize = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<TileSize, string> = {
  sm: viewStyles['productTile--sm'],
  md: viewStyles['productTile--md'],
  lg: viewStyles['productTile--lg'],
}

const ACCENT_CLASS: Record<MerchantAccent, string> = {
  brand: viewStyles.tileBrand,
  gold: viewStyles.tileGold,
  success: viewStyles.tileSuccess,
  warning: viewStyles.tileWarning,
  danger: viewStyles.tileDanger,
  ink: viewStyles.tileInk,
}

export interface ProductTileProps {
  icon: IconName
  accent: MerchantAccent
  size?: TileSize
  className?: string
}

export function ProductTile({ icon, accent, size = 'md', className }: ProductTileProps) {
  return (
    <span className={cx(viewStyles.productTile, SIZE_CLASS[size], ACCENT_CLASS[accent], className)} aria-hidden="true">
      <Icon name={icon} size={size === 'sm' ? 20 : size === 'md' ? 40 : 56} strokeWidth={1.5} />
    </span>
  )
}