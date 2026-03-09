/** biome-ignore-all lint/style/useImportType: > */
// biome-ignore assist/source/organizeImports: >
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { recommendationService } from "./recommendation.service";
import catchAsync from "../../shared/catchAsync";

const getCompanionRecommendations = catchAsync(
  async (req: Request, res: Response) => {

    const userId = req.user?.id;

    const result =
      await recommendationService.getCompanionRecommendations(userId as string);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Companion recommendations generated",
      data: result.data,
      aiExplanation: result.aiExplanation,
    });
  }
);

export const recommendationController = {
  getCompanionRecommendations,
};