/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { prisma } from "../../configs/db.config";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { UpdateMatchStatusInput } from "./match.interface";
import { MatchStatus, Prisma } from "@prisma/client";
import { prismaQueryBuilder } from "../../shared/queryBuilder";


const createMatch = async (requesterUserId: string, tripId: string) => {
  // 1. Get Trip + Creator
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { creator: true },
  });

  if (!trip) {
    throw new customError(StatusCodes.NOT_FOUND, "Trip not found");
  }

  // 2. Get Requester Explorer
  const requester = await prisma.explorer.findFirst({
    where: { userId: requesterUserId },
  });

  if (!requester) {
    throw new customError(StatusCodes.NOT_FOUND, "Requester not found");
  }

  // 3. Prevent Self Match
  if (requester.id === trip.creatorId) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "You cannot match with your own trip"
    );
  }

  // 4. Check Recipient (Trip Creator)
  const recipient = await prisma.explorer.findUnique({
    where: { id: trip.creatorId },
  });

  if (!recipient) {
    throw new customError(StatusCodes.NOT_FOUND, "Recipient not found");
  }

  // 5. Prevent match on completed trip
  if (trip.matchCompleted) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Trip matching is already closed"
    );
  }

  // 6. Prevent duplicate match in BOTH directions
  const existingMatch = await prisma.match.findFirst({
    where: {
      tripId,
      OR: [
        {
          requesterId: requester.id,
          recipientId: trip.creatorId,
        },
        {
          requesterId: trip.creatorId,
          recipientId: requester.id,
        },
      ],
    },
  });

  if (existingMatch) {
    throw new customError(
      StatusCodes.CONFLICT,
      "Match already exists for this trip"
    );
  }

  const match = await prisma.$transaction(async (tx) => {
    const newMatch = await tx.match.create({
      data: {
        requesterId: requester.id,
        recipientId: trip.creatorId,
        tripId,
        status: MatchStatus.PENDING,
      },
      include: {
        requester: true,
        recipient: true,
        trip: true,
      },
    });

    await tx.trip.update({
      where: {
        id: tripId,
      },
      data: {
        matchCompleted: true,
      },
    });

    return newMatch;
  });

  return match;
};


const updateMatchStatus = async (
  matchId: string,
  actingUserId: string,
  input: UpdateMatchStatusInput
) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { requester: true, recipient: true },
  });
  if (!match) throw new customError(StatusCodes.NOT_FOUND, "Match not found");

  // Only requester or recipient can change status; recipient typically accepts/rejects
  const actingExplorer = await prisma.explorer.findFirst({
    where: { userId: actingUserId },
  });
  if (!actingExplorer)
    throw new customError(StatusCodes.NOT_FOUND, "User not found as explorer");

  // check permission
  if (![match.requesterId, match.recipientId].includes(actingExplorer.id)) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "Not allowed to modify this match"
    );
  }

  // If status transitions to ACCEPTED, you may want to update something on Trip or both explorers (example)
  const updatedMatch = await prisma.$transaction(async (tx) => {
    const m = await tx.match.update({
      where: { id: matchId },
      data: { status: input.status },
    });

    // Example: if ACCEPTED, increment some count or update trip.matchCompleted if relevant
    if (input.status === MatchStatus.ACCEPTED) {
      // no direct link to a trip in your model — if you have logic to mark a Trip matchCompleted, add it here
    }

    return m;
  });

  return updatedMatch;
};

const getSingleMatch = async (id: string) => {
  const match = await prisma.match.findUnique({
    where: { id },
    include: { requester: true, recipient: true },
  });

  if (!match) throw new customError(StatusCodes.NOT_FOUND, "Match not found");

  return match;
};

/**
 * Get all matches (admin / public). Include explorer basics.
 */
const getAllMatches = async (query: Record<string, string>) => {
  const builtQuery = prismaQueryBuilder(query, ["status"]);
  
  const matches = await prisma.match.findMany({
    ...builtQuery,
    include: { requester: true, recipient: true, reviews:true },
  });

  const total = await prisma.match.count({ where: builtQuery.where });

  return {
    data: matches,
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      total,
    },
  };
};

/**
 * Get matches for the logged-in explorer
 */
const getMyMatches = async (userId: string, query: Record<string, string>) => {
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.MatchWhereInput = {
    OR: [
      { requesterId: explorer.id },
      { recipientId: explorer.id },
    ],
  };
console.log({"query.status": query.status});

  if (
    query.status &&
    query.status !== "ALL" &&
    Object.values(MatchStatus).includes(query.status as MatchStatus)
  ) {
    whereCondition.status = query.status as MatchStatus;
  }

  const [data, total] = await prisma.$transaction([
    prisma.match.findMany({
      where: whereCondition,
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            destination: true,
            image: true,
            status: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
          },
        },
        recipient: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),

    prisma.match.count({
      where: whereCondition,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};




/**
 * Delete match
 * - Only requester or recipient can delete
 * - Transactionally delete match and touch explorers' updatedAt
 */
const deleteMatch = async (matchId: string, userId: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { requester: true, recipient: true },
  });

  if (!match) {
    throw new customError(StatusCodes.NOT_FOUND, "Match not found");
  }

  const actingExplorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!actingExplorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  if (
    actingExplorer.id !== match.requesterId &&
    actingExplorer.id !== match.recipientId
  ) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to delete this match"
    );
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.explorer.update({
      where: { id: match.requesterId },
      data: { updatedAt: new Date() },
    });

    await tx.explorer.update({
      where: { id: match.recipientId },
      data: { updatedAt: new Date() },
    });

    const removed = await tx.match.delete({ where: { id: matchId } });
    return removed;
  });

  return deleted;
};

export const matchService = {
  createMatch,
  updateMatchStatus,
  getAllMatches,
  getMyMatches,
  deleteMatch,
  getSingleMatch,
};
