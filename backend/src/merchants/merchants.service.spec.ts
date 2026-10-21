// src/merchants/merchants.service.spec.ts
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import type { PrismaService } from '../prisma/prisma.service';

function jpegBuffer(totalLength = 64): Buffer {
  const buf = Buffer.alloc(totalLength, 0);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  return buf;
}

describe('MerchantsService.uploadProductImage', () => {
  const merchantUserId = 'user-merchant-1';
  const productId = 'product-1';

  function build(prisma: Record<string, unknown>): MerchantsService {
    return new MerchantsService(prisma as unknown as PrismaService);
  }

  it('stocke le binaire et retourne l’URL servie (JPEG valide)', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'image-1', size: 64 });
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue({ id: productId, name: 'Sac' }) },
      productImage: { create },
    };
    const service = build(prisma);

    const result = await service.uploadProductImage(productId, merchantUserId, jpegBuffer());

    expect(result).toEqual({ url: `/merchants/products/${productId}/image/image-1`, size: 64 });
    expect(create).toHaveBeenCalledTimes(1);
    const payload = create.mock.calls[0][0].data;
    expect(payload.productId).toBe(productId);
    // Le type stocké est celui détecté par les magic numbers.
    expect(payload.contentType).toBe('image/jpeg');
    expect(payload.size).toBe(64);
    expect(payload.data).toBeInstanceOf(Uint8Array);
  });

  it('scope la recherche du produit au commerçant connecté', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: productId, name: 'Sac' });
    const prisma = {
      product: { findFirst },
      productImage: { create: jest.fn().mockResolvedValue({ id: 'image-1', size: 64 }) },
    };
    const service = build(prisma);

    await service.uploadProductImage(productId, merchantUserId, jpegBuffer());

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: productId, merchant: { userId: merchantUserId } } }),
    );
  });

  it('refuse (404) un produit qui n’appartient pas au commerçant', async () => {
    const create = jest.fn();
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(null) },
      productImage: { create },
    };
    const service = build(prisma);

    await expect(
      service.uploadProductImage('product-dun-autre', merchantUserId, jpegBuffer()),
    ).rejects.toBeInstanceOf(NotFoundException);
    // Aucune image n'est écrite si le produit n'est pas celui du commerçant.
    expect(create).not.toHaveBeenCalled();
  });

  it('refuse (422) un fichier vide sans écrire en base', async () => {
    const create = jest.fn();
    const prisma = {
      product: { findFirst: jest.fn() },
      productImage: { create },
    };
    const service = build(prisma);

    await expect(
      service.uploadProductImage(productId, merchantUserId, Buffer.alloc(0)),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuse (422) un format non autorisé (contenu texte déguisé)', async () => {
    const create = jest.fn();
    const prisma = {
      product: { findFirst: jest.fn() },
      productImage: { create },
    };
    const service = build(prisma);

    await expect(
      service.uploadProductImage(productId, merchantUserId, Buffer.from('GIF89a-not-allowed')),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('MerchantsService.getProductImage', () => {
  it('retourne le binaire et le content-type stockés', async () => {
    const stored = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const prisma = {
      productImage: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ data: stored, contentType: 'image/jpeg', size: stored.length }),
      },
    };
    const service = new MerchantsService(prisma as unknown as PrismaService);

    const result = await service.getProductImage('product-1', 'image-1');

    expect(result.contentType).toBe('image/jpeg');
    expect(result.size).toBe(stored.length);
    expect(Buffer.isBuffer(result.data)).toBe(true);
  });

  it('convertit le Uint8Array de Prisma en Buffer (sinon Express sérialise en JSON)', async () => {
    // Prisma renvoie `Uint8Array`, pas un `Buffer` Node.
    const fromPrisma = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const prisma = {
      productImage: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ data: fromPrisma, contentType: 'image/png', size: 4 }),
      },
    };
    const service = new MerchantsService(prisma as unknown as PrismaService);

    const result = await service.getProductImage('product-1', 'image-1');

    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect([...result.data]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it('refuse (404) une image inconnue', async () => {
    const prisma = { productImage: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new MerchantsService(prisma as unknown as PrismaService);

    await expect(service.getProductImage('product-1', 'inexistant')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
