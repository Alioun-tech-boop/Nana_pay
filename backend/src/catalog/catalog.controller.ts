// src/catalog/catalog.controller.ts
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ListProductsQuery, listProductsQuerySchema } from './dto/catalog.query';
import { CategoryDto, ProductDto } from './catalog.mapper';
import { PaginatedDto } from '../common/utils/pagination';

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
