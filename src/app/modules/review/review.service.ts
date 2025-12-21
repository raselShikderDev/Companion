/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all lint/suspicious/noExplicitAny: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { CreateReviewInput, UpdateReviewInput } from "./review.interface";
import { prismaQueryBuilder } from "../../shared/queryBuilder";
import { MatchStatus, Prisma, ReviewStatus, TripStatus } from "@prisma/client";

const createReview = async (userId: string, data: CreateReviewInput) => {
  const { matchId, rating, comment } = data;

  //  1. Convert USER → EXPLORER
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  //  2. Get Match + Trip
  const match = await prisma.match.findUnique({
    where: { id: matchId, status: MatchStatus.COMPLETED },
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

  //  3. TRUE MATCH MEMBERSHIP CHECK (FIXED)
  if (match.requesterId !== explorer.id && match.recipientId !== explorer.id) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not part of this match"
    );
  }

  //  4. Match must be ACCEPTED
  if (match.status !== MatchStatus.COMPLETED) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "You can only review an accepted match"
    );
  }

  //  5. Trip must be completed
  if (match.trip.status !== TripStatus.COMPLETED) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Review is allowed only after trip completion"
    );
  }

  //  6. Prevent duplicate review
  const alreadyReviewed = await prisma.review.findFirst({
    where: {
      matchId,
      reviewerId: explorer.id, //  FIXED
    },
  });

  if (alreadyReviewed) {
    throw new customError(
      StatusCodes.CONFLICT,
      "You already reviewed this match"
    );
  }

  //  7. Create review safely
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

const getAllReviews = async (query: Record<string, any>) => {
  //   return prisma.review.findMany({
  //     include: { reviewer: true, match: true },
  //   });
  const builtQuery = prismaQueryBuilder(query, ["status", "comment"]);

  const whereCondition = {
    ...builtQuery.where,
  };

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const [metaDataCount, data] = await Promise.all([
    prisma.review.count({ where: whereCondition }),
    prisma.review.findMany({
      where: whereCondition,
      include: {
        reviewer: true,
        match: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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

const getMyReviews = async (userId: string, query: Record<string, any>) => {
  const builtQuery = prismaQueryBuilder(query, ["comment", "status"]);

   const explorer = await prisma.explorer.findFirst({
      where: { userId },
    });
  
    if (!explorer) {
      throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
    }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.ReviewWhereInput = {
    AND: [
      { reviewerId: explorer.id },
      ...(Object.keys(builtQuery.where).length ? [builtQuery.where] : []),
    ],
  };

  const data = await prisma.review.findMany({
    where: whereCondition,
    include: {
      reviewer: true,
      match: {
        include: { trip: true },
      },
      
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // const data2 = await prisma.review.findMany()

  const total = await prisma.review.count({ where: whereCondition });
  return {
    meta: {
      page,
      limit,
      total,
    },
    data:data,
  };
};

// const getSingleReview = async (id: string) => {
//   console.log({id});

//   const review = await prisma.review.findUnique({
//     where: { id },
//     include: { reviewer: true, match: true },
//   });

//   if (!review) {
//     throw new customError(StatusCodes.NOT_FOUND, "Review not found");
//   }

//   return review;
// };

// const getReviewByMatchId = async (matchId: string) => {
//   const review = await prisma.review.findMany({
//     where: { matchId },
//     include: { reviewer: true, match: true, },
//   });

//   if (!review) {
//     throw new customError(StatusCodes.NOT_FOUND, "Review not found");
//   }

//   return review;
// };
const getSingleReview = async (id: string) => {
  if (!id) throw new customError(StatusCodes.BAD_REQUEST, "ID is required");

  const review = await prisma.review.findUnique({
    where: { id },
    include: { reviewer: true, match: true },
  });

  if (!review) throw new customError(StatusCodes.NOT_FOUND, "Review not found");
  return review;
};

const getReviewByMatchId = async (matchId: string) => {
  const data = await prisma.review.findMany({
    where: { matchId },
    include: { reviewer: true, match: true },
  });

  // Correct check for findMany
  if (!data || data.length === 0) {
    throw new customError(
      StatusCodes.NOT_FOUND,
      "No reviews found for this match"
    );
  }

  return data;
};
const updateReview = async (
  reviewId: string,
  userId: string,
  data: UpdateReviewInput
) => {
  //  1. Convert USER → EXPLORER
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  //  2. Get review
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

  //  3. TRUE OWNERSHIP CHECK
  if (review.reviewerId !== explorer.id) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You cannot update this review"
    );
  }

  //  4. Update review
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
  getReviewByMatchId,
};
