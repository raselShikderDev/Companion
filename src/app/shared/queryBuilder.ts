/*  
    Reusable Query Builder for Prisma  
    Supports:
    - Search (multiple fields)
    - Filter (exact match)
    - Sort
    - Pagination
*/

export const prismaQueryBuilder = (
  query: Record<string, string | number>,
  searchableFields: string[]
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const searchTerm = query.searchTerm;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

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
  console.log({startDate});
  console.log({endDate});
  

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
    Object.keys(filters).length
      ? {
          AND: Object.entries(filters).map(([field, value]) => ({
            [field]: value,
          })),
        }
      : {};

  const dateConditions =
    startDate && endDate
      ? {
          trip: {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
          },
        }
      : {};

      console.log({dateConditions:dateConditions.trip});
      

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


// export interface ISearchAndFilter {
//   searchTerm?: string;
//   filters?: Record<string, string>;
//   sortBy?: string;
//   sortOrder?: "asc" | "desc";
//   page?: number;
//   limit?: number;
// }

// export const prismaQueryBuilder = (
//   query: Record<string, string | number>,
//   searchableFields: string[]
// ) => {
//   const page = Number(query.page) || 1;
//   const limit = Number(query.limit) || 10;
//   const skip = (page - 1) * limit;

//   const searchTerm = query.searchTerm;
//   const sortBy = query.sortBy || "createdAt";
//   const sortOrder = query.sortOrder || "desc";

//   const filters = { ...query };
//   delete filters.page;
//   delete filters.limit;
//   delete filters.searchTerm;
//   delete filters.sortBy;
//   delete filters.sortOrder;

//   const searchConditions =
//     searchTerm && searchableFields.length
//       ? {
//           OR: searchableFields.map((field) => ({
//             [field]: {
//               contains: searchTerm,
//               mode: "insensitive",
//             },
//           })),
//         }
//       : {};

//   const filterConditions =
//     Object.keys(filters).length
//       ? {
//           AND: Object.entries(filters).map(([field, value]) => ({
//             [field]: value,
//           })),
//         }
//       : {};

//   return {
//     where: {
//       ...searchConditions,
//       ...filterConditions,
//     },
//     orderBy: {
//       [sortBy]: sortOrder,
//     },
//     skip,
//     take: limit,
//     page,
//     limit,
//   };
// };

