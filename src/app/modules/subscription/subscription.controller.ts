
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { initiatePaymentSchema, paymentCallbackSchema } from "./subscription.validation";
import { initiatePayment, verifyAndFinalizePayment } from "./subscription.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";

// POST /subscriptions/initiate
export const initiatePaymentController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");

  const input = initiatePaymentSchema.parse(req.body);
  const result = await initiatePayment(userId, input);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment initiated. Redirect user to gateway.",
    data: result,
  });
});

// POST /webhooks/sslcommerz  (IPN endpoint)
export const sslcommerzWebhook = catchAsync(async (req: Request, res: Response) => {
  const payload = paymentCallbackSchema.parse(req.body);
  // Immediately respond 200 OK to gateway and process verification async OR process synchronously
  // We'll process synchronously here to ensure verification
  const result = await verifyAndFinalizePayment(req.body);
  // send 200 to gateway
  res.status(200).send("OK");
});
