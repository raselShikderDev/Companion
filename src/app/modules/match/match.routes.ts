// /** biome-ignore-all lint/correctness/noUnusedImports: > */
// // biome-ignore assist/source/organizeImports: >
// import { validateRequest } from "../../middlewares/validateRequest";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "@prisma/client";
// import { Router } from "express";
// import { matchController } from "./match.controller";
// import { createMatchSchema, updateMatchStatusSchema } from "./match.validation";

// const router = Router();

// // create a match (requester creates a match to recipient)
// router.post("/", checkAuth(Role.EXPLORER), validateRequest(createMatchSchema), matchController.createMatch);

// // update match (status update etc.)
// router.patch("/:id", checkAuth(Role.EXPLORER), validateRequest(updateMatchStatusSchema), matchController.updateStatus);

// // get single match
// router.get("/:id", checkAuth(Role.EXPLORER), matchController.getAllMatches);

// // get all matches (admin or for debug)
// router.get("/", checkAuth(Role.EXPLORER), matchController.getAllMatches);

// // get logged-in user's matches (incoming + outgoing)
// router.get("/my-matches", checkAuth(Role.EXPLORER), matchController.getMyMatches);

// // delete match
// router.delete("/:id", checkAuth(Role.EXPLORER), matchController.deleteMatch);

// export const matchRouter = router;



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
