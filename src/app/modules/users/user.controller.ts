/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: > */
import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";


const createExplorer = catchAsync(async(req: Request, res: Response, next: NextFunction)=>{
    sendResponse(res, {
        success:true,
        statusCode:500,
        message:"All users",
        data:null
    })
})


const getAllUsers = catchAsync(async(req: Request, res: Response, next: NextFunction)=>{
    sendResponse(res, {
        success:true,
        statusCode:500,
        message:"All users",
        data:null
    })
})


export const userController ={
    getAllUsers,
    createExplorer,
}