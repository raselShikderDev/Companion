/** biome-ignore-all lint/style/useImportType: > */
// biome-ignore assist/source/organizeImports: >
import { prisma } from "../../configs/db.config";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { calculateCompatibility } from "./recommendation.utils";
import { aiService } from "../ai/ai.service";

const getCompanionRecommendations = async (userId: string) => {

  // 1. Find explorer
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
    include: { reviews: true },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // 2. Fetch candidate explorers
  const candidates = await prisma.explorer.findMany({
    where: {
      id: { not: explorer.id },
    },
    include: {
      reviews: true,
    },
  });

  // 3. Compatibility scoring
  const scored = candidates.map((candidate) => ({
    explorer: candidate,
    score: calculateCompatibility(explorer, candidate),
  }));

  const topCandidates = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 4. AI explanation
  const aiExplanation = await aiService.explainMatches(
    explorer,
    topCandidates
  );

  return {
    data: topCandidates,
    aiExplanation,
  };
};

export const recommendationService = {
  getCompanionRecommendations,
};