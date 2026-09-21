import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Badge,
  Button,
  ErrorState,
  InlineAlert,
  Input,
  Metric,
  MoneyAmount,
  Skeleton,
  StatusPill,
  Textarea,
} from '../../../design-system'
import { merchantService } from '../../../services'
import { useMutation, useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { getStatusDefinition } from '../../../lib/status'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../merchant.module.css'

interface StoreForm {
  name: string
  description: string
  category: string
  city: string
  commune: string
  phone: string
  email: string
}

const EMPTY_FORM: StoreForm = {
  name: '',
  description: '',
  category: '',
  city: '',
  commune: '',
  phone: '',
  email: '',
}

export function MerchantStorePage() {
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  const store = useRequest(() => merchantService.getStore(), { deps: [] })

  useEffect(() => {
    if (!store.data || loaded) return
    const data = store.data
    setForm({
      name: data.name,
      description: data.description,
      category: data.category,
      city: data.city,
      commune: data.commune,
      phone: data.phone,
      email: data.email,
    })
    setLoaded(true)
  }, [store.data, loaded])

  const save = useMutation((state: StoreForm) => merchantService.updateStore(state), {
    onSuccess: () => {
      setSaved(true)
      void store.refresh()
    },
  })

  const update = <K extends keyof StoreForm>(key: K) => (value: StoreForm[K]) => {
    setSaved(false)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    void save.mutate(form)
  }

  if (store.isError) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Boutique" />
        <ErrorState
          title="Impossible de charger la boutique"
          description={toUserMessage(store.error)}
          onRetry={() => void store.refresh()}
        />
      </div>
    )
  }

  if (store.isLoading || !store.data) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Boutique" />
        <div className={proStyles.panel}>
          <Skeleton width={220} height={20} />
          <Skeleton width={320} height={16} />
          <Skeleton width={280} height={16} />
        </div>
      </div>
    )
  }

  const data = store.data
  const status = getStatusDefinition(data.status)

  return (
    <div className={proStyles.page}>
      <ProPageHeader
        title={data.name}
        meta={
          <>
            <StatusPill tone={status.tone} label={status.label} />
            <Badge tone={data.verified ? 'success' : 'warning'}>
              {data.verified ? 'Vérifiée' : 'Vérification en attente'}
            </Badge>
          </>
        }
      />

      <div className={proStyles.statGrid}>
        <Metric label="Note" icon="check-circle" value={data.rating.toFixed(1)} />
        <Metric label="Produits actifs" icon="box" value={`${data.activeProductsCount} / ${data.productsCount}`} />
        <Metric label="Commandes" icon="receipt" value={data.ordersCount} />
        <Metric
          label="Règlements en attente"
          icon="wallet"
          value={
            <MoneyAmount
              amount={data.pendingSettlement.amount}
              currency={data.pendingSettlement.currency}
              variant="strong"
            />
          }
        />
      </div>

      {saved ? <InlineAlert tone="success" title="Boutique mise à jour." /> : null}
      {save.isError ? (
        <InlineAlert tone="danger" title="Mise à jour impossible">
          {toUserMessage(save.error)}
        </InlineAlert>
      ) : null}

      <form className={styles.form} onSubmit={submit} noValidate>
        <Input label="Nom de la boutique" value={form.name} onChange={(event) => update('name')(event.target.value)} required />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => update('description')(event.target.value)}
          rows={4}
        />
        <div className={styles.formGrid}>
          <Input label="Catégorie" value={form.category} onChange={(event) => update('category')(event.target.value)} />
          <Input label="Ville" value={form.city} onChange={(event) => update('city')(event.target.value)} />
        </div>
        <div className={styles.formGrid}>
          <Input label="Commune" value={form.commune} onChange={(event) => update('commune')(event.target.value)} />
          <Input label="Téléphone" value={form.phone} onChange={(event) => update('phone')(event.target.value)} />
        </div>
        <Input
          label="Email professionnel"
          type="email"
          value={form.email}
          onChange={(event) => update('email')(event.target.value)}
        />
        <div className={styles.formActions}>
          <Button type="submit" loading={save.isLoading} disabled={!form.name.trim()}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  )
}
