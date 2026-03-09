/** biome-ignore-all lint/style/useImportType: > */
// biome-ignore assist/source/organizeImports: >
import { prisma } from "../../configs/db.config";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { calculateCompatibility } from "./recommendation.utils";
import { aiService } from "../ai/ai.service";

const getCompanionRecommendations = async (userId: string) => {

  const explorer = await prisma.explorer.findFirst({
    where: { userId },
    include: { reviews: true },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  const candidates = await prisma.explorer.findMany({
    where: {
      id: { not: explorer.id },
    },
    include: {
      reviews: true,
    },
  });

  const scored = candidates.map((candidate) => ({
    explorer: candidate,
    score: calculateCompatibility(explorer, candidate),
  }));

  const recommendations = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Call OpenAI
  const explanation = await aiService.generateMatchExplanation(
    explorer,
    recommendations
  );

  return {
    data: recommendations,
    aiExplanation: explanation,
  };
};


export const recommendationService = {
  getCompanionRecommendations,
};