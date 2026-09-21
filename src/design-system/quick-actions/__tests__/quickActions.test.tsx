import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NanaQuickAction, NanaQuickActions, nanaQuickActionPresets } from '../index'

describe('NanaQuickAction', () => {
  it('rend un bouton avec le label de la variante', () => {
    render(<NanaQuickAction variant="recharge" />)
    expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
  })

  it('expose les six variantes métier', () => {
    render(
      <NanaQuickActions>
        {(Object.keys(nanaQuickActionPresets) as Array<keyof typeof nanaQuickActionPresets>).map(
          (variant) => (
            <NanaQuickAction key={variant} variant={variant} />
          ),
        )}
      </NanaQuickActions>,
    )
    for (const { label } of Object.values(nanaQuickActionPresets)) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('déclenche onClick', () => {
    const onClick = vi.fn()
    render(<NanaQuickAction variant="send" onClick={onClick} />)
    screen.getByRole('button', { name: 'Acheter' }).click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('surcharge label et icône', () => {
    render(<NanaQuickAction variant="pay" label="Régler" icon="coins" />)
    expect(screen.getByRole('button', { name: 'Régler' })).toBeInTheDocument()
  })

  it('désactive le bouton quand disabled', () => {
    const onClick = vi.fn()
    render(<NanaQuickAction variant="withdraw" disabled onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Retirer' })
    expect(button).toBeDisabled()
    button.click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('expose un état de chargement accessible', () => {
    render(<NanaQuickAction variant="scan" loading />)
    const button = screen.getByRole('button', { name: 'Scanner' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('affiche un badge quand fourni', () => {
    render(<NanaQuickAction variant="more" badge={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

describe('NanaQuickActions', () => {
  it('rend une navigation nommée contenant les actions', () => {
    render(
      <NanaQuickActions>
        <NanaQuickAction variant="recharge" />
        <NanaQuickAction variant="more" />
      </NanaQuickActions>,
    )
    const nav = screen.getByRole('navigation', { name: 'Actions rapides' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Plus' })).toBeInTheDocument()
  })

  it('accepte un aria-label personnalisé', () => {
    render(
      <NanaQuickActions aria-label="Raccourcis">
        <NanaQuickAction variant="scan" />
      </NanaQuickActions>,
    )
    expect(screen.getByRole('navigation', { name: 'Raccourcis' })).toBeInTheDocument()
  })
})
