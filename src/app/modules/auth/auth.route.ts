/** biome-ignore-all lint/correctness/noUnusedImports: > */
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { changePasswordSchema, forgotPasswordSchema, loginZodSchema, resetPasswordSchema, verifyOtpSchema } from "./auth.zodSchema";
import { authController } from "./authController";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";

const router = Router();

router.post("/signin", validateRequest(loginZodSchema), authController.login);
router.post("/signout", authController.logOut);

router.post("/refresh-token", authController.refreshToken);


router.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", validateRequest(verifyOtpSchema), authController.verifyOTP);
router.post("/reset-password", validateRequest(resetPasswordSchema), authController.resetPassword);
router.patch("/change-password", checkAuth(...Object.values(Role)), validateRequest(changePasswordSchema), authController.changePassword);

export const authRouter = router;
