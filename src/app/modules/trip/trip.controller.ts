import catchAsync from "../../shared/catchAsync";
import { NextFunction, Request, Response } from "express";
import { createTripInput } from "./trip.interface";
import { TripService } from "./trip.service";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../shared/sendResponse";
import customError from "../../shared/customError";

export const createTrip = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

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
        data: trip
    })
})

export const updateTrip = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

   const tripId = req.params.id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Update trip
    const updatedTrip = await TripService.updateTrip(tripId, req.body, userId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Trip successfully updated",
        data: updatedTrip
    })
})

export const TripController = {
    createTrip
}


