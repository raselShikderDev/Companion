import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { CreateReviewInput, UpdateReviewInput } from "./review.interface";
import { prismaQueryBuilder } from "../../shared/queryBuilder";

 const createReview = async (
  userId: string,
  data: CreateReviewInput
) => {
  const { matchId, rating, comment } = data;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      requester: true,
      recipient: true,
    }
  });

  if (!match) {
    throw new customError(StatusCodes.NOT_FOUND, "Match not found");
  }

  // Check if this user is part of this match
  if (match.requesterId !== userId && match.recipientId !== userId) {
    throw new customError(StatusCodes.FORBIDDEN, "You are not part of this match");
  }

  // Check trip completed (matchCompleted = true)
  const relatedTrip = await prisma.trip.findFirst({
    where: {
      creatorId: {
        in: [match.requesterId, match.recipientId]
      },
      matchCompleted: true
    }
  });

  if (!relatedTrip) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Review not allowed until trip is completed"
    );
  }

  const review = await prisma.review.create({
    data: {
      matchId,
      reviewerId: userId,
      rating,
      comment,
      status: "PENDING",
    }
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


const getMyReviews = async (userId: string, query: Record<string, any>) => {
  const builtQuery = prismaQueryBuilder(query, ["comment", "status"]);

  // Fix: wrap inside AND so TypeScript & Prisma accepts it
  const finalWhere = {
    AND: [
      builtQuery.where,
      { reviewerId: userId },
    ],
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
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new customError(StatusCodes.NOT_FOUND, "Review not found");
  }

  if (review.reviewerId !== userId) {
    throw new customError(StatusCodes.FORBIDDEN, "You cannot update this review");
  }

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
    throw new customError(StatusCodes.FORBIDDEN, "You cannot delete this review");
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return true;
};

const adminUpdateStatus = async (reviewId: string, status: "PENDING" | "APPROVED" | "REJECTED") => {
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
