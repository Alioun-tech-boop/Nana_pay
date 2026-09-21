import { useParams } from 'react-router-dom'
import { Button, EmptyState, ErrorState, Section, Text } from '../../../design-system'
import { marketplaceService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { PageHeader, StoreHero } from '../../../components/client'
import { ProductShelf } from '../components/ProductShelf'
import viewStyles from '../../../components/client/view.module.css'

export function StorePage() {
  const { merchantId = '' } = useParams()

  const merchant = useRequest(
    () => marketplaceService.getMerchant(merchantId),
    { deps: [merchantId] },
  )
  const products = useRequest(
    () => marketplaceService.getMerchantProducts(merchantId, { pageSize: 48 }),
    { deps: [merchantId] },
  )

  if (merchant.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader title="Boutique" />
        <ErrorState
          title="Boutique introuvable"
          description={toUserMessage(merchant.error)}
          onRetry={() => void merchant.refresh()}
        />
      </div>
    )
  }

  return (
    <div className={viewStyles.page}>
      {merchant.isLoading ? (
        <section className={viewStyles.surface}>
          <Text muted>Chargement de la boutique…</Text>
        </section>
      ) : merchant.data ? (
        <>
          <StoreHero merchant={merchant.data} />
          <Section title="Produits de la boutique">
            <ProductShelf
              products={products.data?.items ?? []}
              loading={products.isLoading}
              skeletonCount={9}
            />
            {products.isSuccess && (products.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                icon="box"
                title="Aucun produit pour le moment"
                description="Cette boutique n’a pas encore de produits disponibles en ligne."
              />
            ) : null}
          </Section>
          <div>
            <Button variant="ghost" onClick={() => void products.refresh()}>
              Actualiser les produits
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}