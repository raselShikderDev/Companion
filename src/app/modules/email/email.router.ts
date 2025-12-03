import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { emailController } from "./email.controller";

const router = Router();

router.post("/send-confirm", checkAuth(Role.EXPLORER), emailController.sendConfirm);
router.get("/confirm", emailController.confirm); // public, token in query


export const emailRouter = router;
