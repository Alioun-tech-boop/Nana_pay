import type { Product } from '../../../types'

export interface ProductCategoryOption {
  id: string
  label: string
}

/**
 * Libellés d'affichage des catégories de produits.
 * Les produits sont stockés avec un identifiant court (ex. `cat_phones`) ;
 * le libellé français est une présentation frontend, la liste des produits
 * et leur filtrage restent pilotés par le backend.
 */
const CATEGORY_LABELS: Record<string, string> = {
  cat_phones: 'Téléphones',
  cat_tablets: 'Tablettes',
  cat_appliances: 'Électroménager',
  cat_tv: 'TV & écrans',
  cat_mobility: 'Mobilité',
  cat_computers: 'Informatique',
  cat_home: 'Maison & atelier',
  cat_food: 'Alimentation',
}

export function categoryLabel(categoryId: string): string {
  return CATEGORY_LABELS[categoryId] ?? categoryId
}

/**
 * Déduit les options de filtre à partir des produits réellement renvoyés
 * par le backend. L'union est monotone côté page : filtrer une catégorie
 * ne fait jamais rétrécir la liste des chips déjà connues.
 */
export function buildCategoryOptions(products: Product[]): ProductCategoryOption[] {
  const seen = new Set<string>()
  const options: ProductCategoryOption[] = []
  for (const product of products) {
    if (!product.categoryId || seen.has(product.categoryId)) continue
    seen.add(product.categoryId)
    options.push({ id: product.categoryId, label: categoryLabel(product.categoryId) })
  }
  return options.sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}