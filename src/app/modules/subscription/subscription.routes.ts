import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { subscriptionController } from "./subscription.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createSubscriptionSchema, initiatePaymentSchema } from "./subscription.validation";

const router = Router();


router.get("/", checkAuth(Role.ADMIN), subscriptionController.getAllSubscription);
router.get("/:id", checkAuth(Role.ADMIN), subscriptionController.getSingleSubscription);
router.get("/my-subscripion", checkAuth(Role.EXPLORER, Role.ADMIN), subscriptionController.getMySubscription);

router.post("/initiate", checkAuth(Role.EXPLORER), validateRequest(initiatePaymentSchema), subscriptionController.initiatePayment);

router.post("/create", checkAuth(Role.EXPLORER), validateRequest(createSubscriptionSchema), subscriptionController.createSubscription);

// SSLCommerz webhook endpoint (provider will call)
router.post("/webhook/sslcommerz", subscriptionController.sslcommerzWebhook);



export const subscriptionRouter = router;



// import { Router } from "express";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "@prisma/client";
// import { subscriptionController } from "./subscription.controller";
// import { validateRequest } from "../../middlewares/validateRequest";
// import { createSubscriptionSchema } from "./subscription.validation";
// const router = Router();

// router.post("/initiate", checkAuth(Role.EXPLORER), subscriptionController.initiatePayment);


// router.post("/create", checkAuth(Role.EXPLORER), validateRequest(createSubscriptionSchema), subscriptionController.createSubscription);

// // SSLCommerz webhook endpoint (should be public & protected via provider's signature/IP verification)
// router.post("/webhook/sslcommerz", subscriptionController.sslcommerzWebhook);

// export const subscriptionRouter = router;
