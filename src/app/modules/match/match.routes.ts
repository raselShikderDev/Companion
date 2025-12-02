/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { createMatchSchema, updateMatchStatusSchema } from "./match.validation";
import { matchController } from "./match.controller";





const router = Router();

// Create a match request
router.post(
  "/create-match",
  validateRequest(createMatchSchema),
  checkAuth(Role.EXPLORER),
  matchController.createMatch
);

// Update match status (ACCEPT / REJECT)
router.patch(
  "/update-status/:id",
  validateRequest(updateMatchStatusSchema),
  checkAuth(Role.EXPLORER),
  matchController.updateStatus
);

// Get all matches (admin or explorer if needed)
router.get(
  "/all",
  matchController.getAllMatches
);

// Get logged-in user's matches
router.get(
  "/my-matches",
 checkAuth(Role.ADMIN, Role.EXPLORER, Role.SUPER_ADMIN),
  matchController.getMyMatches
);

// Delete a match (only requester)
router.delete(
  "/delete/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  matchController.deleteMatch
);

export const matchRouter = router;
