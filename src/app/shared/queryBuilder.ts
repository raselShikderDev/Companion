/*  
    Reusable Query Builder for Prisma  
    Supports:
    - Search (multiple fields)
    - Filter (exact match)
    - Sort
    - Pagination
*/

export interface ISearchAndFilter {
  searchTerm?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const prismaQueryBuilder = (
  query: ISearchAndFilter,
  searchableFields: string[]
) => {
  const {
    searchTerm,
    filters = {},
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = query;

  const skip = (page - 1) * limit;

  // --- Search Condition (OR) ---
  const searchConditions =
    searchTerm && searchableFields.length > 0
      ? {
          OR: searchableFields.map((field) => ({
            [field]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          })),
        }
      : {};

  // --- Filter Conditions (AND) ---
  const filterConditions =
    Object.keys(filters).length > 0
      ? {
          AND: Object.entries(filters).map(([field, value]) => ({
            [field]: value,
          })),
        }
      : {};

  return {
    where: {
      ...searchConditions,
      ...filterConditions,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
  };
};
