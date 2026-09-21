import {
  palette,
  backgrounds,
  textColors,
  borders,
  surfaces,
  actions,
  statusColors,
  domains,
  states,
  focusRing,
  focusRingDanger,
} from './color'
import { gradients } from './gradient'
import { typeScale, fontFamilies } from './typography'
import { spacing, containers } from './spacing'
import { radii } from './radius'
import { shadows } from './shadow'
import { durations, easings } from './motion'
import { zIndex } from './zindex'

export type TokenMap = Record<string, string>

function flattenColorPalette(): TokenMap {
  const flat: TokenMap = {}
  for (const family of Object.values(palette)) {
    for (const [step, value] of Object.entries(family)) {
      flat[`${Object.keys(palette).find((k) => palette[k as keyof typeof palette] === family)}-${step}`] =
        value
    }
  }
  return flat
}

export const themeTokens: Record<string, TokenMap> = {
  color: flattenColorPalette(),
  bg: backgrounds,
  text: textColors,
  border: borders,
  surface: surfaces,
  action: actions,
  status: statusColors,
  domain: domains,
  state: states,
  gradient: gradients,
  focus: { ring: focusRing, 'ring-danger': focusRingDanger },
  type: typeScale,
  font: fontFamilies,
  space: spacing,
  container: containers,
  radius: radii,
  shadow: shadows,
  duration: durations,
  ease: easings,
  z: zIndex,
  legacy: {
    'type-title-2-size': typeScale['h2-size'],
    'type-title-2-height': typeScale['h2-line'],
    'type-title-2-tracking': typeScale['h2-tracking'],
    'type-title-3-size': typeScale['h3-size'],
    'type-title-3-height': typeScale['h3-line'],
    'type-title-3-tracking': typeScale['h3-tracking'],
    'type-title-4-size': typeScale['h3-size'],
    'type-display-3-size': typeScale['h1-size'],
  },
}

export function tokenStyles(): string {
  const lines: string[] = []
  for (const [group, map] of Object.entries(themeTokens)) {
    for (const [name, value] of Object.entries(map)) {
      lines.push(`--np-${group}-${name}: ${value};`)
    }
  }
  return lines.join('\n')
}