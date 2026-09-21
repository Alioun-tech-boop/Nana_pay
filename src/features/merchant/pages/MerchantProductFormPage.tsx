import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  ErrorState,
  InlineAlert,
  Input,
  Select,
  Skeleton,
  Switch,
  Textarea,
} from '../../../design-system'
import { merchantService } from '../../../services'
import { useMutation, useRequest } from '../../../hooks'
import { toUserMessage } from '../../../lib/errors'
import { ProPageHeader, proStyles } from '../../../components/pro'
import styles from '../merchant.module.css'

interface FormState {
  name: string
  description: string
  price: string
  stock: string
  categoryId: string
  financingEligible: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  stock: '0',
  categoryId: '',
  financingEligible: true,
  status: 'ACTIVE',
}

export function MerchantProductFormPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const isEdit = Boolean(productId)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loaded, setLoaded] = useState(!isEdit)

  const product = useRequest(() => merchantService.getProduct(productId ?? ''), {
    enabled: isEdit,
    deps: [productId],
  })

  useEffect(() => {
    if (!isEdit || !product.data || loaded) return
    const data = product.data
    setForm({
      name: data.name,
      description: data.description,
      price: String(data.price.amount),
      stock: String(data.stockQuantity),
      categoryId: data.categoryId ?? '',
      financingEligible: data.financingEligible,
      status: data.status,
    })
    setLoaded(true)
  }, [isEdit, product.data, loaded])

  const save = useMutation(
    async (state: FormState) => {
      const priceAmount = Number.parseInt(state.price, 10)
      const stockQuantity = Number.parseInt(state.stock, 10)
      if (isEdit && productId) {
        return merchantService.updateProduct(productId, {
          name: state.name.trim(),
          description: state.description.trim(),
          priceAmount,
          stockQuantity,
          financingEligible: state.financingEligible,
          status: state.status,
        })
      }
      return merchantService.createProduct({
        name: state.name.trim(),
        description: state.description.trim(),
        priceAmount,
        currency: 'XOF',
        stockQuantity,
        categoryId: state.categoryId.trim() === '' ? null : state.categoryId.trim(),
        financingEligible: state.financingEligible,
      })
    },
    {
      onSuccess: () => navigate('/merchant/products'),
    },
  )

  const update = <K extends keyof FormState>(key: K) => (value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (form.name.trim().length < 2) next.name = 'Indiquez le nom du produit.'
    const priceAmount = Number.parseInt(form.price, 10)
    if (!Number.isInteger(priceAmount) || priceAmount <= 0) {
      next.price = 'Indiquez un prix valide en XOF.'
    }
    const stockQuantity = Number.parseInt(form.stock, 10)
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      next.stock = 'Indiquez une quantité valide.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    void save.mutate(form)
  }

  if (isEdit && product.isError) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Modifier le produit" />
        <ErrorState
          title="Impossible de charger le produit"
          description={toUserMessage(product.error)}
          onRetry={() => void product.refresh()}
        />
      </div>
    )
  }

  if (isEdit && (product.isLoading || !loaded)) {
    return (
      <div className={proStyles.page}>
        <ProPageHeader title="Modifier le produit" />
        <div className={proStyles.panel}>
          <Skeleton width={220} height={20} />
          <Skeleton width={320} height={16} />
          <Skeleton width={280} height={16} />
        </div>
      </div>
    )
  }

  return (
    <div className={proStyles.page}>
      <ProPageHeader title={isEdit ? 'Modifier le produit' : 'Nouveau produit'} />

      {save.isError ? (
        <InlineAlert tone="danger" title="Enregistrement impossible">
          {toUserMessage(save.error)}
        </InlineAlert>
      ) : null}

      <form className={styles.form} onSubmit={submit} noValidate>
        <Input
          label="Nom du produit"
          value={form.name}
          onChange={(event) => update('name')(event.target.value)}
          error={errors.name}
          required
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => update('description')(event.target.value)}
          rows={4}
          hint="Description visible sur la fiche produit."
        />

        <div className={styles.formGrid}>
          <Input
            label="Prix (XOF)"
            value={form.price}
            onChange={(event) => update('price')(event.target.value)}
            inputMode="numeric"
            error={errors.price}
            hint="Montant entier en francs CFA."
            required
          />
          <Input
            label="Stock disponible"
            value={form.stock}
            onChange={(event) => update('stock')(event.target.value)}
            inputMode="numeric"
            error={errors.stock}
            required
          />
        </div>

        <div className={styles.formGrid}>
          <Input
            label="Catégorie"
            value={form.categoryId}
            onChange={(event) => update('categoryId')(event.target.value)}
            placeholder="Ex. Électronique"
          />
          {isEdit ? (
            <Select
              label="Statut"
              value={form.status}
              onChange={(event) => update('status')(event.target.value as FormState['status'])}
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
              <option value="OUT_OF_STOCK">Rupture de stock</option>
            </Select>
          ) : null}
        </div>

        <Switch
          checked={form.financingEligible}
          onCheckedChange={update('financingEligible')}
          label="Éligible au financement NanoPay"
        />

        <div className={styles.formActions}>
          <Button type="submit" loading={save.isLoading}>
            {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={save.isLoading}
            onClick={() => navigate('/merchant/products')}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
