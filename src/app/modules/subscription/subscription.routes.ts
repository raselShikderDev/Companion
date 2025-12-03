
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { initiatePaymentController, sslcommerzWebhook } from "./subscription.controller";

const router = Router();

router.post("/initiate", checkAuth(Role.EXPLORER), initiatePaymentController);

// SSLCommerz will POST IPN/webhook to this endpoint; don't require auth
router.post("/webhook/sslcommerz", sslcommerzWebhook);

export const subscriptionRouter = router;
