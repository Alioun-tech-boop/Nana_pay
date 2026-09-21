import { describe, expect, it } from 'vitest'
import { tokenStyles, themeTokens } from '../index'

describe('design tokens — identité NanoPay', () => {
  it('définit chaque nouvelle valeur une et une seule fois (pas de doublon)', () => {
    const css = tokenStyles()
    const samples = [
      '--np-type-page-title-size',
      '--np-state-selected-surface',
      '--np-gradient-hero-brand',
      '--np-domain-savings-accent-text',
      '--np-color-cyan-300',
      '--np-bg-page',
    ]
    for (const token of samples) {
      const definition = `${token}:`
      const count = css.split(definition).length - 1
      expect(count, `${token} défini ${count} fois`).toBe(1)
    }
  })

  it('émet une rampe night monochrome aligné sur le spec central', () => {
    const css = tokenStyles()
    expect(css).toContain('--np-color-night-950: #0A0A0A')
    expect(css).toContain('--np-color-night-925: #111111')
    expect(css).toContain('--np-color-night-900: #181818')
    expect(css).toContain('--np-color-night-800: #202020')
    expect(css).toContain('--np-color-night-700: #292929')
  })

  it('respecte les alphas border/text et l’échelle radius du spec central', () => {
    const css = tokenStyles()
    expect(css).toContain('--np-border-base: rgba(255, 255, 255, 0.12)')
    expect(css).toContain('--np-border-strong: rgba(255, 255, 255, 0.16)')
    expect(css).toContain('--np-text-secondary: #A6A6A6')
    expect(css).toContain('--np-text-tertiary: #6F6F6F')
    expect(css).toContain('--np-radius-xs: 8px')
    expect(css).toContain('--np-radius-sm: 12px')
    expect(css).toContain('--np-radius-md: 16px')
    expect(css).toContain('--np-radius-lg: 24px')
    expect(css).toContain('--np-radius-xl: 32px')
    expect(css).toContain('--np-radius-pill: 999px')
    expect(css).toContain('--np-radius-1: var(--np-radius-xs)')
    expect(css).toContain('--np-radius-2: var(--np-radius-xl)')
    expect(css).toContain('--np-shadow-1:')
  })

  it('expose l’échelle spacing, la pile z et le motion du spec central', () => {
    const css = tokenStyles()
    expect(css).toContain('--np-space-5: 20px')
    expect(css).toContain('--np-space-8: 40px')
    expect(css).toContain('--np-space-11: 80px')
    expect(css).toContain('--np-space-12: 96px')
    expect(css).toContain('--np-space-13: 120px')
    expect(css).toContain('--np-z-navigation: 200')
    expect(css).toContain('--np-z-modal: 300')
    expect(css).toContain('--np-duration-normal: 180ms')
    expect(css).toContain('--np-shadow-card: 0 20px 60px rgba(0, 0, 0, 0.35)')
    expect(css).toContain('--np-shadow-floating:')
  })

  it('expose une hiérarchie typographique massive et fluide', () => {
    const css = tokenStyles()
    expect(css).toContain('--np-type-display-size: clamp(40px, 8vw, 84px)')
    expect(css).toContain('--np-type-display-2-size: clamp(48px, 10.5vw, 116px)')
    expect(css).toContain('--np-type-h1-size: clamp(30px, 5.4vw, 52px)')
    expect(css).toContain('--np-type-h2-size: clamp(22px, 3.4vw, 30px)')
    expect(css).toContain('--np-type-h3-size: clamp(16.5px, 2vw, 19px)')
  })

  it('expose l’échelle financière avec devise sous-dominante', () => {
    const css = tokenStyles()
    expect(css).toContain('--np-type-money-size: clamp(17px, 2.4vw, 23px)')
    expect(css).toContain('--np-type-money-strong-size: clamp(15px, 2vw, 20px)')
    expect(css).toContain('--np-type-money-display-size: clamp(26px, 5vw, 42px)')
    expect(css).toContain('--np-type-money-display-line: 1')
  })

  it('indexe tous les groupes de tokens attendus', () => {
    expect(Object.keys(themeTokens)).toEqual(
      expect.arrayContaining([
        'color',
        'bg',
        'text',
        'border',
        'surface',
        'action',
        'status',
        'domain',
        'state',
        'gradient',
        'focus',
        'type',
        'font',
        'space',
        'container',
        'radius',
        'shadow',
        'duration',
        'ease',
        'z',
      ]),
    )
  })

  it('série chaque groupe sous le préfixe --np-<groupe>-', () => {
    const css = tokenStyles()
    for (const group of [
      'type',
      'state',
      'gradient',
      'domain',
      'surface',
      'space',
      'radius',
      'shadow',
      'duration',
      'ease',
    ]) {
      expect(css).toContain(`--np-${group}-`)
    }
  })
})