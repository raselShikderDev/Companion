/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import { TripController } from "./trip.controller";
import { createTripZodSchema, updateTripStausSchema } from "./trip.zodSchema";

const router = Router();



// Create a trip (only explorers)
router.post(
  "/create-trip",
  validateRequest(createTripZodSchema),
  checkAuth(Role.EXPLORER),
  TripController.createTrip
);

// Get all trips
router.get("/", TripController.getAllTrips);

// Get logged-in user's trips
router.get("/my-trips", checkAuth(Role.EXPLORER), TripController.getMyTrips);

router.get(
  "/available",
  checkAuth(Role.EXPLORER),
  TripController.getAvailableTrips
);


// Get single trip
router.get("/:id", TripController.getTripById);


// Update trip status for admin
router.patch(
  "/status/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateTripStausSchema),
  TripController.updateAdminTripStatus
);


router.patch(
  "/complete/:id",
  checkAuth(Role.EXPLORER),
  validateRequest(updateTripStausSchema),
  TripController.updateTripStatus
);


// Update trip
router.patch("/:id", checkAuth(Role.EXPLORER), TripController.updateTrip);

// Delete trip
router.delete("/:id", checkAuth(...Object.values(Role)), TripController.deleteTrip);

export const tripRouter = router;
