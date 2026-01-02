/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { subscriptionController } from "./subscription.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createSubscriptionSchema } from "./subscription.validation";

const router = Router();

router.get(
  "/my-subscripion",
  checkAuth(...Object.values(Role)),
  subscriptionController.getMySubscription
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  subscriptionController.getAllSubscription
);
router.get(
  "/:id",
  checkAuth(...Object.values(Role)),
  subscriptionController.getSingleSubscription
);

// router.post("/initiate", checkAuth(...Object.values(Role)), validateRequest(initiatePaymentSchema), subscriptionController.initiatePayment);

router.post(
  "/create",
  checkAuth(...Object.values(Role)),
  validateRequest(createSubscriptionSchema),
  subscriptionController.createSubscription
);

// SSLCommerz webhook endpoint (provider will call)
router.post("/validate-payment", subscriptionController.sslcommerzWebhook);

export const subscriptionRouter = router;
