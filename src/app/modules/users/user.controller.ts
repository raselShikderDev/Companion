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

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All users fetched successfully",
    data: users,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await userService.getSingleUser(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User fetched successfully",
    data: user,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  const user = await userService.getSingleUser(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile fetched successfully",
    data: user,
  });
});



export const userController = {
    createExplorer,
    createAdmin,
    updateUserProfile,
    updateProfilePicture,
    getAllUsers,
  getSingleUser,
  getMe,
}