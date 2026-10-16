import { describe, it, expect, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, useLocation } from 'react-router-dom'
import { EmptyState, MoneyAmount } from '../../design-system'
import { MarketplacePage } from '../../features/marketplace/pages/MarketplacePage'
import { BoutiquesPage } from '../../features/marketplace/pages/BoutiquesPage'
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage'
import { PaymentModePage } from '../../features/financing/pages/PaymentModePage'
import { AppProviders } from '../../components/providers/AppProviders'
import { api } from '../../api'
import { mockTransport } from '../../api/mockTransport'
import { AppError, toAppError, toUserMessage } from '../../lib/errors'

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname + location.search}</span>
}

describe('UX states', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(mockTransport)
    api.setTokenProvider(() => 'mock-access-token')
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  describe('MarketplacePage', () => {
    it('renders search, produit filters and produits after loading', async () => {
      render(
        <BrowserRouter>
          <AppProviders>
            <MarketplacePage />
          </AppProviders>
        </BrowserRouter>,
      )

      const searchBtn = await screen.findByRole('button', { name: /rechercher/i })
      expect(searchBtn).toBeInTheDocument()

      const productHeading = await screen.findByRole('heading', { name: /Produits disponibles/i })
      expect(productHeading).toBeInTheDocument()

      const produitsLink = await screen.findByRole('link', { name: /^Produits$/i })
      expect(produitsLink).toHaveAttribute('aria-current', 'page')

      const boutiquesLink = await screen.findByRole('link', { name: /^Boutiques$/i })
      expect(boutiquesLink).toBeInTheDocument()
      expect(boutiquesLink).not.toHaveAttribute('aria-current')

      expect(await screen.findByRole('button', { name: /Tous/i })).toBeInTheDocument()
    })
  })

  describe('BoutiquesPage', () => {
    it('renders boutiques with a switch back to produits', async () => {
      render(
        <BrowserRouter>
          <AppProviders>
            <BoutiquesPage />
          </AppProviders>
        </BrowserRouter>,
      )

      expect(await screen.findByRole('heading', { name: /^Boutiques$/i })).toBeInTheDocument()

      const boutiquesLink = await screen.findByRole('link', { name: /^Boutiques$/i })
      expect(boutiquesLink).toHaveAttribute('aria-current', 'page')

      const produitsLink = await screen.findByRole('link', { name: /^Produits$/i })
      expect(produitsLink).toBeInTheDocument()
      expect(produitsLink).not.toHaveAttribute('aria-current')

      expect(await screen.findByText(/Toutes les boutiques/)).toBeInTheDocument()
    })
  })

  describe('DashboardPage', () => {
    it('compose solde, action principale, actions rapides et sections', async () => {
      render(
        <BrowserRouter>
          <AppProviders>
            <DashboardPage />
          </AppProviders>
        </BrowserRouter>,
      )

      expect(screen.getByText('Votre solde')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Gérer mon coffre/i })).toBeInTheDocument()

      expect(screen.getByRole('navigation', { name: /Actions rapides/i })).toBeInTheDocument()
      for (const label of ['Épargner', 'Acheter', 'Retirer', 'Plus']) {
        expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument()
      }

      expect(await screen.findByText('Dépenses ce mois-ci')).toBeInTheDocument()
      expect(await screen.findByRole('heading', { name: /Transactions récentes/i })).toBeInTheDocument()
      expect(await screen.findByRole('heading', { name: /Vue d'ensemble/i })).toBeInTheDocument()
    })

    it('dirige « Gérer mon coffre » vers le coffre', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppProviders>
            <LocationProbe />
            <DashboardPage />
          </AppProviders>
        </MemoryRouter>,
      )

      fireEvent.click(await screen.findByRole('button', { name: /Gérer mon coffre/i }))

      expect(screen.getByTestId('location')).toHaveTextContent('/vault')
    })
  })

  describe('PaymentModePage', () => {
    it('propose les deux modes de paiement', async () => {
      render(
        <MemoryRouter initialEntries={['/payment-mode']}>
          <PaymentModePage />
        </MemoryRouter>,
      )

      expect((await screen.findAllByText('Choisir un mode de paiement')).length).toBeGreaterThan(0)
      expect(screen.getByText('Mobile Money')).toBeInTheDocument()
      expect(screen.getByText('Carte Bancaire')).toBeInTheDocument()
      expect(screen.queryByLabelText(/Montant à ajouter/i)).not.toBeInTheDocument()
    })
  })

  describe('EmptyState', () => {
    it('shows title, description and action', () => {
      render(
        <EmptyState
          icon="search"
          title="Aucun résultat"
          description="Essayez d’autres critères."
          action={<button type="button">Explorer</button>}
        />,
      )
      expect(screen.getByRole('heading', { name: 'Aucun résultat' })).toBeInTheDocument()
      expect(screen.getByText('Essayez d’autres critères.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Explorer' })).toBeInTheDocument()
    })
  })

  describe('MoneyAmount', () => {
    it('renders amount with thousand separator and currency', () => {
      render(<MoneyAmount amount={125000} currency="XOF" />)
      expect(screen.getByText(/125\s*000/)).toBeInTheDocument()
      expect(screen.getByText(/F\s*CFA/)).toBeInTheDocument()
    })
  })

  describe('error message translations', () => {
    it('translates technical network errors to user-friendly messages', () => {
      const error = toAppError(new TypeError('Network error'))
      expect(toUserMessage(error)).toContain('Impossible de joindre le serveur')
    })

    it('maps server error kind to friendly message', () => {
      const error = new AppError({ kind: 'server', status: 500 })
      expect(toUserMessage(error)).toMatch(/réessayez/i)
    })

    it('never surfaces raw technical messages', () => {
      expect(toUserMessage(toAppError(new Error('boom')))).toContain('réessayer')
      expect(toAppError(new Error('boom')).title).not.toBe('boom')
    })
  })
})
