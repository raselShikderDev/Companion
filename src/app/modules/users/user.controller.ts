/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: > */
import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { userService } from "./user.service";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";


const createExplorer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const newExplorer = await userService.createExplorer(req.body)
    console.log({ "in controller: newExplorer": newExplorer });

    if (!newExplorer) {
        throw new customError(StatusCodes.BAD_REQUEST, "Creating explorer failed")

    }
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: "Explorer successfully created",
        data: newExplorer
    })
})

const createAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const newAdmin = await userService.createAdmin(req.body)
    if (!newAdmin) {
        throw new customError(StatusCodes.BAD_REQUEST, "Creating admin failed")

    }

    
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: "Admin successfully created",
        data: newAdmin
    })
})

 const updateProfilePicture = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized" );

    const updated = await userService.updateProfilePicture(
      userId,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Profile picture updated successfully",
      data: updated,
    });
  }
);

export const updateUserProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new customError(StatusCodes.UNAUTHORIZED,"Unauthorized" );

    const updated = await userService.updateUserProfile(userId, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: updated,
    });
  }
);

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    sendResponse(res, {
        success: true,
        statusCode: 500,
        message: "All users",
        data: null
    })
})




export const userController = {
    getAllUsers,
    createExplorer,
    createAdmin,
    updateUserProfile,
    updateProfilePicture,
}