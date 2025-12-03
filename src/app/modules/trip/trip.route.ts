/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { Router } from "express";
import { TripController } from "./trip.controller";
import { createTripZodSchema } from "./trip.zodSchema";


const router = Router()

router.post("/create-trip", validateRequest(createTripZodSchema), checkAuth(Role.EXPLORER),TripController.createTrip);


export const tripRouter = router