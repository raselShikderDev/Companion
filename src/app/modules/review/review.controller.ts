import catchAsync from "../../shared/catchAsync";
import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

 const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;

  const review = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Review submitted",
    data: review,
  });
});

 const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const reviews = await ReviewService.getAllReviews(req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All reviews fetched",
    data: reviews,
  });
});

const getMyReviews = catchAsync(async (req, res) => {
  const reviews = await ReviewService.getMyReviews(req.user?.id!, req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your reviews fetched",
    data: reviews
  });
});

 const getSingleReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const review = await ReviewService.getSingleReview(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review fetched",
    data: review,
  });
});

 const updateReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = req.user?.id as string;

  const updated = await ReviewService.updateReview(id, userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review updated",
    data: updated,
  });
});

 const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = req.user?.id as string;

  await ReviewService.deleteReview(id, userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review deleted",
    data: null,
  });
});

const adminUpdateStatus = catchAsync(async (req, res) => {
  const updated = await ReviewService.adminUpdateStatus(
    req.params.id,
    req.body.status
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review status updated",
    data: updated
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getMyReviews,
  adminUpdateStatus,
};
