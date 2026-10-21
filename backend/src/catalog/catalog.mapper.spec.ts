// src/catalog/catalog.mapper.spec.ts
import { toProductDto, type ProductWithImages } from './catalog.mapper';

function baseProduct(overrides: Partial<ProductWithImages> = {}): ProductWithImages {
  return {
    id: 'product-1',
    merchantId: 'merchant-1',
    name: 'Sac en cuir',
    description: 'Cuir véritable',
    categoryId: null,
    price: 45000n,
    currency: 'XOF',
    images: null,
    stock: 3,
    financingEligible: true,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as ProductWithImages;
}

describe('toProductDto — images', () => {
  it('expose les images binaires (BYTEA) servies par le module marchand', () => {
    const dto = toProductDto(
      baseProduct({ productImages: [{ id: 'img-1' }, { id: 'img-2' }] }),
    );

    expect(dto.images).toEqual([
      { url: '/merchants/products/product-1/image/img-1' },
      { url: '/merchants/products/product-1/image/img-2' },
    ]);
  });

  it('conserve les images JSONB historiques', () => {
    const dto = toProductDto(
      baseProduct({ images: [{ url: 'https://cdn.example/legacy.jpg', width: 800 }] }),
    );

    expect(dto.images).toEqual([{ url: 'https://cdn.example/legacy.jpg', width: 800 }]);
  });

  it('place les images binaires avant les images JSONB', () => {
    const dto = toProductDto(
      baseProduct({
        productImages: [{ id: 'img-1' }],
        images: [{ url: 'https://cdn.example/legacy.jpg' }],
      }),
    );

    expect(dto.images.map((i) => i.url)).toEqual([
      '/merchants/products/product-1/image/img-1',
      'https://cdn.example/legacy.jpg',
    ]);
  });

  it('ignore les entrées JSONB invalides sans planter', () => {
    const dto = toProductDto(baseProduct({ images: [{ url: '' }, null, { width: 10 }, 'x'] }));

    expect(dto.images).toEqual([]);
  });

  it('renvoie une liste vide quand aucun champ image n’est présent', () => {
    expect(toProductDto(baseProduct()).images).toEqual([]);
  });
});

describe('toProductDto — prix et statut', () => {
  it('expose le prix backend en unités mineures', () => {
    const dto = toProductDto(baseProduct());

    expect(dto.price).toEqual({ amount: 45000, currency: 'XOF' });
  });

  it('marque OUT_OF_STOCK quand le stock est nul', () => {
    expect(toProductDto(baseProduct({ stock: 0 })).status).toBe('OUT_OF_STOCK');
  });

  it('marque INACTIVE quand le produit est désactivé', () => {
    const dto = toProductDto(baseProduct({ isActive: false }));
    expect(dto.status).toBe('INACTIVE');
    expect(dto.stock.available).toBe(false);
  });

  it('marque ACTIVE quand le produit est actif et en stock', () => {
    expect(toProductDto(baseProduct()).status).toBe('ACTIVE');
  });
});
