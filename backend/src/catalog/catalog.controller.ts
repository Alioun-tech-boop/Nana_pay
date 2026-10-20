// src/catalog/catalog.controller.ts
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { ListProductsQuery, listProductsQuerySchema } from './dto/catalog.query';
import { CategoryDto, ProductDto } from './catalog.mapper';
import { PaginatedDto } from '../common/utils/pagination';

/**
 * Catalogue public : le marketplace se parcourt sans compte (AGENTS.md §39).
 * Aucune donnee personnelle ni financiere n'est exposee ici ; le service
 * filtre deja les merchants a VALIDATED et ne retourne jamais le prix de
 * revient ni la marge.
 */
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products')
  listProducts(
    @Query(new ZodValidationPipe(listProductsQuerySchema)) query: ListProductsQuery,
  ): Promise<PaginatedDto<ProductDto>> {
    return this.catalog.listProducts(query);
  }

  @Get('products/:id')
  getProduct(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProductDto> {
    return this.catalog.getProduct(id);
  }

  @Get('categories')
  listCategories(): Promise<CategoryDto[]> {
    return this.catalog.listCategories();
  }
}
