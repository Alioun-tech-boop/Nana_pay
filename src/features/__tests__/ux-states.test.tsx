import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { EmptyState, MoneyAmount } from '../../design-system'
import { MarketplacePage } from '../../features/marketplace/pages/MarketplacePage'
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage'
import { AppProviders } from '../../components/providers/AppProviders'
import { api } from '../../api'
import { mockTransport } from '../../api/mockTransport'
import { AppError, toAppError, toUserMessage } from '../../lib/errors'

describe('UX states', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(mockTransport)
    api.setTokenProvider(() => 'mock-access-token')
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  describe('MarketplacePage', () => {
    it('renders search and content after loading', async () => {
      render(
        <BrowserRouter>
          <AppProviders>
            <MarketplacePage />
          </AppProviders>
        </BrowserRouter>,
      )

      const searchBtn = await screen.findByRole('button', { name: /rechercher/i })
      expect(searchBtn).toBeInTheDocument()

      const sectionHeading = await screen.findByRole('heading', { name: /^Boutiques$/i })
      expect(sectionHeading).toBeInTheDocument()

      const productHeading = await screen.findByRole('heading', { name: /Produits disponibles/i })
      expect(productHeading).toBeInTheDocument()
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
      expect(screen.getByRole('button', { name: /Ajouter de l'argent/i })).toBeInTheDocument()

      expect(screen.getByRole('navigation', { name: /Actions rapides/i })).toBeInTheDocument()
      for (const label of ['Recharger', 'Acheter', 'Retirer', 'Plus']) {
        expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument()
      }

      expect(await screen.findByText('Dépenses ce mois-ci')).toBeInTheDocument()
      expect(await screen.findByRole('heading', { name: /Transactions récentes/i })).toBeInTheDocument()
      expect(await screen.findByRole('heading', { name: /Vue d'ensemble/i })).toBeInTheDocument()
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