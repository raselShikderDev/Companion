/** biome-ignore-all lint/correctness/noUnusedImports: > */
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { loginZodSchema } from "./auth.zodSchema";
import { authController } from "./authController";


const router = Router()

router.post("/login", validateRequest(loginZodSchema), authController.login);


export const authRouter = router