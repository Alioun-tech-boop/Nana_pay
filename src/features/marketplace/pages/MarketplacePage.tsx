import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Select,
  Section,
  Skeleton,
  Text,
} from '../../../design-system'
import { marketplaceService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { MerchantShelf } from '../components/MerchantShelf'
import { ProductShelf } from '../components/ProductShelf'
import styles from './marketplace.module.css'
import viewStyles from '../../../components/client/view.module.css'
const heroImage = '/assets/wakefield-market.jpeg'

function useDebounced(value: string, delay = 350): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') ?? ''
  const city = params.get('city') ?? ''
  const commune = params.get('commune') ?? ''

  const [term, setTerm] = useState(initialQ)
  const debouncedTerm = useDebounced(term)
  const appliedQuery = useRef(initialQ)
  const [showSearch, setShowSearch] = useState(false)

  const meta = useRequest(() => marketplaceService.getMerchantMeta(), { deps: [] })
  const merchants = useRequest(
    () =>
      marketplaceService.getMerchants({
        q: appliedQuery.current || undefined,
        city: city || undefined,
        commune: commune || undefined,
        pageSize: 30,
      }),
    { deps: [city, commune, appliedQuery.current] },
  )
  const products = useRequest(
    () =>
      marketplaceService.getProducts({
        q: appliedQuery.current || undefined,
        pageSize: 30,
      }),
    { deps: [appliedQuery.current] },
  )

  useEffect(() => {
    if (debouncedTerm === appliedQuery.current) return
    appliedQuery.current = debouncedTerm
    const next = new URLSearchParams(params)
    if (debouncedTerm) next.set('q', debouncedTerm)
    else next.delete('q')
    setParams(next, { replace: true })
  }, [debouncedTerm, params, setParams])

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'city') next.delete('commune')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }

  const reset = () => {
    setTerm('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const hasFilters = initialQ.length > 0 || city.length > 0 || commune.length > 0
  const hasError = merchants.isError || products.isError
  const loading = merchants.isLoading || products.isLoading || meta.isLoading
  const empty = merchants.isSuccess && products.isSuccess && !loading && (merchants.data?.items.length ?? 0) === 0 && (products.data?.items.length ?? 0) === 0

  const cities = meta.data?.cities ?? []
  const communes = useMemo(() => (city ? (meta.data?.communes[city] ?? []) : []), [city, meta.data])

  // Auto-select the only city if there's only one and no city is selected
  useEffect(() => {
    if (cities.length === 1 && !city) {
      const next = new URLSearchParams(params)
      next.set('city', cities[0])
      setParams(next, { replace: true })
    }
  }, [cities, city, params, setParams])

  const handleSearchChange = (value: string) => {
    setTerm(value)
  }

  const handleSearchSubmit = (value: string) => {
    setTerm(value)
    setShowSearch(false)
  }

  return (
    <div className={viewStyles.page}>
      <header
        className={styles.hero}
        style={{ backgroundImage: `url(${heroImage})` }}
        role="banner"
      >
        <div className={styles.heroOverlay}>
          <div className={styles.heroTop}>
            <h1 className={styles.heroTitle}>Marketplace</h1>
            <button
              className={styles.searchIconBtn}
              onClick={() => setShowSearch(true)}
              aria-label="Rechercher"
            >
              <Icon name="search" size={22} />
            </button>
          </div>
          <div className={styles.heroControls}>
            <div className={styles.filters}>
              <Select
                label="Ville"
                value={city}
                onChange={(event) => updateFilter('city', event.target.value)}
                aria-label="Filtrer par ville"
              >
                <option value="">Toutes les villes</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select
                label="Commune"
                value={commune}
                onChange={(event) => updateFilter('commune', event.target.value)}
                disabled={communes.length === 0}
                aria-label="Filtrer par commune"
              >
                <option value="">Toutes les communes</option>
                {communes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              {hasFilters ? (
                <span className={styles.reset}>
                  <Button variant="ghost" size="sm" leadingIcon={<Icon name="close" size={14} />} onClick={reset}>
                    Réinitialiser
                  </Button>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {showSearch && (
        <div className={styles.searchModal} onClick={() => setShowSearch(false)} role="dialog" aria-modal="true" aria-label="Recherche">
          <div className={styles.searchModalContent} onClick={(e) => e.stopPropagation()}>
            <label htmlFor="marketplace-search" className={styles.searchModalLabel}>
              Rechercher un produit ou une boutique
            </label>
            <input
              id="marketplace-search"
              type="search"
              className={styles.searchModalInput}
              value={term}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e.currentTarget.value)}
              placeholder="Smartphone, machine à coudre, électroménager…"
              autoFocus
            />
            <div className={styles.searchModalActions}>
              <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={() => handleSearchSubmit(term)}>
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasError ? (
        <ErrorState
          title="La marketplace n'a pas pu être chargée"
          description={merchants.error ? toUserMessage(merchants.error) : toUserMessage(products.error as Error)}
          onRetry={() => {
            void merchants.refresh()
            void products.refresh()
          }}
        />
      ) : empty ? (
        <EmptyState
          icon="search"
          title="Aucun résultat"
          description={
            <Text muted>
              Aucun produit ou boutique ne correspond à vos critères. Modifiez la recherche ou réinitialisez les filtres.
            </Text>
          }
          action={
            <Button onClick={reset} variant="secondary">
              Réinitialiser la recherche
            </Button>
          }
        />
      ) : (
        <>
          <Section
            title="Boutiques"
            actions={
              <Link to="/search" className={styles.seeAll}>
                Voir tout
                <Icon name="arrow-right" size={14} />
              </Link>
            }
          >
            {meta.isLoading ? <Skeleton width={220} height={16} /> : <MerchantShelf merchants={merchants.data?.items ?? []} loading={merchants.isLoading} count={6} />}
          </Section>

          <Section
            title="Produits disponibles"
            actions={
              <Link to="/search" className={styles.seeAll}>
                Tous les produits
                <Icon name="arrow-right" size={14} />
              </Link>
            }
          >
            <ProductShelf products={products.data?.items ?? []} loading={products.isLoading} count={9} />
          </Section>
        </>
      )}
    </div>
  )
}