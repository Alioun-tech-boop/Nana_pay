import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Badge,
  Button,
  ErrorState,
  Icon,
  MoneyAmount,
  StatusPill,
  Text,
} from '../../../design-system'
import { marketplaceService } from '../../../services'
import { useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { useCart } from '../../../stores/cart'
import { useToast } from '../../../design-system'
import { PageHeader, ProductTile, QuantityPicker } from '../../../components/client'
import { productVisual } from '../lib/visual'
import viewStyles from '../../../components/client/view.module.css'
import styles from './productDetail.module.css'

export function ProductPage() {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const { toast } = useToast()

  const [quantity, setQuantity] = useState(1)

  const product = useRequest(() => marketplaceService.getProduct(productId), { deps: [productId] })

  const item = product.data
  const currentMerchantId = item?.merchantId ?? ''

  const merchant = useRequest(
    () => marketplaceService.getMerchant(currentMerchantId),
    { enabled: currentMerchantId.length > 0 && product.isSuccess, deps: [currentMerchantId, product.isSuccess] },
  )

  const available = item ? item.stock.available && item.status === 'ACTIVE' : false
  const visual = item ? productVisual(item) : undefined
  const primaryImage = item?.images[0]

  function handleAdd() {
    if (!item) return
    add(item, quantity)
    toast({
      tone: 'success',
      title: 'Ajouté au panier',
      description: `${item.name} × ${quantity}`,
    })
  }

  if (product.isError) {
    return (
      <div className={viewStyles.page}>
        <PageHeader backTo="/marketplace" title="Produit" />
        <ErrorState
          title="Produit introuvable"
          description={toUserMessage(product.error)}
          onRetry={() => void product.refresh()}
        />
      </div>
    )
  }

  if (product.isLoading || !item || !visual) {
    return (
      <div className={viewStyles.page}>
        <PageHeader backTo="/marketplace" title="Produit" />
        <section className={styles.skeletonLayout} aria-hidden="true">
          <div className={styles.skeletonTile} />
          <div className={styles.skeletonInfo}>
            <div className={styles.skeletonLine} style={{ width: '70%' }} />
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={viewStyles.page}>
      <PageHeader backTo="/marketplace" eyebrow={item.categoryId ?? 'Produit'} title={item.name} />

      <div className={styles.layout}>
        <div className={styles.visualCol}>
          {primaryImage ? (
            <div className={styles.imageFrame}>
              <img
                src={primaryImage.url}
                alt={item.name}
                className={styles.productImage}
                width={primaryImage.width}
                height={primaryImage.height}
              />
            </div>
          ) : (
            <ProductTile icon={visual.icon} accent={visual.accent} size="lg" className={styles.tile} />
          )}
          <div className={styles.visualMeta}>
            <StatusPill tone={available ? 'success' : 'neutral'} label={available ? 'En stock' : 'Rupture de stock'} />
            {item.financingEligible ? (
              <Badge tone="info">Financement disponible</Badge>
            ) : (
              <Badge tone="neutral">Vente au comptant uniquement</Badge>
            )}
          </div>
        </div>

        <div className={styles.infoCol}>
          {merchant.data ? (
            <Link to={`/shops/${merchant.data.id}`} className={styles.storeLink}>
              <Icon name="shop" size={15} />
              {merchant.data.name} · <span className={viewStyles.tiny}>{merchant.data.commune}, {merchant.data.city}</span>
            </Link>
          ) : null}

          <div className={styles.priceBlock}>
            <p className={styles.priceLabel}>Prix</p>
            <MoneyAmount amount={item.price.amount} currency={item.price.currency} variant="display" />
          </div>

          <Text muted>{item.description}</Text>

          <div className={styles.buyRow}>
            <div className={styles.controlBox} aria-label="Quantité">
              <span className={styles.controlLabel}>Quantité</span>
              <QuantityPicker
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.max(1, item.stock.quantity)}
                disabled={!available}
              />
            </div>
            <div className={styles.actions}>
              {available ? (
                <>
                  <AddToCartButton
                    label="Ajouter au panier"
                    icon="wallet"
                    variant="secondary"
                    onClick={handleAdd}
                  />
                  <Button
                    size="lg"
                    leadingIcon={<Icon name="arrow-right" size={16} />}
                    onClick={() => {
                      handleAdd()
                      navigate('/cart')
                    }}
                  >
                    Commander
                  </Button>
                </>
              ) : (
                <Button size="lg" disabled>
                  Produit indisponible
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className={styles.financingNote}>
        Épargne progressive, Coffre NanoPay ou crédit bancaire : le financement est calculé par NanoPay à la création
        de la commande.
      </p>
    </div>
  )
}

interface AddToCartButtonProps {
  label: string
  icon: 'wallet'
  variant: 'secondary'
  onClick: () => void
}

function AddToCartButton({ label, icon, variant, onClick }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  return (
    <Button
      variant={variant}
      size="lg"
      leadingIcon={<Icon name={icon} size={16} />}
      onClick={() => {
        onClick()
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1800)
      }}
    >
      {added ? 'Ajouté ✓' : label}
    </Button>
  )
}