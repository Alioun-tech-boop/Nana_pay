import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  NanaAccountCard,
  NanaCard,
  NanaCardElevated,
  NanaCardInteractive,
  NanaGoalCard,
  NanaPhotoCard,
  NanaSecurityCard,
  NanaStatCard,
  NanaTransactionCard,
  SavingsPhotoCard,
  TravelPhotoCard,
  FamilyPhotoCard,
  BusinessPhotoCard,
  GoalPhotoCard,
  LifestylePhotoCard,
} from '../index'

describe('Système de cartes premium', () => {
  it('NanaCard rend son contenu et applique le padding', () => {
    render(<NanaCard padding="lg">Contenu carte</NanaCard>)
    expect(screen.getByText('Contenu carte')).toBeInTheDocument()
  })

  it('NanaCard interactive est un bouton cliquable', () => {
    const onClick = vi.fn()
    render(
      <NanaCard interactive onClick={onClick}>
        Carte cliquable
      </NanaCard>,
    )
    const button = screen.getByRole('button', { name: 'Carte cliquable' })
    button.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('NanaCardInteractive désactivée neutralise l’action', () => {
    render(<NanaCardInteractive disabled>Carte désactivée</NanaCardInteractive>)
    expect(screen.getByRole('button', { name: 'Carte désactivée' })).toBeDisabled()
  })

  it('NanaCardElevated conserve le contenu', () => {
    render(<NanaCardElevated>Surface élevée</NanaCardElevated>)
    expect(screen.getByText('Surface élevée')).toBeInTheDocument()
  })

  it('NanaCard en chargement expose un état accessible', () => {
    render(<NanaCard loading loadingLabel="Chargement de la carte">Contenu</NanaCard>)
    expect(screen.getByRole('status', { name: 'Chargement de la carte' })).toBeInTheDocument()
  })

  it('NanaStatCard affiche label et valeur formatée', () => {
    render(<NanaStatCard label="Solde épargne" value={<span>125 000 F CFA</span>} />)
    expect(screen.getByText('Solde épargne')).toBeInTheDocument()
    expect(screen.getByText('125 000 F CFA')).toBeInTheDocument()
  })

  it('NanaGoalCard calcule une progression bornée côté présentation', () => {
    render(<NanaGoalCard label="Objectif moto" saved={25000} target={100000} />)
    expect(screen.getByText('25 %')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('NanaGoalCard borne la progression à 100 %', () => {
    render(<NanaGoalCard label="Objectif dépassé" saved={150000} target={100000} />)
    expect(screen.getByText('100 %')).toBeInTheDocument()
  })

  it('NanaSecurityCard affiche titre, description et état', () => {
    render(
      <NanaSecurityCard
        title="Code de retrait"
        description="Validation à deux facteurs."
        state="active"
      />,
    )
    expect(screen.getByRole('heading', { name: 'Code de retrait' })).toBeInTheDocument()
    expect(screen.getByText('Validation à deux facteurs.')).toBeInTheDocument()
    expect(screen.getByText('Activé')).toBeInTheDocument()
  })

  it('NanaTransactionCard affiche le titre et le montant', () => {
    render(<NanaTransactionCard title="Paiement d’épargne" amount={25000} />)
    expect(screen.getByText('Paiement d’épargne')).toBeInTheDocument()
    expect(screen.getByText(/25\s*000/)).toBeInTheDocument()
  })

  it('NanaPhotoCard compose label, montant, objectif et action', () => {
    render(
      <NanaPhotoCard
        label="Comptes"
        amount={850000}
        caption="Épargne progressive"
        title="Objectif"
        progress={{ value: 68, tone: 'gold' }}
        actionLabel="Épargne automatique"
      />,
    )
    expect(screen.getByText('Comptes')).toBeInTheDocument()
    expect(screen.getByText(/850\s*000/)).toBeInTheDocument()
    expect(screen.getByText('Épargne progressive')).toBeInTheDocument()
    expect(screen.getByText('Objectif')).toBeInTheDocument()
    expect(screen.getByText('Épargne automatique')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '68')
  })

  it('NanaPhotoCard déclenche l’action quand elle n’est pas interactive', () => {
    const onAction = vi.fn()
    render(<NanaPhotoCard title="Objectif" actionLabel="Continuer" onAction={onAction} />)
    screen.getByRole('button', { name: /Continuer/ }).click()
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('les variantes photo préservent leur identité et leur action', () => {
    const { container } = render(
      <>
        <SavingsPhotoCard label="a" amount={1} />
        <TravelPhotoCard label="b" amount={1} />
        <FamilyPhotoCard label="c" amount={1} />
        <BusinessPhotoCard label="d" amount={1} />
        <GoalPhotoCard label="e" amount={1} />
        <LifestylePhotoCard label="f" amount={1} />
      </>,
    )
    for (const variant of ['savings', 'travel', 'family', 'business', 'goal', 'lifestyle']) {
      expect(container.querySelector(`[data-variant="${variant}"]`)).not.toBeNull()
    }
    expect(screen.getByText('Épargne automatique')).toBeInTheDocument()
    expect(screen.getByText('Planifier le voyage')).toBeInTheDocument()
    expect(screen.getByText('Préparer le projet')).toBeInTheDocument()
    expect(screen.getByText('Développer l’activité')).toBeInTheDocument()
    expect(screen.getByText('Continuer l’épargne')).toBeInTheDocument()
    expect(screen.getByText('Découvrir')).toBeInTheDocument()
  })

  it('NanaAccountCard affiche label, numéro et solde', () => {
    render(<NanaAccountCard label="Coffre NanoPay" number="•••• 4821" amount={512000} />)
    expect(screen.getByText('Coffre NanoPay')).toBeInTheDocument()
    expect(screen.getByText('•••• 4821')).toBeInTheDocument()
    expect(screen.getByText(/512\s*000/)).toBeInTheDocument()
  })
})
