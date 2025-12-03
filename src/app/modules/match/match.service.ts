import { prisma } from "../../configs/db.config";
import { StatusCodes } from "http-status-codes";
import customError from "../../shared/customError";
import { CreateMatchInput, UpdateMatchStatusInput } from "./match.interface";
import { MatchStatus } from "@prisma/client";
import { PLANS } from "../subscription/plan.config";

/**
 * Create a match request from the logged-in explorer (identified by userId) to the recipient explorer (recipientId).
 * - Prevent self-matching
 * - Prevent duplicate matches (unique constraint check)
 * - Update both explorers' updatedAt in the same transaction
 */
// export const createMatch = async (data: CreateMatchInput, userId: string) => {
//   // 1) find requester explorer based on userId
//   const requester = await prisma.explorer.findFirst({
//     where: { userId },
//   });

//   if (!requester) {
//     throw new customError(StatusCodes.NOT_FOUND, "Requester explorer not found");
//   }

//   const recipient = await prisma.explorer.findUnique({
//     where: { id: data.recipientId },
//   });

//   if (!recipient) {
//     throw new customError(StatusCodes.NOT_FOUND, "Recipient explorer not found");
//   }

//   if (requester.id === recipient.id) {
//     throw new customError(StatusCodes.BAD_REQUEST, "You cannot create a match with yourself");
//   }

//   // Check if a match already exists (either direction)
//   const existing = await prisma.match.findFirst({
//     where: {
//       OR: [
//         { requesterId: requester.id, recipientId: recipient.id },
//         { requesterId: recipient.id, recipientId: requester.id },
//       ],
//     },
//   });

//   if (existing) {
//     throw new customError(StatusCodes.CONFLICT, "A match between these explorers already exists");
//   }

//   // Transaction: create match and update both explorers' updatedAt
//   const created = await prisma.$transaction(async (tx) => {
//     const newMatch = await tx.match.create({
//       data: {
//         requesterId: requester.id,
//         recipientId: recipient.id,
//         status: MatchStatus.PENDING,
//       },
//     });

//     // touch updatedAt on both explorers (keeps recency / caches consistent)
//     await tx.explorer.update({
//       where: { id: requester.id },
//       data: { updatedAt: new Date() },
//     });

//     await tx.explorer.update({
//       where: { id: recipient.id },
//       data: { updatedAt: new Date() },
//     });

//     return newMatch;
//   });

//   return created;
// };

export const createMatch = async (requesterUserId: string, input: CreateMatchInput) => {
  // Find requester explorer
  const requester = await prisma.explorer.findFirst({ where: { userId: requesterUserId }, include: { subscription: true, outgoingMatches: true, incomingMatches: true } });
  if (!requester) throw new customError(StatusCodes.NOT_FOUND, "Requester not found");

  // Determine allowed matches for requester's plan
  const planName = requester.subscription?.planName || "FREE";
  const allowedMatches = PLANS[planName].allowedMatches;
  const totalMatches = (requester.outgoingMatches?.length || 0) + (requester.incomingMatches?.length || 0);

  if (totalMatches >= allowedMatches) {
    throw new customError(StatusCodes.FORBIDDEN, "Match limit reached. Please upgrade subscription.");
  }

  // Ensure recipient exists
  const recipient = await prisma.explorer.findUnique({ where: { id: input.recipientId } });
  if (!recipient) throw new customError(StatusCodes.NOT_FOUND, "Recipient not found");

  // Use transaction to create match and optionally update some counters
  const match = await prisma.$transaction(async (tx) => {
    const newMatch = await tx.match.create({
      data: {
        requesterId: requester.id,
        recipientId: recipient.id,
        status: "PENDING",
      },
    });

    // Optionally update both explorers updatedAt (or counts) atomically
    await tx.explorer.update({ where: { id: requester.id }, data: { updatedAt: new Date() } });
    await tx.explorer.update({ where: { id: recipient.id }, data: { updatedAt: new Date() } });

    return newMatch;
  });

  return match;
};


/**
 * Update match status
 * - Only requester or recipient can change status
 * - Updates explorers' updatedAt
 */
// export const updateMatchStatus = async (matchId: string, payload: UpdateMatchStatusInput, userId: string) => {
//   const match = await prisma.match.findUnique({
//     where: { id: matchId },
//     include: {
//       requester: true,
//       recipient: true,
//     },
//   });

//   if (!match) {
//     throw new customError(StatusCodes.NOT_FOUND, "Match not found");
//   }

//   // find who is doing the request (explorer)
//   const actingExplorer = await prisma.explorer.findFirst({ where: { userId } });
//   if (!actingExplorer) {
//     throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
//   }

//   // authorization: must be requester or recipient
//   if (actingExplorer.id !== match.requesterId && actingExplorer.id !== match.recipientId) {
//     throw new customError(StatusCodes.FORBIDDEN, "You are not allowed to change this match");
//   }

//   // Transaction: update match status and touch updatedAt on both explorers
//   const updated = await prisma.$transaction(async (tx) => {
//     const updatedMatch = await tx.match.update({
//       where: { id: matchId },
//       data: { status: payload.status },
//     });

//     await tx.explorer.update({
//       where: { id: match.requesterId },
//       data: { updatedAt: new Date() },
//     });

//     await tx.explorer.update({
//       where: { id: match.recipientId },
//       data: { updatedAt: new Date() },
//     });

//     return updatedMatch;
//   });

//   return updated;
// };


export const updateMatchStatus = async (matchId: string, actingUserId: string, input: UpdateMatchStatusInput) => {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { requester: true, recipient: true } });
  if (!match) throw new customError(StatusCodes.NOT_FOUND, "Match not found");

  // Only requester or recipient can change status; recipient typically accepts/rejects
  const actingExplorer = await prisma.explorer.findFirst({ where: { userId: actingUserId } });
  if (!actingExplorer) throw new customError(StatusCodes.NOT_FOUND, "User not found as explorer");

  // check permission
  if (![match.requesterId, match.recipientId].includes(actingExplorer.id)) {
    throw new customError(StatusCodes.FORBIDDEN, "Not allowed to modify this match");
  }

  // If status transitions to ACCEPTED, you may want to update something on Trip or both explorers (example)
  const updatedMatch = await prisma.$transaction(async (tx) => {
    const m = await tx.match.update({ where: { id: matchId }, data: { status: input.status } });

    // Example: if ACCEPTED, increment some count or update trip.matchCompleted if relevant
    if (input.status === "ACCEPTED") {
      // no direct link to a trip in your model — if you have logic to mark a Trip matchCompleted, add it here
    }

    return m;
  });

  return updatedMatch;
};


/**
 * Get all matches (admin / public). Include explorer basics.
 */
export const getAllMatches = async () => {
  return prisma.match.findMany({
    include: {
      requester: {
        select: { id: true, fullName: true, userId: true, profilePicture: true },
      },
      recipient: {
        select: { id: true, fullName: true, userId: true, profilePicture: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get matches for the logged-in explorer
 */
export const getMyMatches = async (userId: string) => {
  const explorer = await prisma.explorer.findFirst({ where: { userId } });
  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  return prisma.match.findMany({
    where: {
      OR: [{ requesterId: explorer.id }, { recipientId: explorer.id }],
    },
    include: {
      requester: { select: { id: true, fullName: true, userId: true, profilePicture: true } },
      recipient: { select: { id: true, fullName: true, userId: true, profilePicture: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Delete match
 * - Only requester or recipient can delete
 * - Transactionally delete match and touch explorers' updatedAt
 */
export const deleteMatch = async (matchId: string, userId: string) => {
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

  if (actingExplorer.id !== match.requesterId && actingExplorer.id !== match.recipientId) {
    throw new customError(StatusCodes.FORBIDDEN, "You are not allowed to delete this match");
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
};
