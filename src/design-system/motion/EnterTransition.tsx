import type { ReactNode } from 'react'
import { cx } from '../utils/className'
import { motionPresets } from './presets'
import type { MotionPreset } from './presets'

export interface EnterTransitionProps {
  children: ReactNode
  preset?: MotionPreset
  className?: string
}

export function EnterTransition({ children, preset = 'pageEnter', className }: EnterTransitionProps) {
  return <div className={cx(motionPresets[preset], className)}>{children}</div>
}