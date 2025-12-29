export type QuerySchemaConfig = {
  searchableFields: string[];
  filterableFields: string[];
  dateField?: string;
  relations?: Record<string, any>;
};

export const QUERY_SCHEMA_MAP = {
  user: {
    searchableFields: ["email"],
    filterableFields: ["role", "status", "isDeleted"],
    dateField: "createdAt",
  },

  explorer: {
    searchableFields: ["fullName", "phone"],
    filterableFields: ["gender", "isPremium"],
    dateField: "createdAt",
  },

  trip: {
    searchableFields: ["title", "destination", "departureLocation"],
    filterableFields: ["status", "matchCompleted"],
    dateField: "startDate",
  },

  match: {
    searchableFields: ["status"],
    filterableFields: ["status", "tripId"],
    dateField: "createdAt",
  },

  review: {
    searchableFields: ["comment"],
    filterableFields: ["status", "rating"],
    dateField: "createdAt",
  },

  payment: {
    searchableFields: ["status", "gateway"],
    filterableFields: ["status", "planName"],
    dateField: "createdAt",
  },

  subscription: {
    searchableFields: ["planName"],
    filterableFields: ["isActive"],
    dateField: "startDate",
  },
} as const;
