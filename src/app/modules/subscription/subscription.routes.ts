
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { subscriptionController } from "./subscription.controller";
import { validateRequest } from "../../middlewares/validateRequest";
const router = Router();

router.post("/initiate", checkAuth(Role.EXPLORER), subscriptionController.initiatePayment);

// SSLCommerz will POST IPN/webhook to this endpoint; don't require auth
// router.post("/webhook/sslcommerz", sslcommerzWebhook);

router.post("/create", checkAuth(Role.EXPLORER), validateRequest(createSubscriptionSchema), subscriptionController.createSubscription);

// SSLCommerz webhook endpoint (should be public & protected via provider's signature/IP verification)
router.post("/webhook/sslcommerz", subscriptionController.sslcommerzWebhook);

export const subscriptionRouter = router;
