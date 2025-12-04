import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { PaymentController } from "./payment.controller";

const router = Router();

router.get("/all", checkAuth(Role.ADMIN), PaymentController.getAll);
router.get("/single/:id", checkAuth(Role.ADMIN), PaymentController.getSingle);
router.get("/my-pyment", checkAuth(Role.EXPLORER, Role.ADMIN), PaymentController.getMyPayments);

export const paymentRouter = router;
