import catchAsync from "../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "./payment.service";

const getAllPayment = catchAsync(async (req: Request, res: Response) => {
    const data = await PaymentService.getAllPayment(req.query as Record<string, string>);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "All payments", data:data.data,
        meta:data.meta
     });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
    const data = await PaymentService.getSinglePayment(req.params.id);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Payment fetched", data });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const data = await PaymentService.getMyPayments(userId);
    sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Your payments", data });
});

export const PaymentController = { getAllPayment, getSinglePayment, getMyPayments };
