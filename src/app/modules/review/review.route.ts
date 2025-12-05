/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminReviewStatusSchema, createReviewSchema, updateReviewSchema } from "./review.zodSchema";
import { ReviewController } from "./review.controller";

const router = Router();

router.post(
  "/create",
  validateRequest(createReviewSchema),
   checkAuth(Role.EXPLORER),
  ReviewController.createReview
);

router.get(
  "/my-review",
  checkAuth(Role.EXPLORER),
  ReviewController.getMyReviews
);


router.get(
  "/",
  ReviewController.getAllReviews
);

router.get(
  "/:id",
  ReviewController.getSingleReview
);

// Admin Review Status
router.patch(
  "/change-status/:id",
  checkAuth(Role.ADMIN),
  validateRequest(adminReviewStatusSchema),
  ReviewController.adminUpdateStatus
);

router.patch(
  "/update/:id",
  validateRequest(updateReviewSchema),
  checkAuth(Role.EXPLORER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.updateReview
);

router.delete(
  "/delete/:id",
  checkAuth(Role.EXPLORER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.deleteReview
);


export const ReviewRouter = router;
