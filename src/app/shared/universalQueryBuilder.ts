import { QUERY_SCHEMA_MAP } from "./queryConfig";

export const universalQueryBuilder = (
  schema: keyof typeof QUERY_SCHEMA_MAP,
  query: Record<string, any>
) => {
  const config = QUERY_SCHEMA_MAP[schema];

  if (!config) {
    throw new Error(`Query schema "${schema}" not registered`);
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || config.dateField || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: any = {};

  /*  SEARCH */
  if (query.searchTerm && config.searchableFields.length) {
    where.OR = config.searchableFields.map((field) => ({
      [field]: {
        contains: query.searchTerm,
        mode: "insensitive",
      },
    }));
  }

  /*  FILTER */
  config.filterableFields.forEach((field) => {
    if (query[field] !== undefined) {
      where[field] = query[field];
    }
  });

  /*  DATE RANGE */
  if (config.dateField && query.startDate && query.endDate) {
    where[config.dateField] = {
      gte: new Date(query.startDate),
      lte: new Date(query.endDate),
    };
  }

  return {
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    meta: {
      page,
      limit,
    },
  };
};
