/** biome-ignore-all lint/correctness/noUnusedImports: > */
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { forgotPasswordSchema, loginZodSchema, resetPasswordSchema, verifyOtpSchema } from "./auth.zodSchema";
import { authController } from "./authController";

const router = Router();

router.post("/login", validateRequest(loginZodSchema), authController.login);
router.post("/logout", authController.logOut);

router.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", validateRequest(verifyOtpSchema), authController.verifyOTP);
router.post("/reset-password", validateRequest(resetPasswordSchema), authController.resetPassword);

export const authRouter = router;
