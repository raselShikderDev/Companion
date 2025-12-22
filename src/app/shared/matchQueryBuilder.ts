export const matchQueryBuilder = (
  query: Record<string, string | number>,
  searchableFields: string[],
  root: "trip" | "match"
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const sortBy = (query.sortBy as string) || "createdAt";
  const sortOrder = (query.sortOrder as "asc" | "desc") || "desc";

  const searchTerm = query.searchTerm;

  const filters = { ...query };
  delete filters.page;
  delete filters.limit;
  delete filters.searchTerm;
  delete filters.sortBy;
  delete filters.sortOrder;

  const startDate = filters.startDate;
  const endDate = filters.endDate;
  delete filters.startDate;
  delete filters.endDate;

  const searchConditions =
    searchTerm && searchableFields.length
      ? {
          OR: searchableFields.map((field) => ({
            [field]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          })),
        }
      : {};

  const filterConditions =
    Object.keys(filters).length > 0
      ? {
          AND: Object.entries(filters).map(([field, value]) => ({
            [field]: value,
          })),
        }
      : {};

  let dateConditions: Record<string, any> = {};

  if (startDate && endDate) {
    const dateFilter = {
      startDate: { gte: new Date(startDate as string) },
      endDate: { lte: new Date(endDate as string) },
    };

    if (root === "trip") {
      // Trip is root model
      dateConditions = dateFilter;
    }

    if (root === "match") {
      // Trip is a relation of Match
      dateConditions = {
        trip: dateFilter,
      };
    }
  }

  return {
    where: {
      ...searchConditions,
      ...filterConditions,
      ...dateConditions,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
    page,
    limit,
  };
};