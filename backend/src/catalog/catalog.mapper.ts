// src/catalog/catalog.mapper.ts
import { Product as PrismaProduct } from '@prisma/client';
import { toMoney } from '../common/utils/money';

export interface ProductImageDto {
  url: string;
  width?: number;
  height?: number;
}

export interface ProductStockDto {
  available: boolean;
  quantity: number;
}

export interface ProductDto {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: { amount: number; currency: string };
  images: ProductImageDto[];
  categoryId: string | null;
  stock: ProductStockDto;
  financingEligible: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

/** Produit Prisma avec la relation des images binaires (BYTEA) chargée. */
export type ProductWithImages = PrismaProduct & {
  productImages?: { id: string }[];
};

/** Les images sont stockées en JSONB : on ne retourne jamais d'entrée invalide. */
function normalizeImages(value: unknown): ProductImageDto[] {
  if (!Array.isArray(value)) return [];

  const images: ProductImageDto[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const url = (entry as Record<string, unknown>).url;
    if (typeof url !== 'string' || url.length === 0) continue;

    const width = (entry as Record<string, unknown>).width;
    const height = (entry as Record<string, unknown>).height;
    const image: ProductImageDto = { url };
    if (typeof width === 'number' && Number.isFinite(width)) image.width = width;
    if (typeof height === 'number' && Number.isFinite(height)) image.height = height;
    images.push(image);
  }
  return images;
}

export function toProductDto(product: ProductWithImages): ProductDto {
  const inStock = product.stock > 0;

  // Images binaires (BYTEA) : servies par le module marchand. Elles complètent
  // le JSONB `images` historique sans le remplacer.
  const binaryImages: ProductImageDto[] = (product.productImages ?? []).map((image) => ({
    url: `/merchants/products/${product.id}/image/${image.id}`,
  }));

  return {
    id: product.id,
    merchantId: product.merchantId,
    name: product.name,
    description: product.description ?? '',
    // Le prix est une vérité backend (unités mineures).
    price: toMoney(product.price, product.currency) as { amount: number; currency: string },
    images: [...binaryImages, ...normalizeImages(product.images)],
    categoryId: product.categoryId ?? null,
    stock: { available: product.isActive && inStock, quantity: product.stock },
    financingEligible: product.financingEligible,
    status: !product.isActive ? 'INACTIVE' : inStock ? 'ACTIVE' : 'OUT_OF_STOCK',
  };
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export function toCategoryDto(category: { id: string; name: string; slug: string }): CategoryDto {
  return { id: category.id, name: category.name, slug: category.slug };
}
