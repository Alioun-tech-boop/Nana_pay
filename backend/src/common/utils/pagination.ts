// src/common/utils/pagination.ts
/** Enveloppe `{ items, pagination }` attendue par `Paginated<T>` côté frontend. */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationDto {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedDto<T> {
  items: T[];
  pagination: PaginationDto;
}

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function resolvePageParams(query: { page?: unknown; pageSize?: unknown }): PageParams {
  const rawPage = Number(query.page);
  const rawSize = Number(query.pageSize);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawSize) && rawSize >= 1
      ? Math.min(MAX_PAGE_SIZE, Math.trunc(rawSize))
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginate<T>(items: T[], total: number, { page, pageSize }: PageParams): PaginatedDto<T> {
  return {
    items,
    pagination: { page, pageSize, total, hasMore: page * pageSize < total },
  };
}
