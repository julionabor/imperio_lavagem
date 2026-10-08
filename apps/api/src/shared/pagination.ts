/** Helpers de paginação server-side. */

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function pageMeta(page: number, pageSize: number, total: number): PageMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** Converte page/pageSize em skip/take para o Prisma. */
export function toSkipTake(page: number, pageSize: number): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/** Parseia page e pageSize de query params, com limites. */
export function parsePageParams(query: {
  page?: unknown;
  pageSize?: unknown;
}): { page: number; pageSize: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize) || 9));
  return { page, pageSize };
}
