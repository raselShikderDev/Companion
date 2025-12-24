/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { createTripInput } from "./trip.interface";
import catchAsync from "../../shared/catchAsync";
import { NextFunction, Request, Response } from "express";
import { TripService } from "./trip.service";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/sendResponse";
import customError from "../../shared/customError";
import { TripStatus } from "@prisma/client";

// Create trip
 const createTrip = catchAsync(
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
 const updateTrip = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const tripId = req.params.id;
    const userId = req.user?.id;

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
 const getTripById = catchAsync(async (req: Request, res: Response) => {
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
 const getAllTrips = catchAsync(async (req: Request, res: Response) => {
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
 const getMyTrips = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");

  console.log({"queryStatus:":req.query.status});
  

  const myTrips = await TripService.getMyTrips(userId, req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your trips fetched successfully",
    data: myTrips.data,
    meta: myTrips.meta,
  });
});


// Delete trip
 const deleteTrip = catchAsync(async (req: Request, res: Response) => {
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


const updateTripStatus =  catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const tripId = req.params.id;

  if (!userId) {
    throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const result = await TripService.updateTripStatus(
    tripId,
    userId,
    req.body.status as TripStatus,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Trip successfully completed",
    data: result,
  });
});

 const getAvailableTrips = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new customError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }
    console.log({userId});
    
    const result = await TripService.getAllAvailableTrips(
      userId,
      req.query as Record<string, string>
    );

    if (result.data.length ===0) {
      console.log("no trips found");
      
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);


export const TripController = {
  createTrip,
  updateTrip,
  getTripById,
  getAllTrips,
  getMyTrips,
  deleteTrip,
  updateTripStatus,
  getAvailableTrips,
};
