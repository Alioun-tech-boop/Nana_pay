import type { IconName } from '../../../design-system'
import type { MerchantAccent } from '../../../types'
import type { Product } from '../../../types'

export interface ProductVisual {
  icon: IconName
  accent: MerchantAccent
}

const CATEGORY_ACCENT: Record<string, MerchantAccent> = {
  cat_phones: 'brand',
  cat_tablets: 'gold',
  cat_appliances: 'gold',
  cat_tv: 'warning',
  cat_mobility: 'success',
  cat_computers: 'warning',
  cat_home: 'ink',
  cat_food: 'danger',
}

const CATEGORY_ICON: Record<string, IconName> = {
  cat_phones: 'card',
  cat_tablets: 'card',
  cat_appliances: 'box',
  cat_tv: 'box',
  cat_mobility: 'truck',
  cat_computers: 'doc',
  cat_home: 'box',
  cat_food: 'box',
}

export function productVisual(product: Pick<Product, 'categoryId'>): ProductVisual {
  const categoryId = product.categoryId ?? ''
  return {
    icon: CATEGORY_ICON[categoryId] ?? 'box',
    accent: CATEGORY_ACCENT[categoryId] ?? 'brand',
  }
}

const NAME_KEYWORDS: Array<[RegExp, ProductVisual]> = [
  [/smartphone|téléphone|tablette|tab /i, { icon: 'card', accent: 'brand' }],
  [/réfrig|frigo|congélat|électroménager|cuisinière/i, { icon: 'box', accent: 'gold' }],
  [/tv|téléviseur|écran/i, { icon: 'box', accent: 'warning' }],
  [/scooter|vélo|moto|bike|citygo/i, { icon: 'truck', accent: 'success' }],
  [/ordinateur|probook|laptop|informatique/i, { icon: 'doc', accent: 'warning' }],
  [/coudre|couture|atelier/i, { icon: 'box', accent: 'ink' }],
  [/cuiseur|moulin|riz|grain|aliment/i, { icon: 'box', accent: 'danger' }],
]

export function productVisualFromName(name: string): ProductVisual {
  for (const [pattern, visual] of NAME_KEYWORDS) {
    if (pattern.test(name)) return visual
  }
  return { icon: 'box', accent: 'brand' }
}

const MERCHANT_NAMES: Record<string, string> = {
  mer_01HPLUS1: 'ElectroPlus Abidjan',
  mer_01HMEGA1: 'Mega Store Yopougon',
  mer_01HRIDE1: 'Ride & Go Abidjan',
  mer_01HTECK1: 'TekShop Plateau',
  mer_01HHOME1: 'Atelier du Foyer',
  mer_01HALIM1: 'Alim Succès',
}

export function merchantNameById(merchantId: string): string {
  return MERCHANT_NAMES[merchantId] ?? ''
}

export function merchantAccentClass(accent: MerchantAccent): string {
  return `emblem${accent.charAt(0).toUpperCase()}${accent.slice(1)}`
}