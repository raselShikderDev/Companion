import { Request, Response } from "express";
import { sendConfirmationEmail, confirmEmail } from "./email.service";
import catchAsync from "../../shared/catchAsync";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/sendResponse";

 const sendConfirm = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
  const result = await sendConfirmationEmail(userId);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Confirmation email sent", data: result });
});

 const confirm = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  await confirmEmail(token);
  sendResponse(res, { success: true, statusCode: StatusCodes.OK, message: "Email confirmed", data: null });
});


export const emailController ={
sendConfirm,
confirm,
}