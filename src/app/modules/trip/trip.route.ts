/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { Router } from "express";
import { TripController } from "./trip.controller";
import { createTripZodSchema } from "./trip.zodSchema";

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
router.get("/my-list", checkAuth(Role.EXPLORER), TripController.getMyTrips);

// Get single trip
router.get("/:id", TripController.getTripById);

// Update trip
router.patch("/:id", checkAuth(Role.EXPLORER), TripController.updateTrip);

// Delete trip
router.delete("/:id", checkAuth(Role.EXPLORER), TripController.deleteTrip);

export const tripRouter = router;



// /** biome-ignore-all lint/correctness/noUnusedImports: > */
// // biome-ignore assist/source/organizeImports: >
// import { validateRequest } from "../../middlewares/validateRequest";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "@prisma/client";
// import { Router } from "express";
// import { TripController } from "./trip.controller";
// import { createTripZodSchema, updateTripSchema } from "./trip.zodSchema";

// const router = Router();


// // CREATE TRIP
// router.post(
//   "/create-trip",
//   validateRequest(createTripZodSchema),
//   checkAuth(Role.EXPLORER),
//   TripController.createTrip
// );


// // UPDATE TRIP
// router.patch(
//   "/update-trip/:id",
//   validateRequest(updateTripSchema),
//   checkAuth(Role.EXPLORER),
//   TripController.updateTrip
// );


// // GET SINGLE TRIP
// router.get(
//   "/trip/:id",
//   TripController.getTripById
// );


// // GET ALL TRIPS (public or explorer?)
// // You choose — I assume Explorer only

// router.get(
//   "/",
//   TripController.getAllTrips
// );


// // GET LOGGED-IN USER TRIPS
// router.get(
//   "/my-trips",
//   checkAuth(Role.EXPLORER),
//   TripController.getMyTrips
// );


// // DELETE TRIP
// router.delete(
//   "/delete-trip/:id",
//   checkAuth(Role.EXPLORER),
//   TripController.deleteTrip
// );

// export const tripRouter = router;


