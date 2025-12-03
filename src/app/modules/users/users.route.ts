/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { type Request, type Response, Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createAdminZodSchema, createExplorerZodSchema } from "./user.zodSchema";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";


const router = Router()

router.post("/create-explorer", validateRequest(createExplorerZodSchema), userController.createExplorer);
router.post("/create-admin", validateRequest(createAdminZodSchema), checkAuth(Role.ADMIN, Role.SUPER_ADMIN), userController.createAdmin);
router.get("/", userController.getAllUsers);

export const userRouter = router