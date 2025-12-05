/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { CreateReviewInput, UpdateReviewInput } from "./review.interface";
import { prismaQueryBuilder } from "../../shared/queryBuilder";
import { MatchStatus, ReviewStatus, TripStatus } from "@prisma/client";

const createReview = async (userId: string, data: CreateReviewInput) => {
  const { matchId, rating, comment } = data;

  // ✅ 1. Convert USER → EXPLORER
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // ✅ 2. Get Match + Trip
  const match = await prisma.match.findUnique({
    where: { id: matchId, status:MatchStatus.ACCEPTED},
    include: { trip: true },
  });

  if (!match) {
    throw new customError(StatusCodes.NOT_FOUND, "Match not found");
  }

  console.log({
    explorerId: explorer.id,
    matchRequester: match.requesterId,
    matchRecipient: match.recipientId,
  });

  // ✅ 3. TRUE MATCH MEMBERSHIP CHECK (FIXED)
  if (
    match.requesterId !== explorer.id &&
    match.recipientId !== explorer.id
  ) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not part of this match"
    );
  }

  // ✅ 4. Match must be ACCEPTED
  if (match.status !== MatchStatus.ACCEPTED) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "You can only review an accepted match"
    );
  }

  // ✅ 5. Trip must be completed
  if (match.trip.status !== TripStatus.COMPLETED) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Review is allowed only after trip completion"
    );
  }

  // ✅ 6. Prevent duplicate review
  const alreadyReviewed = await prisma.review.findFirst({
    where: {
      matchId,
      reviewerId: explorer.id, // ✅ FIXED
    },
  });

  if (alreadyReviewed) {
    throw new customError(
      StatusCodes.CONFLICT,
      "You already reviewed this match"
    );
  }

  // ✅ 7. Create review safely
  const review = await prisma.$transaction(async (tx) => {
    return await tx.review.create({
      data: {
        matchId,
        reviewerId: explorer.id, 
        rating,
        comment,
        status: ReviewStatus.APPROVED,
      },
    });
  });

  return review;
};


const getAllReviews = async (query: Record<string, string>) => {
  //   return prisma.review.findMany({
  //     include: { reviewer: true, match: true },
  //   });
  const builtQuery = prismaQueryBuilder(query, ["comment", "status"]);

  const [metaDataCount, data] = await Promise.all([
    prisma.review.count({ where: builtQuery.where }),
    prisma.review.findMany({
      ...builtQuery,
      include: {
        reviewer: true,
        match: true,
      },
    }),
  ]);

  return {
    meta: {
      total: metaDataCount,
      page: query.page || 1,
      limit: query.limit || 10,
    },
    data,
  };
};

const getMyReviews = async (userId: string, query: Record<string, string>) => {
  const builtQuery = prismaQueryBuilder(query, ["comment", "status"]);

  // Fix: wrap inside AND so TypeScript & Prisma accepts it
  const finalWhere = {
    AND: [builtQuery.where, { reviewerId: userId }],
  };

  const [metaDataCount, data] = await Promise.all([
    prisma.review.count({ where: finalWhere }),

    prisma.review.findMany({
      ...builtQuery,
      where: finalWhere,
      include: {
        reviewer: true,
        match: true,
      },
    }),
  ]);

  return {
    meta: {
      total: metaDataCount,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
    },
    data,
  };
};

const getSingleReview = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { reviewer: true, match: true },
  });

  if (!review) {
    throw new customError(StatusCodes.NOT_FOUND, "Review not found");
  }

  return review;
};

const updateReview = async (
  reviewId: string,
  userId: string,
  data: UpdateReviewInput
) => {
  // ✅ 1. Convert USER → EXPLORER
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // ✅ 2. Get review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new customError(StatusCodes.NOT_FOUND, "Review not found");
  }

  console.log({
    userId,
    explorerId: explorer.id,
    reviewReviewerId: review.reviewerId,
  });

  // ✅ 3. TRUE OWNERSHIP CHECK
  if (review.reviewerId !== explorer.id) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You cannot update this review"
    );
  }

  // ✅ 4. Update review
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data,
  });

  return updated;
};


const deleteReview = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new customError(StatusCodes.NOT_FOUND, "Review not found");
  }

  if (review.reviewerId !== userId) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You cannot delete this review"
    );
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return true;
};

const adminUpdateStatus = async (
  reviewId: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) => {
  return prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getMyReviews,
  adminUpdateStatus,
};
