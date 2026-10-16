import { EmptyState, ErrorState, Section } from '../../../design-system'
import { marketplaceService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { MerchantShelf } from '../components/MerchantShelf'
import { MarketplaceNav } from '../components/MarketplaceNav'
import styles from './marketplace.module.css'
import viewStyles from '../../../components/client/view.module.css'

const heroImage = '/assets/wakefield-market.jpeg'

export function BoutiquesPage() {
  const merchants = useRequest(() => marketplaceService.getMerchants({ pageSize: 30 }), {
    deps: [],
  })
  const merchantCount = merchants.data?.items.length ?? 0
  const empty = merchants.isSuccess && !merchants.isLoading && merchantCount === 0

  return (
    <div className={viewStyles.page}>
      <header
        className={styles.hero}
        style={{ backgroundImage: `url(${heroImage})` }}
        role="banner"
      >
        <div className={styles.heroOverlay}>
          <div className={styles.heroTop}>
            <h1 className={styles.heroTitle}>Boutiques</h1>
          </div>
          <MarketplaceNav active="shops" />
        </div>
      </header>

      {merchants.isError ? (
        <ErrorState
          title="Les boutiques n'ont pas pu être chargées"
          description={toUserMessage(merchants.error as Error)}
          onRetry={() => void merchants.refresh()}
        />
      ) : empty ? (
        <EmptyState
          icon="shop"
          title="Aucune boutique pour le moment"
          description="De nouvelles boutiques rejoignent la marketplace régulièrement."
        />
      ) : (
        <Section title={`Toutes les boutiques (${merchantCount})`}>
          <MerchantShelf
            merchants={merchants.data?.items ?? []}
            loading={merchants.isLoading}
            skeletonCount={6}
          />
        </Section>
      )}
    </div>
  )
}