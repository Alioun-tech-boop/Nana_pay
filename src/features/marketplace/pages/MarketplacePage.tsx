import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  cx,
  EmptyState,
  ErrorState,
  Icon,
  Section,
  Text,
} from '../../../design-system'
import { marketplaceService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { ProductShelf } from '../components/ProductShelf'
import { MarketplaceNav } from '../components/MarketplaceNav'
import { buildCategoryOptions, type ProductCategoryOption } from '../lib/categories'
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
  const categoryId = params.get('category') ?? ''

  const [term, setTerm] = useState(initialQ)
  const debouncedTerm = useDebounced(term)
  const appliedQuery = useRef(initialQ)
  const [showSearch, setShowSearch] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<ProductCategoryOption[]>([])

  const products = useRequest(
    () =>
      marketplaceService.getProducts({
        q: appliedQuery.current || undefined,
        categoryId: categoryId || undefined,
        pageSize: 30,
      }),
    { deps: [appliedQuery.current, categoryId] },
  )

  // Options de filtre déduites des produits renvoyés par le backend.
  // Union monotone : un filtre actif ne fait jamais rétrécir la liste connue.
  useEffect(() => {
    if (!products.data) return
    const fetched = buildCategoryOptions(products.data.items)
    setCategoryOptions((previous) => {
      const map = new Map(previous.map((option) => [option.id, option]))
      for (const option of fetched) {
        if (!map.has(option.id)) map.set(option.id, option)
      }
      return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    })
  }, [products.data])

  useEffect(() => {
    if (debouncedTerm === appliedQuery.current) return
    appliedQuery.current = debouncedTerm
    const next = new URLSearchParams(params)
    if (debouncedTerm) next.set('q', debouncedTerm)
    else next.delete('q')
    setParams(next, { replace: true })
  }, [debouncedTerm, params, setParams])

  const selectCategory = (next: string) => {
    const nextParams = new URLSearchParams(params)
    if (next) nextParams.set('category', next)
    else nextParams.delete('category')
    if (nextParams.toString() !== params.toString()) setParams(nextParams, { replace: true })
  }

  const reset = () => {
    setTerm('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const handleSearchChange = (value: string) => {
    setTerm(value)
  }

  const handleSearchSubmit = (value: string) => {
    setTerm(value)
    setShowSearch(false)
  }

  const hasProducts = (products.data?.items.length ?? 0) > 0
  const empty = products.isSuccess && !products.isLoading && !hasProducts

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
          <MarketplaceNav active="products" />
        </div>
      </header>

      {showSearch && (
        <div
          className={styles.searchModal}
          onClick={() => setShowSearch(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Recherche"
        >
          <div className={styles.searchModalContent} onClick={(e) => e.stopPropagation()}>
            <label htmlFor="marketplace-search" className={styles.searchModalLabel}>
              Rechercher un produit
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

      {products.isError ? (
        <ErrorState
          title="Les produits n'ont pas pu être chargés"
          description={toUserMessage(products.error as Error)}
          onRetry={() => void products.refresh()}
        />
      ) : empty ? (
        <EmptyState
          icon="search"
          title="Aucun produit"
          description={
            <Text muted>
              Aucun produit ne correspond à vos critères. Modifiez la recherche ou réinitialisez
              les filtres.
            </Text>
          }
          action={
            <Button onClick={reset} variant="secondary">
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <Section title="Produits disponibles">
          {categoryOptions.length > 0 ? (
            <div className={styles.categoryBar} role="group" aria-label="Filtrer par type de produit">
              <button
                type="button"
                className={cx(styles.categoryChip, !categoryId && styles.categoryChipActive)}
                aria-pressed={!categoryId}
                onClick={() => selectCategory('')}
              >
                Tous
              </button>
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cx(styles.categoryChip, categoryId === option.id && styles.categoryChipActive)}
                  aria-pressed={categoryId === option.id}
                  onClick={() => selectCategory(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {products.isLoading ? (
            <ProductShelf products={[]} loading skeletonCount={6} />
          ) : (
            <ProductShelf products={products.data?.items ?? []} />
          )}
        </Section>
      )}
    </div>
  )
}