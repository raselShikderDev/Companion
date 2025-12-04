import catchAsync from "../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "./payment.service";

const getAll = catchAsync(async (req: Request, res: Response) => {
    const data = await PaymentService.getAll();
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "All payments", data });
});

const getSingle = catchAsync(async (req: Request, res: Response) => {
    const data = await PaymentService.getSingle(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Payment fetched", data });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const data = await PaymentService.getMyPayments(userId);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Your payments", data });
});

export const PaymentController = { getAll, getSingle, getMyPayments };
