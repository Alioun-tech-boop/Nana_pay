import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../../components/providers/AppProviders'
import { api } from '../../api'
import { mockTransport } from '../../api/mockTransport'
import { LandingPage } from '../auth/pages/LandingPage'
import { AuthStartPage } from '../auth/pages/AuthStartPage'
import { RegisterPage } from '../auth/pages/RegisterPage'
import { LoginPage } from '../auth/pages/LoginPage'
import { VerifyPage } from '../auth/pages/VerifyPage'
import { authService } from '../../services/authService'

/**
 * Parcours d'ouverture verrouillé :
 * 1. `/`  : fond animé + UN seul bouton « Suivant » (aucun autre texte/carte).
 * 2. `/auth` : uniquement « Créer un compte » et « Se connecter ».
 * 3. `/register` : e-mail/téléphone + mot de passe + politique de confidentialité,
 *    rien d'autre (pas de prénom, pas de nom, pas de date de naissance).
 */

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>,
  )
}

describe('Onboarding', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(mockTransport)
    api.setTokenProvider(() => null)
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  it('l’écran d’ouverture ne contient qu’un bouton Suivant', () => {
    renderWithProviders(<LandingPage />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName(/suivant/i)
  })

  it('l’écran de choix ne contient que les deux liens d’authentification', () => {
    renderWithProviders(<AuthStartPage />)

    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /créer un compte/i })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(screen.getByRole('link', { name: /se connecter/i })).toHaveAttribute('href', '/login')
  })

  it('l’inscription ne demande que le contact, le mot de passe et la politique', () => {
    renderWithProviders(<RegisterPage />)

    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /politique de confidentialité/i })).toBeInTheDocument()

    // Aucun champ hérité de l'ancien parcours multi-étapes.
    expect(screen.queryByLabelText(/prénom/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^nom$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/date de naissance/i)).not.toBeInTheDocument()
  })

  it('envoie une inscription sans prénom ni nom', async () => {
    const register = vi.spyOn(authService, 'register').mockResolvedValue({
      id: 'user-1',
      fullName: 'ada',
      email: 'ada@example.com',
      phone: '',
      status: 'PENDING_VERIFICATION',
    })
    const user = userEvent.setup()

    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'motdepasse')
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'motdepasse')
    await user.click(screen.getByRole('checkbox', { name: /politique de confidentialité/i }))
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    expect(register).toHaveBeenCalledTimes(1)
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: '',
        lastName: '',
        email: 'ada@example.com',
        password: 'motdepasse',
      }),
    )
  })
})

/**
 * Les écrans Connexion et Vérification reprennent le cadre sombre du parcours
 * d'ouverture, et ne doivent jamais exposer d'identifiants de démonstration
 * (le code frontend est public — AGENTS.md §29).
 */
describe('Écrans d’authentification', () => {
  beforeEach(() => {
    api.clearCache()
    api.setTransportForTests(mockTransport)
    api.setTokenProvider(() => null)
    api.setRefreshProvider(async () => 'failed')
    api.setAuthenticationFailureHandler(() => {})
  })

  it('la connexion demande un identifiant et un mot de passe, sans identifiants de démo', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByLabelText(/e-mail ou numéro de téléphone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()

    // Aucun mot de passe ni compte de démonstration affiché.
    expect(screen.queryByText(/démo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/correct/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/commercant@nanapay/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/admin@nanapay/i)).not.toBeInTheDocument()
  })

  it('la vérification ne divulgue pas de code de démonstration', () => {
    renderWithProviders(<VerifyPage />)

    expect(screen.getByRole('button', { name: /vérifier mon compte/i })).toBeInTheDocument()
    expect(screen.queryByText(/000000/)).not.toBeInTheDocument()
  })
})
