/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { PaymentController } from "./payment.controller";

const router = Router();

router.get("/all", checkAuth(Role.ADMIN), PaymentController.getAllPayment);
router.get("/single/:id", checkAuth(Role.ADMIN), PaymentController.getSinglePayment);
router.get("/my-pyment", checkAuth(Role.EXPLORER, Role.ADMIN), PaymentController.getMyPayments);
router.get("/fail", checkAuth(Role.EXPLORER, Role.ADMIN), PaymentController.markPaymentFailed);
router.get("/cancel", checkAuth(Role.EXPLORER, Role.ADMIN), PaymentController.markPaymentCancelled);

export const paymentRouter = router;
