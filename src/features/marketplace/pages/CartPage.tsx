import { Link, useNavigate } from 'react-router-dom'
import { Button, EmptyState, Icon, MoneyAmount, StatusPill, Text } from '../../../design-system'
import { PageHeader, ProductTile, QuantityPicker } from '../../../components/client'
import { useCart } from '../../../stores/cart'
import { productVisual } from '../lib/visual'
import viewStyles from '../../../components/client/view.module.css'
import styles from './cart.module.css'

export function CartPage() {
  const navigate = useNavigate()
  const { lines, subtotal, setQuantity, remove, clear } = useCart()

  if (lines.length === 0) {
    return (
      <div className={viewStyles.page}>
        <PageHeader backTo="/marketplace" title="Panier" />
        <EmptyState
          icon="wallet"
          title="Votre panier est vide"
          description={
            <Text muted>
              Découvrez les produits disponibles et ajoutez votre premier article.
            </Text>
          }
          action={
            <Link to="/marketplace">
              <Button leadingIcon={<Icon name="shop" size={16} />}>Explorer le marketplace</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className={viewStyles.page}>
      <PageHeader
        title="Panier"
        actions={
          <Button variant="ghost" size="sm" leadingIcon={<Icon name="close" size={14} />} onClick={clear}>
            Vider le panier
          </Button>
        }
      />

      <div className={styles.layout}>
        <div className={styles.lines}>
          {lines.map((line) => {
            const visual = productVisual(line.product)
            const available = line.product.stock.available && line.product.status === 'ACTIVE'
            return (
              <article key={line.product.id} className={styles.line}>
                <ProductTile icon={visual.icon} accent={visual.accent} size="sm" />
                <div className={styles.lineInfo}>
                  <h3 className={styles.lineName}>{line.product.name}</h3>
                  <p className={styles.lineMeta}>
                    <StatusPill
                      tone={available ? 'success' : 'neutral'}
                      label={available ? 'En stock' : 'Rupture'}
                    />
                    <span className={viewStyles.tiny}>{line.product.categoryId ?? ''}</span>
                  </p>
                </div>
                <div className={styles.lineQty}>
                  <QuantityPicker
                    value={line.quantity}
                    onChange={(next) => setQuantity(line.product.id, next)}
                    min={1}
                    max={Math.max(1, line.product.stock.quantity)}
                  />
                </div>
                <div className={styles.linePrice}>
                  <MoneyAmount amount={line.product.price.amount * line.quantity} currency={line.product.price.currency} />
                </div>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => remove(line.product.id)}
                  aria-label={`Retirer ${line.product.name} du panier`}
                >
                  <Icon name="close" size={16} />
                </button>
              </article>
            )
          })}
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Récapitulatif</h2>
          <div className={styles.summaryRow}>
            <span>Sous-total</span>
            <MoneyAmount amount={subtotal?.amount ?? 0} currency={subtotal?.currency ?? 'XOF'} noSymbol />
          </div>
          <div className={viewStyles.divider} />
          <div className={styles.summaryTotal}>
            <span>Total commande</span>
            <MoneyAmount amount={subtotal?.amount ?? 0} currency={subtotal?.currency ?? 'XOF'} />
          </div>
          <Button size="lg" fullWidth onClick={() => navigate('/checkout')}>
            Continuer
          </Button>
        </aside>
      </div>
    </div>
  )
}