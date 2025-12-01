/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: > */
import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { authService } from "./auth.service";
import { setAuthCookie } from "../../helper/authCookie";

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userTokens = await authService.login(req.body);
    console.log({ userTokens });

    if (!userTokens.accessToken && !userTokens.refreshToken) {
      throw new customError(StatusCodes.BAD_REQUEST, "Login failed");
    }

    await setAuthCookie(res, userTokens);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Successfully logged In`,
      data: userTokens,
    });
  }
);

export const authController = {
  login,
};
