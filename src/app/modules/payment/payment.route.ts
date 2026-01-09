/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { PaymentController } from "./payment.controller";

const router = Router();

router.get("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PaymentController.getAllPayment);
router.get(
  "/single/:id",
  checkAuth(...Object.values(Role)),
  PaymentController.getSinglePayment
);
router.get(
  "/my-pyment",
  checkAuth(...Object.values(Role)),
  PaymentController.getMyPayments
);
router.get(
  "/fail",
  // checkAuth(Role.EXPLORER),
  PaymentController.markPaymentFailed
);
router.get(
  "/cancel",
  // checkAuth(Role.EXPLORER),
  PaymentController.markPaymentCancelled
);

export const paymentRouter = router;
