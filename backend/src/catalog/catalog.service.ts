// src/catalog/catalog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginatedDto, resolvePageParams } from '../common/utils/pagination';
import { ListProductsQuery } from './dto/catalog.query';
import {
  CategoryDto,
  ProductDto,
  toCategoryDto,
  toProductDto,
} from './catalog.mapper';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: ListProductsQuery): Promise<PaginatedDto<ProductDto>> {
    const page = resolvePageParams(query);

    const where: Prisma.ProductWhereInput = {
      // Le marketplace ne publie que les produits actifs des boutiques validées.
      isActive: true,
      merchant: { status: 'VALIDATED' },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.merchantId ? { merchantId: query.merchantId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(rows.map(toProductDto), total, page);
  }

  async getProduct(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true, merchant: { status: 'VALIDATED' } },
    });
    if (!product) throw new NotFoundException('Produit introuvable.');
    return toProductDto(product);
  }

  async listCategories(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return categories.map(toCategoryDto);
  }
}
