/** biome-ignore-all assist/source/organizeImports: <\> */
import catchAsync from "../../shared/catchAsync";
import { AnalysisService } from "./analysis.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";

const getExplorerAnalysis = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  if (userId) {
      throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }
  const data = await AnalysisService.getExplorerAnalysis(userId as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Explorer analysis fetched",
    data,
  });
});

const getAdminAnalysis = catchAsync(async (_req, res) => {
  const data = await AnalysisService.getAdminAnalysis();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Admin analytics fetched",
    data,
  });
});

export const AnalysisController = {
  getExplorerAnalysis,
  getAdminAnalysis,
};
