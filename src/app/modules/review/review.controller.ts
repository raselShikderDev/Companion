/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import catchAsync from "../../shared/catchAsync";
import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Role } from "@prisma/client";
import customError from "../../shared/customError";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  console.log({
    "req.user": req.user,
  });

  const review = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Review submitted",
    data: review,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const reviews = await ReviewService.getAllReviews(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All reviews fetched",
    data: reviews,
  });
});

const getMyReviews = catchAsync(async (req, res) => {
  const reviews = await ReviewService.getMyReviews(
    req.user?.id as string,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your reviews fetched",
    data: reviews.data,
    meta: reviews.meta,
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

const getReviewByMatchId = catchAsync(async (req: Request, res: Response) => {
  const matchid = req.params.matchid;
console.log({matchid});

  const review = await ReviewService.getSingleReview(matchid);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review for match fetched",
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

const adminReviewUpdateStatus = catchAsync(async (req, res) => {
  const updated = await ReviewService.adminReviewUpdateStatus(
    req.params.id,
    req.body.status,
    req.user?.role as Role
  );

  if ( req.body.status === updated.status) {
     throw new customError(StatusCodes.NOT_FOUND, `Status not changed`);
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Review status updated to ${updated.status}`,
    data: updated,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getMyReviews,
  adminReviewUpdateStatus,
  getReviewByMatchId
};
