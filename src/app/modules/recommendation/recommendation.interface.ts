import type { Explorer } from "@prisma/client";

export interface RecommendedExplorer {
  explorer: Explorer;
  score: number;
}

export interface RecommendationResponse {
  data: RecommendedExplorer[];
}