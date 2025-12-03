/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: > */
import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { authService } from "./auth.service";
import { clearAuthCookie, setAuthCookie } from "../../helper/authCookie";

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

const logOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    clearAuthCookie(res, "accessToken")
    clearAuthCookie(res, "refreshToken")

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Successfully logged Out`,
      data: null,
    });
  }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP sent to your email",
    data: null
  });
});

const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const isVerified = await authService.verifyOtp(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP verified successfully",
    data: { verified: isVerified }
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;

  await authService.resetPassword(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset successfully",
    data: null
  });
});

export const authController = {
  login,
  logOut,
  resetPassword,
  verifyOTP,
  forgotPassword
};
