import { StatusCodes } from "http-status-codes";
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { createTripInput, UpdateTripInput } from "./trip.interface";


export const createTrip = async (data: createTripInput, userId: string) => {
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
  const totalMatches = (explorer.outgoingMatches?.length || 0) + (explorer.incomingMatches?.length || 0);

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
        requiredPerson: data.requiredPerson,
        journeyType: data.journeyType,
        duration: data.duration,
        Languages: data.Languages,
        creatorId: explorer.id,
      },
    });

    // Optionally, update explorer updatedAt (or other info)
    await prismaTx.explorer.update({
      where: { id: explorer.id },
      data: {
        updatedAt: new Date(),
        // If you had other fields to update, you can do here
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


export const updateTrip = async (tripId: string, data: UpdateTripInput, userId: string) => {
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
    throw new customError(StatusCodes.FORBIDDEN, "You are not allowed to update this trip");
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


export const TripService = {
  createTrip,
  updateTrip,
}