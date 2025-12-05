/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { createTripInput } from "./trip.interface";
import catchAsync from "../../shared/catchAsync";
import { NextFunction, Request, Response } from "express";
import { TripService } from "./trip.service";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/sendResponse";
import customError from "../../shared/customError";

// Create trip
export const createTrip = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user;
    if (!user?.email && user?.id) {
      throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const tripData: createTripInput = req.body;

    const trip = await TripService.createTrip(tripData, user?.id as string);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Trip successfully created",
      data: trip,
    });
  }
);

// Update trip
export const updateTrip = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const tripId = req.params.id;
    const userId = req.user?.id;
    console.log({ "req?.user": req?.user });

    if (!userId)
      throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");

    // Update trip
    const updatedTrip = await TripService.updateTrip(tripId, req.body, userId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Trip successfully updated",
      data: updatedTrip,
    });
  }
);

// Get single trip
export const getTripById = catchAsync(async (req: Request, res: Response) => {
  const tripId = req.params.id;
  const trip = await TripService.getTripById(tripId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Trip fetched successfully",
    data: trip,
  });
});

// Get all trips
export const getAllTrips = catchAsync(async (req: Request, res: Response) => {
  const trips = await TripService.getAllTrips(req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All trips fetched successfully",
    data: trips.data,
    meta:trips.meta
  });
});

// Get logged-in user trips
export const getMyTrips = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");
console.log("userid in controller my trips: ", userId);

  const myTrips = await TripService.getMyTrips(userId);
  console.log(myTrips);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your trips fetched successfully",
    data: myTrips,
  });
});

// Delete trip
export const deleteTrip = catchAsync(async (req: Request, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  await TripService.deleteTrip(tripId, userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Trip deleted successfully",
    data: null,
  });
});

export const TripController = {
  createTrip,
  updateTrip,
  getTripById,
  getAllTrips,
  getMyTrips,
  deleteTrip,
};
