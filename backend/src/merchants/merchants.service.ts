// src/merchants/merchants.service.ts
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateImageFile, MAX_IMAGE_SIZE, ALLOWED_CONTENT_TYPES } from './dto/merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Téléverse et stocke l'image du produit en BYTEA (source de vérité unique).
   *
   * L'image est obligatoire : un produit sans image est incomplet et ne doit pas
   * être visible sur le marketplace (`AGENTS.md` §22 — pas de données factices).
   * La validation (taille, format) est appliquée par le backend, pas le client.
   */
  async uploadProductImage(
    productId: string,
    userId: string,
    fileBuffer: Buffer,
  ): Promise<{ url: string; size: number }> {
    const check = validateImageFile(fileBuffer);
    if (check.valid === false) throw new UnprocessableEntityException(check.reason);

    // Vérifier que le produit appartient au commerçant (via le merchant du user).
    const product = await this.prisma.product.findFirst({
      where: { id: productId, merchant: { userId } },
      select: { id: true, name: true },
    });
    if (!product) throw new NotFoundException('Produit non trouvé.');

    const image = await this.prisma.productImage.create({
      data: {
        productId,
        // Prisma 6 type `Bytes` = Uint8Array<ArrayBuffer> ; Node `Buffer` est
        // ArrayBufferLike -> copie explicite pour satisfaire le type sans changer le contenu.
        data: new Uint8Array(fileBuffer),
        // Type réel détecté par les magic numbers, jamais celui déclaré par le client.
        contentType: check.contentType,
        size: fileBuffer.length,
      },
    });

    return {
      url: `/merchants/products/${productId}/image/${image.id}`,
      size: image.size,
    };
  }

  async getProductImage(productId: string, imageId: string): Promise<{ data: Buffer; contentType: string; size: number }> {
    const img = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
      select: { data: true, contentType: true, size: true },
    });
    if (!img) throw new NotFoundException('Image non trouvée.');
    // Prisma renvoie `Uint8Array`. Express `res.send()` sérialise un Uint8Array
    // en objet JSON ({"0":137,...}) : on repasse explicitement par un Buffer
    // pour que le binaire soit envoyé tel quel.
    return {
      data: Buffer.from(img.data),
      contentType: img.contentType,
      size: img.size,
    };
  }
}
