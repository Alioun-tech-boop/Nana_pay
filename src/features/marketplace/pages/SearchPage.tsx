import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, SearchInput, Section, Text } from '../../../design-system'
import { marketplaceService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { PageHeader } from '../../../components/client'
import { MerchantShelf } from '../components/MerchantShelf'
import { ProductShelf } from '../components/ProductShelf'
import viewStyles from '../../../components/client/view.module.css'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') ?? ''
  const [term, setTerm] = useState(initialQ)
  const applied = useRef(initialQ)

  const products = useRequest(
    () =>
      marketplaceService.getProducts({
        q: applied.current || undefined,
        pageSize: 40,
      }),
    { deps: [applied.current] },
  )
  const merchants = useRequest(
    () =>
      marketplaceService.getMerchants({
        q: applied.current || undefined,
        pageSize: 40,
      }),
    { deps: [applied.current] },
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applied.current = term.trim()
      const next = new URLSearchParams(params)
      if (term.trim()) next.set('q', term.trim())
      else next.delete('q')
      setParams(next, { replace: true })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [term, params, setParams])

  const loading = products.isLoading || merchants.isLoading
  const error = products.error ?? merchants.error
  const productCount = products.data?.items.length ?? 0
  const merchantCount = merchants.data?.items.length ?? 0
  const searching = applied.current.length > 0
  const isBrowseMode = applied.current.length === 0

  return (
    <div className={viewStyles.page}>
      <PageHeader title={isBrowseMode ? 'Tous les produits et boutiques' : 'Recherche'} />
      <SearchInput
        value={term}
        onChange={setTerm}
        label="Recherche"
        placeholder="Smartphone Nova X5, machine à coudre, ElectroPlus…"
        loading={products.isLoading}
        onClear={() => setTerm('')}
      />

      {error ? (
        <ErrorState
          title="La recherche a échoué"
          description={toUserMessage(error)}
          onRetry={() => {
            void products.refresh()
            void merchants.refresh()
          }}
        />
      ) : isBrowseMode && !loading ? (
        <>
          <Section title={`Tous les produits (${productCount})`}>
            <ProductShelf products={products.data?.items ?? []} loading={products.isLoading} skeletonCount={6} />
          </Section>
          <Section title={`Toutes les boutiques (${merchantCount})`}>
            <MerchantShelf merchants={merchants.data?.items ?? []} loading={merchants.isLoading} skeletonCount={3} />
          </Section>
        </>
      ) : searching && !loading && productCount === 0 && merchantCount === 0 ? (
        <EmptyState
          icon="search"
          title="Aucun résultat"
          description={
            <Text muted>
              Aucun produit ou boutique ne correspond à «&nbsp;{applied.current}&nbsp;». Essayez un autre terme.
            </Text>
          }
        />
      ) : searching && !loading ? (
        <>
          <Section title={`Produits (${productCount})`}>
            <ProductShelf products={products.data?.items ?? []} loading={products.isLoading} skeletonCount={6} />
          </Section>
          <Section title={`Boutiques (${merchantCount})`}>
            <MerchantShelf merchants={merchants.data?.items ?? []} loading={merchants.isLoading} skeletonCount={3} />
          </Section>
        </>
      ) : (
        <EmptyState
          icon="search"
          title="Lancez votre recherche"
          description={
            <Text muted>
              Saisissez un mot-clé pour afficher les produits et les boutiques correspondants.
            </Text>
          }
        />
      )}
    </div>
  )
}