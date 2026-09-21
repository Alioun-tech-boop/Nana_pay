import type { NavigationItem } from '../design-system'
import type { UserRole } from '../types'

export interface RoleNavExtras {
  cartCount: number
  unreadCount: number
}

export interface RoleNavigation {
  subtitle: string
  items: NavigationItem[]
  mobileItems: NavigationItem[]
  pageTitles: Record<string, string>
}

export function homePathForRole(role: UserRole): string {
  if (role === 'MERCHANT') return '/merchant'
  if (role === 'BANK') return '/bank'
  if (role === 'ADMIN') return '/admin'
  return '/dashboard'
}

export function activeSectionFor(role: UserRole, segments: string[]): string {
  if (role === 'CLIENT') {
    const root = segments[0]
    if (!root) return 'dashboard'
    if (root === 'shops' || root === 'products') return 'marketplace'
    if (root === 'checkout') return 'cart'
    return root
  }
  return segments[1] ?? 'dashboard'
}

const CLIENT_PAGE_TITLES: Record<string, string> = {
  dashboard: 'Tableau de bord',
  marketplace: 'Marketplace',
  search: 'Recherche',
  cart: 'Panier',
  purchases: 'Mes achats',
  history: 'Historique',
  savings: 'Épargne progressive',
  vault: 'Coffre NanoPay',
  credit: 'Crédit bancaire',
  orders: 'Commande',
  profile: 'Profil',
  notifications: 'Notifications',
}

function clientNavigation(extras: RoleNavExtras): RoleNavigation {
  const cartBadge = extras.cartCount > 0 ? String(extras.cartCount) : undefined
  const unreadBadge = extras.unreadCount > 0 ? String(extras.unreadCount) : undefined
  return {
    subtitle: 'NanoPay · Espace client',
    pageTitles: CLIENT_PAGE_TITLES,
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'home', group: 'Découvrir' },
      { id: 'marketplace', label: 'Marketplace', icon: 'shop', group: 'Découvrir' },
      { id: 'search', label: 'Recherche', icon: 'search', group: 'Découvrir' },
      { id: 'purchases', label: 'Mes achats', icon: 'receipt', group: 'Ma commande' },
      { id: 'cart', label: 'Panier', icon: 'wallet', group: 'Ma commande', badge: cartBadge },
      { id: 'history', label: 'Historique', icon: 'clock', group: 'Ma commande' },
      { id: 'savings', label: 'Épargne progressive', icon: 'coins', group: 'Financement' },
      { id: 'vault', label: 'Coffre NanoPay', icon: 'vault', group: 'Financement' },
      { id: 'credit', label: 'Crédit bancaire', icon: 'bank', group: 'Financement' },
      { id: 'notifications', label: 'Notifications', icon: 'alert', group: 'Compte', badge: unreadBadge },
      { id: 'profile', label: 'Profil', icon: 'user', group: 'Compte' },
    ],
    mobileItems: [
      { id: 'dashboard', label: 'Accueil', icon: 'home' },
      { id: 'marketplace', label: 'Marketplace', icon: 'shop' },
      { id: 'cart', label: 'Panier', icon: 'wallet', badge: cartBadge },
      { id: 'purchases', label: 'Achats', icon: 'receipt' },
      { id: 'menu', label: 'Plus', icon: 'more' },
    ],
  }
}

function merchantNavigation(): RoleNavigation {
  return {
    subtitle: 'NanoPay · Espace commerçant',
    pageTitles: {
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      scan: 'Scanner QR',
      payments: 'Paiements',
      products: 'Produits',
      store: 'Boutique',
      history: 'Historique',
      profile: 'Profil',
    },
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'home', group: 'Opérations' },
      { id: 'orders', label: 'Commandes', icon: 'receipt', group: 'Opérations' },
      { id: 'scan', label: 'Scanner QR', icon: 'scan', group: 'Opérations' },
      { id: 'payments', label: 'Paiements', icon: 'wallet', group: 'Opérations' },
      { id: 'products', label: 'Produits', icon: 'box', group: 'Catalogue' },
      { id: 'store', label: 'Boutique', icon: 'shop', group: 'Catalogue' },
      { id: 'history', label: 'Historique', icon: 'clock', group: 'Compte' },
      { id: 'profile', label: 'Profil', icon: 'user', group: 'Compte' },
    ],
    mobileItems: [
      { id: 'dashboard', label: 'Accueil', icon: 'home' },
      { id: 'orders', label: 'Commandes', icon: 'receipt' },
      { id: 'scan', label: 'Scanner', icon: 'scan' },
      { id: 'products', label: 'Produits', icon: 'box' },
      { id: 'menu', label: 'Plus', icon: 'more' },
    ],
  }
}

function bankNavigation(): RoleNavigation {
  return {
    subtitle: 'NanoPay · Espace banque',
    pageTitles: {
      dashboard: 'Tableau de bord',
      requests: 'Demandes de crédit',
      profiles: 'Profils clients',
      credits: 'Crédits acceptés',
      transfers: 'Virements',
      settlements: 'Règlements',
      history: 'Historique',
      profile: 'Profil',
    },
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'home', group: 'Analyse' },
      { id: 'requests', label: 'Demandes de crédit', icon: 'receipt', group: 'Analyse' },
      { id: 'profiles', label: 'Profils clients', icon: 'user', group: 'Analyse' },
      { id: 'credits', label: 'Crédits acceptés', icon: 'coins', group: 'Portefeuille' },
      { id: 'transfers', label: 'Virements', icon: 'bank', group: 'Portefeuille' },
      { id: 'settlements', label: 'Règlements', icon: 'check-circle', group: 'Portefeuille' },
      { id: 'history', label: 'Historique', icon: 'clock', group: 'Compte' },
      { id: 'profile', label: 'Profil', icon: 'user', group: 'Compte' },
    ],
    mobileItems: [
      { id: 'dashboard', label: 'Accueil', icon: 'home' },
      { id: 'requests', label: 'Demandes', icon: 'receipt' },
      { id: 'profiles', label: 'Clients', icon: 'user' },
      { id: 'credits', label: 'Crédits', icon: 'coins' },
      { id: 'menu', label: 'Plus', icon: 'more' },
    ],
  }
}

function adminNavigation(): RoleNavigation {
  return {
    subtitle: 'NanoPay · Supervision',
    pageTitles: {
      dashboard: 'Tableau de bord',
      clients: 'Clients',
      merchants: 'Commerçants',
      kyc: 'Vérifications KYC',
      orders: 'Commandes',
      payments: 'Paiements',
      savings: 'Épargnes',
      vaults: 'Coffres',
      credits: 'Crédits',
      qr: 'QR de retrait',
      withdrawals: 'Retraits',
      settlements: 'Règlements',
      transactions: 'Transactions',
      audit: 'Journal d’audit',
      profile: 'Profil',
    },
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'home', group: 'Supervision' },
      { id: 'clients', label: 'Clients', icon: 'user', group: 'Supervision' },
      { id: 'merchants', label: 'Commerçants', icon: 'shop', group: 'Supervision' },
      { id: 'kyc', label: 'Vérifications KYC', icon: 'shield', group: 'Supervision' },
      { id: 'orders', label: 'Commandes', icon: 'receipt', group: 'Supervision' },
      { id: 'payments', label: 'Paiements', icon: 'wallet', group: 'Supervision' },
      { id: 'savings', label: 'Épargnes', icon: 'coins', group: 'Financement' },
      { id: 'vaults', label: 'Coffres', icon: 'vault', group: 'Financement' },
      { id: 'credits', label: 'Crédits', icon: 'bank', group: 'Financement' },
      { id: 'qr', label: 'QR de retrait', icon: 'qr', group: 'Opérations' },
      { id: 'withdrawals', label: 'Retraits', icon: 'scan', group: 'Opérations' },
      { id: 'settlements', label: 'Règlements', icon: 'check-circle', group: 'Opérations' },
      { id: 'transactions', label: 'Transactions', icon: 'clock', group: 'Opérations' },
      { id: 'audit', label: 'Journal d’audit', icon: 'settings', group: 'Système' },
      { id: 'profile', label: 'Profil', icon: 'user', group: 'Système' },
    ],
    mobileItems: [
      { id: 'dashboard', label: 'Accueil', icon: 'home' },
      { id: 'clients', label: 'Clients', icon: 'user' },
      { id: 'merchants', label: 'Marchands', icon: 'shop' },
      { id: 'transactions', label: 'Transactions', icon: 'clock' },
      { id: 'menu', label: 'Plus', icon: 'more' },
    ],
  }
}

export function getRoleNavigation(role: UserRole, extras: RoleNavExtras): RoleNavigation {
  if (role === 'MERCHANT') return merchantNavigation()
  if (role === 'BANK') return bankNavigation()
  if (role === 'ADMIN') return adminNavigation()
  return clientNavigation(extras)
}

export function roleRootFor(role: UserRole): string {
  return homePathForRole(role)
}
