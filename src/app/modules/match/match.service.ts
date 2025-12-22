/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { prisma } from "../../configs/db.config";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { UpdateMatchStatusInput } from "./match.interface";
import { MatchStatus, Prisma, TripStatus } from "@prisma/client";
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
  input: {
    status:  MatchStatus
  }
) => {
  // 1. USER → EXPLORER
  const actingExplorer = await prisma.explorer.findFirst({
    where: { userId: actingUserId },
  });

  if (!actingExplorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // 2. Load match + trip
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { trip: true },
  });

  if (!match) {
    throw new customError(StatusCodes.NOT_FOUND, "Match not found");
  }

  const isRequester = match.requesterId === actingExplorer.id;
  const isRecipient = match.recipientId === actingExplorer.id;

  // 3. Must be part of match
  if (!isRequester && !isRecipient) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not part of this match"
    );
  }

  // 4. Terminal states — no changes allowed
  if (
    match.status === MatchStatus.REJECTED ||
    match.status === MatchStatus.CANCELLED
  ) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "This match can no longer be updated"
    );
  }

  // 5. CANCEL — requester only
  if (input.status === MatchStatus.CANCELLED && !isRequester) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "Only requester can cancel the match"
    );
  }

  // 6. ACCEPT / REJECT — trip owner only
  if (
    input.status === MatchStatus.ACCEPTED ||
    input.status === MatchStatus.REJECTED
  ) {
    if (!isRecipient || match.trip.creatorId !== actingExplorer.id) {
      throw new customError(
        StatusCodes.FORBIDDEN,
        "Only trip owner can accept or reject the match"
      );
    }
  }

  // 7. COMPLETED — strict rules
  if (input.status === MatchStatus.COMPLETED) {
    if (match.status !== MatchStatus.ACCEPTED) {
      throw new customError(
        StatusCodes.BAD_REQUEST,
        "Match must be accepted before completion"
      );
    }

    if (!match.trip.matchCompleted) {
      throw new customError(
        StatusCodes.BAD_REQUEST,
        "Trip must be completed first"
      );
    }
  }

  // 8. Transaction-safe update
  const updatedMatch = await prisma.$transaction(async (tx) => {
    const updated = await tx.match.update({
      where: { id: matchId },
      data: { status: input.status },
    });

    /**
     * IMPORTANT:
     * - ACCEPT → NO trip update (by your design)
     * - REJECT / CANCEL → trip becomes available automatically
     *   because availability is inferred from ACCEPTED matches
     */

    return updated; // ✅ REQUIRED
  });

  return updatedMatch;
};



const getSingleMatch = async (id: string) => {
  const match = await prisma.match.findUnique({
    where: { id },
    include: { requester: true, recipient: true, reviews: true, trip: true },
  });

  if (!match) throw new customError(StatusCodes.NOT_FOUND, "Match not found");

  return match;
};

/**
 * Get all matches (admin / public). Include explorer basics.
 */
const getAllMatches = async (query: Record<string, string>) => {
  const builtQuery = prismaQueryBuilder(query, ["status"]);

  const whereCondition = {
    ...builtQuery.where,
  };

  const matches = await prisma.match.findMany({
    where: whereCondition,
    include: { requester: true, recipient: true, reviews: true, trip: true },
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
  const builtQuery = prismaQueryBuilder(query, ["status"]);
  // console.log({ queryStatus: query.status, querySearchTerm: query.searchTerm });

  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // const whereCondition = {
  //   ...builtQuery.where,
  //   OR: [{ requesterId: explorer.id }, { recipientId: explorer.id }],
  // };

  //   const whereCondition = {
  //   AND: [
  //     {
  //       OR: [
  //         { requesterId: explorer.id },
  //         { recipientId: explorer.id },
  //       ],
  //     },
  //     ...(Object.keys(builtQuery.where).length
  //       ? [builtQuery.where]
  //       : []),
  //   ],
  // };

  const whereCondition = {
    AND: [
      {
        OR: [{ requesterId: explorer.id }, { recipientId: explorer.id }],
      },
      ...(Object.keys(builtQuery.where).length ? [builtQuery.where] : []),
    ],
  };

  const [data, total] = await prisma.$transaction([
    prisma.match.findMany({
      where: whereCondition,
      include: {
        reviews: {
          include: { reviewer: true },
        },
        trip: {
          select: {
            id: true,
            title: true,
            destination: true,
            image: true,
            status: true,
            startDate: true,
            endDate: true,
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

const buildPagination = (query: Record<string, string>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const includePayload = {
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
};

/**
 * ACCEPTED MATCHES
 * requester OR recipient === me
 */
const getAcceptedMatches = async (
  userId: string,
  query: Record<string, string>
) => {
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer)
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");

  const { page, limit, skip } = buildPagination(query);

  const where: Prisma.MatchWhereInput = {
    status: MatchStatus.ACCEPTED,
    OR: [{ requesterId: explorer.id }, { recipientId: explorer.id }],
  };

  const [data, total] = await prisma.$transaction([
    prisma.match.findMany({
      where,
      include: includePayload,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.count({ where }),
  ]);

  return { meta: { page, limit, total }, data };
};

/**
 * SENT REQUESTS
 * requester === me & status = PENDING
 */
const getSentRequests = async (
  userId: string,
  query: Record<string, string>
) => {
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer)
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");

  const { page, limit, skip } = buildPagination(query);

  const where: Prisma.MatchWhereInput = {
    status: MatchStatus.PENDING,
    requesterId: explorer.id,
  };

  const [data, total] = await prisma.$transaction([
    prisma.match.findMany({
      where,
      include: includePayload,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.count({ where }),
  ]);

  return { meta: { page, limit, total }, data };
};

/**
 * PENDING REQUESTS
 * recipient === me & status = PENDING
 */
const getPendingRequests = async (
  userId: string,
  query: Record<string, string>
) => {
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer)
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");

  const { page, limit, skip } = buildPagination(query);

  const where: Prisma.MatchWhereInput = {
    status: MatchStatus.PENDING,
    recipientId: explorer.id,
  };

  const [data, total] = await prisma.$transaction([
    prisma.match.findMany({
      where,
      include: includePayload,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.count({ where }),
  ]);

  return { meta: { page, limit, total }, data };
};

export const matchService = {
  createMatch,
  updateMatchStatus,
  getAllMatches,
  getMyMatches,
  deleteMatch,
  getSingleMatch,
  getAcceptedMatches,
  getSentRequests,
  getPendingRequests,
};
