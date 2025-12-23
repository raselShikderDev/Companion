/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { subscriptionService } from "./subscription.service";
import customError from "../../shared/customError";

// POST /subscriptions/create
const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new customError(StatusCodes.UNAUTHORIZED, "You not authorized")
  }
console.log("In create subscription controller");
console.log(req.body);

  const result = await subscriptionService.createSubscription(userId as string, req.body );
  console.log("results");
  
console.log(result);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Subscription payment session created",
    data: result,
  });
});



// POST /subscriptions/webhook/sslcommerz  (IPN endpoint)
const sslcommerzWebhook = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body; // you validated earlier if needed
  // We will process verification inside service
  await subscriptionService.verifyAndFinalizePayment(payload);
  // Acknowledge provider ASAP
  res.status(200).send("OK");
});


const getAllSubscription = catchAsync(async (req: Request, res: Response) => {
  const data = await subscriptionService.getAllSubscription(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All subscriptions fetched",
    data:data.data,
    meta:data.meta,
  });
});

const getSingleSubscription = catchAsync(async (req: Request, res: Response) => {
  const data = await subscriptionService.getSingleSubscription(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Subscription fetched",
    data,
  });
});

const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const data = await subscriptionService.getMySubscription(userId as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your subscription details",
    data,
  });
});

export const subscriptionController = {
  sslcommerzWebhook,
  createSubscription,
  getMySubscription,
  getSingleSubscription,
  getAllSubscription,
};



// import { Request, Response } from "express";
// import catchAsync from "../../shared/catchAsync";
// import { initiatePaymentSchema, paymentCallbackSchema } from "./subscription.validation";
// import sendResponse from "../../shared/sendResponse";
// import { StatusCodes } from "http-status-codes";
// import customError from "../../shared/customError";
// import { subscriptionService } from "./subscription.service";

// // Create subscription
// const createSubscription = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user?.id;
//   if (!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });


//   const result = await subscriptionService.createSubscription(userId, req.body);

//   // result.payment and result.sslPayload returned
//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.CREATED,
//     message: "Subscription payment session created",
//     data: { payment: result.payment, sslPayload: result.sslPayload },
//   });
// });

// // POST /subscriptions/initiate
// const initiatePayment = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user?.id;
//   if (!userId) throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");

//   const input = initiatePaymentSchema.parse(req.body);
//   const result = await subscriptionService.initiatePayment(userId, input);

//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "Payment initiated. Redirect user to gateway.",
//     data: result,
//   });
// });

// // POST /webhooks/sslcommerz  (IPN endpoint)
// const sslcommerzWebhook = catchAsync(async (req: Request, res: Response) => {
//   const payload = paymentCallbackSchema.parse(req.body);
//   // Immediately respond 200 OK to gateway and process verification async OR process synchronously
//   // We'll process synchronously here to ensure verification
//   const result = await subscriptionService.verifyAndFinalizePayment(req.body);
//   // send 200 to gateway
//   res.status(200).send("OK");
// });


// export const subscriptionController = {
//   initiatePayment,
//   sslcommerzWebhook,
//   createSubscription,
// }