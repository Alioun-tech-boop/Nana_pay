/**
 * Persistance de session côté navigateur.
 *
 * Règle stricte (AGENTS.md §51) : on ne stocke QUE le refresh token, et
 * uniquement parce que la survie de la session au rechargement l'exige. Aucune
 * donnée financière (solde, statut de paiement, validation de crédit,
 * autorisation de retrait) n'est jamais persistée : elle est toujours relue
 * depuis le backend.
 *
 * Le refresh token est opaque et ne peut pas être décodé côté navigateur : il ne
 * sert qu'à `POST /auth/refresh`.
 */

const STORAGE_KEY = 'nanapay.session.refreshToken'

/**
 * Clé STABLE, volontairement indépendante du mode API.
 *
 * Faire dépendre la clé du mode (« .mock » / « .real ») orphelinait le jeton dès
 * qu'on changeait de mode — et rendait la session impossible à retrouver si le
 * mode était mal configuré. La valeur est de toute façon inutilisable auprès
 * d'un autre backend : `POST /auth/refresh` la refuse, et l'application repasse
 * simplement en visiteur anonyme.
 */
function storageKey(): string {
  return STORAGE_KEY
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    // Mode navigation privée ou stockage bloqué : la session ne survivra pas au
    // rechargement, mais l'application reste utilisable.
    return null
  }
}

export function readStoredRefreshToken(): string | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const value = storage.getItem(storageKey())
    return value && value.length > 0 ? value : null
  } catch {
    return null
  }
}

export function saveRefreshToken(refreshToken: string): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(storageKey(), refreshToken)
  } catch {
    /* quota atteint ou stockage refusé : la session reste en mémoire */
  }
}

export function clearStoredRefreshToken(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(storageKey())
  } catch {
    /* rien à faire : il n'y a plus rien à effacer */
  }
}
