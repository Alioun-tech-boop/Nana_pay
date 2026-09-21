export const palette = {
  night: {
    '950': '#0A0A0A',
    '925': '#111111',
    '900': '#181818',
    '800': '#202020',
    '700': '#292929',
    '600': '#333333',
    '500': '#3D3D3D',
  },
  moon: {
    '0': '#FFFFFF',
    '50': '#F2F3F6',
    '100': '#E6E8EE',
    '200': '#C9CDD8',
    '300': '#A8AEBE',
    '400': '#82899B',
    '500': '#646B7C',
  },
  cyan: {
    '900': '#161616',
    '800': '#1D1D1D',
    '700': '#242424',
    '600': '#2C2C2C',
    '500': '#9A9A9A',
    '400': '#A8A8A8',
    '300': '#BBBBBB',
    '200': '#D6D6D6',
    '100': '#ECECEC',
  },
  ink: {
    '950': '#0A0A0A',
    '900': '#101010',
    '800': '#171717',
    '700': '#1F1F1F',
    '600': '#292929',
    '500': '#373737',
    '400': '#4E4E4E',
    '300': '#6F6F6F',
    '200': '#9C9C9C',
    '100': '#D6D6D6',
    '50': '#ECECEC',
  },
  paper: {
    '0': '#FFFFFF',
    '50': '#F7F8FB',
    '100': '#EFF1F6',
    '200': '#E3E6EE',
  },
  brand: {
    '800': '#0A0A0A',
    '700': '#161616',
    '600': '#1C1C1C',
    '500': '#FFFFFF',
    '400': '#D9D9D9',
    '300': '#B2B2B2',
    '200': '#8C8C8C',
    '100': '#E6E6E6',
    '50': '#F2F2F2',
  },
  gold: {
    '700': '#1C1C1C',
    '600': '#333333',
    '500': '#9A9A9A',
    '400': '#A8A8A8',
    '300': '#B2B2B2',
    '100': '#ECECEC',
  },
  success: {
    '700': '#1C1C1C',
    '600': '#333333',
    '500': '#9A9A9A',
    '400': '#A8A8A8',
    '300': '#D4D4D4',
    '100': '#ECECEC',
  },
  warning: {
    '700': '#1C1C1C',
    '600': '#333333',
    '500': '#9A9A9A',
    '400': '#A8A8A8',
    '300': '#D4D4D4',
    '100': '#ECECEC',
  },
  danger: {
    '700': '#1C1C1C',
    '600': '#333333',
    '500': '#9A9A9A',
    '400': '#B8B8B8',
    '300': '#CFCFCF',
    '100': '#E8E8E8',
  },
} as const

export const backgrounds = {
  page: 'var(--np-color-night-950)',
  surface: 'var(--np-color-night-925)',
  'surface-2': 'var(--np-color-night-900)',
  'surface-3': 'var(--np-color-night-800)',
  'surface-4': 'var(--np-color-night-700)',
  overlay: 'color-mix(in srgb, var(--np-color-night-950) 58%, transparent)',
  shimmer: 'var(--np-color-night-700)',
} as const

export const textColors = {
  primary: '#FFFFFF',
  secondary: '#A6A6A6',
  tertiary: '#6F6F6F',
  disabled: 'rgba(255, 255, 255, 0.3)',
  'on-brand': 'var(--np-color-night-950)',
  'on-surface': 'var(--np-color-moon-0)',
  'on-gold': 'var(--np-color-night-950)',
} as const

export const borders = {
  base: 'rgba(255, 255, 255, 0.12)',
  strong: 'rgba(255, 255, 255, 0.16)',
  'on-strong': 'rgba(255, 255, 255, 0.28)',
} as const

export const surfaces = {
  raised: 'var(--np-bg-surface-3)',
  'raised-strong': 'var(--np-bg-surface-4)',
  hero: 'var(--np-gradient-hero-brand)',
  'hero-strong': 'var(--np-gradient-hero-strong)',
} as const

export const actions = {
  'primary': 'var(--np-color-moon-0)',
  'primary-hover': '#EDEDED',
  'primary-active': '#DCDCDC',
  'primary-soft': 'color-mix(in srgb, var(--np-color-moon-0) 14%, transparent)',
  'primary-soft-hover': 'color-mix(in srgb, var(--np-color-moon-0) 22%, transparent)',
  'danger': '#F2F2F2',
  'danger-hover': '#E2E2E2',
  'danger-soft': 'color-mix(in srgb, var(--np-color-moon-0) 14%, transparent)',
} as const

export const statusColors = {
  'success-text': 'var(--np-color-success-400)',
  'success-bg': 'color-mix(in srgb, var(--np-color-success-500) 16%, transparent)',
  'warning-text': 'var(--np-color-warning-400)',
  'warning-bg': 'color-mix(in srgb, var(--np-color-warning-500) 16%, transparent)',
  'danger-text': 'var(--np-color-danger-400)',
  'danger-bg': 'color-mix(in srgb, var(--np-color-danger-500) 16%, transparent)',
  'info-text': 'var(--np-color-brand-400)',
  'info-bg': 'color-mix(in srgb, var(--np-color-brand-500) 18%, transparent)',
  'neutral-text': 'var(--np-color-moon-300)',
  'neutral-bg': 'color-mix(in srgb, var(--np-color-moon-0) 8%, transparent)',
} as const

export const focusRing =
  '0 0 0 3px color-mix(in srgb, var(--np-color-brand-500) 32%, transparent), 0 0 0 1px var(--np-color-brand-400)'

export const focusRingDanger =
  '0 0 0 3px color-mix(in srgb, var(--np-color-danger-500) 30%, transparent), 0 0 0 1px var(--np-color-danger-500)'

export const states = {
  'hover-surface': 'var(--np-bg-surface-3)',
  'press-surface': 'var(--np-bg-surface-4)',
  'hover-border': 'var(--np-border-on-strong)',
  'focus-border': 'var(--np-color-brand-400)',
  'selected-surface': 'color-mix(in srgb, var(--np-color-brand-500) 20%, transparent)',
  'selected-text': 'var(--np-color-brand-300)',
  'selected-border': 'var(--np-color-brand-400)',
  'disabled-opacity': '0.45',
} as const

export const domains = {
  'savings-accent-text': 'var(--np-color-gold-300)',
  'savings-accent-bg': 'color-mix(in srgb, var(--np-color-gold-500) 16%, transparent)',
  'savings-accent-border': 'color-mix(in srgb, var(--np-color-gold-500) 36%, transparent)',
  'savings-accent-solid': 'var(--np-color-gold-500)',
  'vault-accent-text': 'var(--np-color-cyan-300)',
  'vault-accent-bg': 'color-mix(in srgb, var(--np-color-cyan-500) 16%, transparent)',
  'vault-accent-border': 'color-mix(in srgb, var(--np-color-cyan-500) 36%, transparent)',
  'vault-accent-solid': 'var(--np-color-cyan-500)',
  'credit-accent-text': 'var(--np-color-brand-300)',
  'credit-accent-bg': 'color-mix(in srgb, var(--np-color-brand-500) 16%, transparent)',
  'credit-accent-border': 'color-mix(in srgb, var(--np-color-brand-500) 36%, transparent)',
  'credit-accent-solid': 'var(--np-color-brand-500)',
  'payment-accent-text': 'var(--np-color-brand-300)',
  'payment-accent-bg': 'color-mix(in srgb, var(--np-color-brand-500) 16%, transparent)',
  'payment-accent-border': 'color-mix(in srgb, var(--np-color-brand-500) 36%, transparent)',
  'payment-accent-solid': 'var(--np-color-brand-500)',
  'confirmation-accent-text': 'var(--np-color-success-300)',
  'confirmation-accent-bg': 'color-mix(in srgb, var(--np-color-success-500) 16%, transparent)',
  'confirmation-accent-border': 'color-mix(in srgb, var(--np-color-success-500) 36%, transparent)',
  'confirmation-accent-solid': 'var(--np-color-success-500)',
} as const