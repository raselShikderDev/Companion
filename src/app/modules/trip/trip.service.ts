/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all lint/suspicious/noExplicitAny: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { createTripInput, UpdateTripInput } from "./trip.interface";
import { prismaQueryBuilder } from "../../shared/queryBuilder";
import { MatchStatus, TripStatus } from "@prisma/client";

const createTrip = async (data: createTripInput, userId: string) => {
  // Find the Explorer
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
    include: {
      incomingMatches: true,
      outgoingMatches: true,
      subscription: true,
    },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // Count total matches
  const totalMatches =
    (explorer.outgoingMatches?.length || 0) +
    (explorer.incomingMatches?.length || 0);

  // Check subscription
  const hasActiveSubscription = explorer.subscription?.isActive;

  if (totalMatches >= 3 && !hasActiveSubscription) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "You have reached 3 matches. Please subscribe to create more trips."
    );
  }

  // Transaction: create trip and automatically associate with explorer
  const trip = await prisma.$transaction(async (prismaTx) => {
    // Create the trip with nested connect to creator
    const newTrip = await prismaTx.trip.create({
      data: {
        title: data.title,
        destination: data.destination,
        departureLocation: data.departureLocation,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description,
        budget: data.budget,
        image: data.image,
        journeyType: data.journeyType,
        duration: data.duration,
        Languages: data.Languages,
        creatorId: explorer.id,
      },
    });

    await prismaTx.explorer.update({
      where: { id: explorer.id },
      data: {
        updatedAt: new Date(),
      },
    });

    return newTrip;
  });
  return trip;
};

// http://localhost:5000/api/v1/trip/create-trip
// {
//   "title": " Adventure",
//   "destination": "Kyoto, Japan",
//   "departureLocation": "San Francisco, USA",
//   "startDate": "2024-04-10T00:00:00.000Z",
//   "endDate": "2024-04-20T00:00:00.000Z",
//   "description": "Experience the cherry blossoms and ancient temples on a budget.",
//   "budget": "2500 USD",
//   "requiredPerson": "3",
//   "journeyType": [
//     "Adventure",
//     "Cultural",
//     "Sightseeing"
//   ],
//   "duration": "10 Days",
//   "Languages": [
//     "English",
//     "Japanese"
//   ]
// }

const updateTrip = async (
  tripId: string,
  data: UpdateTripInput,
  userId: string
) => {
  // Find the trip and its creator
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { creator: true },
  });

  if (!trip) {
    throw new customError(StatusCodes.NOT_FOUND, "Trip not found");
  }

  // Check if the user owns the trip
  if (trip.creator.userId !== userId) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to update this trip"
    );
  }

  // Update the trip
  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  return updatedTrip;
};
// http://localhost:5000/api/v1/trip/42f75134-620e-4897-bca1-ec3774db473d

const getTripById = async (tripId: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { creator: true },
  });
  if (!trip) throw new customError(StatusCodes.NOT_FOUND, "Trip not found");
  return trip;
};

const getAllTrips = async (query: Record<string, string>) => {
  // return prisma.trip.findMany({
  //   include: { creator: true },
  //   orderBy: { createdAt: "desc" },
  // });
  const builtQuery = prismaQueryBuilder(query, [
    "title",
    "destination",
    "matchCompleted",
  ]);

  const trips = await prisma.trip.findMany({
    ...builtQuery,
    include: {
      creator: true,
    },
  });
  const total = await prisma.trip.count({ where: builtQuery.where });

  return {
    data: trips,
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      total,
    },
  };
};

const getMyTrips = async (userId: string, query: Record<string, string>) => {
  console.log({ userId });
  const builtQuery = prismaQueryBuilder(query, [
    "title",
    "destination",
    "matchCompleted",
  ]);

  const trips = await prisma.trip.findMany({
    where: { creator: { userId } },
    include: { creator: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("my trips: ", trips);

  const total = await prisma.trip.count({ where: builtQuery.where });

  return {
    data: trips,
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      total,
    },
  };
};

const deleteTrip = async (tripId: string, userId: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { creator: true },
  });
  if (!trip) throw new customError(StatusCodes.NOT_FOUND, "Trip not found");
  if (trip.creator.userId !== userId) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to delete this trip"
    );
  }
  return prisma.trip.delete({ where: { id: tripId } });
};

const updateTripStatus = async (
  tripId: string,
  userId: string,
  newStatus: TripStatus
) => {
  // ✅ 1. Convert USER → EXPLORER
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  // ✅ 2. Load trip with ACCEPTED matches only
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      matches: {
        where: {
          status: MatchStatus.ACCEPTED,
        },
      },
    },
  });

  if (!trip) {
    throw new customError(StatusCodes.NOT_FOUND, "Trip not found");
  }

  // ✅ 3. Must either be:
  // - trip creator
  // - OR part of an accepted match
  const isCreator = trip.creatorId === explorer.id;
  const isMatchedUser = trip.matches.some(
    (m) => m.requesterId === explorer.id || m.recipientId === explorer.id
  );

  if (!isCreator && !isMatchedUser) {
    throw new customError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to complete this trip"
    );
  }

  // ✅ 4. Already completed protection
  if (
    trip.status === TripStatus.COMPLETED ||
    trip.status === TripStatus.CANCELLED
  ) {
    throw new customError(
      StatusCodes.CONFLICT,
      `Trip is already marked as ${trip.status}`
    );
  }

  // ✅ 5. TRANSACTION-SAFE UPDATE
  const updatedTrip = await prisma.$transaction(async (tx) => {
    // ✅ lock-style recheck inside transaction
    const freshTrip = await tx.trip.findUnique({
      where: { id: tripId, matchCompleted: true },
    });

    if (freshTrip?.status === TripStatus.COMPLETED) {
      throw new customError(
        StatusCodes.CONFLICT,
        "Trip already marked as completed"
      );
    }

    const result = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return result;
  });

  return updatedTrip;
};

const getAvailableTrips = async (
  userId: string,
  query: any
) => {
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) {
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const search = query.search?.toString();

  const filters: any = {};

  if (query.destination) {
    filters.destination = {
      contains: query.destination,
      mode: "insensitive",
    };
  }

  if (query.status) {
    filters.status = query.status;
  }

  const whereCondition = {
    AND: [
      { creatorId: { not: explorer.id } },

      { matchCompleted: false },

      {
        matches: {
          none: {
            OR: [
              { requesterId: explorer.id },
              { recipientId: explorer.id },
            ],
          },
        },
      },

      search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                destination: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},
    ],
    ...filters,
  };

  const [data, total] = await prisma.$transaction([
    prisma.trip.findMany({
      where: whereCondition,
      include: {
        creator: {
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
    prisma.trip.count({ where: whereCondition }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
    },
  };
};


export const TripService = {
  createTrip,
  updateTrip,
  getTripById,
  getAllTrips,
  getMyTrips,
  deleteTrip,
  updateTripStatus,
  getAvailableTrips
};
