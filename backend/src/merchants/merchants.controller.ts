// src/merchants/merchants.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { MerchantsService } from './merchants.service';
import { AuthenticatedUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/public.decorator';
import { MAX_IMAGE_SIZE } from './dto/merchant.dto';

/** Fichier en mémoire produit par Multer (upload en BYTEA, pas sur disque éphémère). */
interface UploadedImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  /**
   * Téléverse une image produit en BYTEA. Obligatoire : un produit sans image
   * est incomplet (`AGENTS.md` §22, §30).
   *
   * Validation côté serveur : taille ≤ 5 Mo, format JPEG/PNG/WebP relu depuis
   * les octets réels du fichier (magic numbers), jamais depuis le `mimetype`
   * ou le nom déclarés par le client.
   */
  @Post('products/:productId/image')
  @Roles('MERCHANT')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      // Garde-fou amont : rejette un fichier trop lourd avant de le bufferiser.
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    }),
  )
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException("Le fichier image est requis.");
    }
    return this.merchants.uploadProductImage(productId, user.id, file.buffer);
  }

  /**
   * Sert le binaire de l'image depuis la base (BYTEA). L'URL est la source
   * de vérité de localisation ; le binaire est la source de vérité du contenu.
   */
  @Get('products/:productId/image/:imageId')
  async getImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ) {
    const img = await this.merchants.getProductImage(productId, imageId);
    res.setHeader('Content-Type', img.contentType);
    res.setHeader('Content-Length', img.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(img.data);
  }
}
