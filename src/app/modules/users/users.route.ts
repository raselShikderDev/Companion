/** biome-ignore-all lint/correctness/noUnusedImports: > */
import { type Request, type Response, Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createExplorerZodSchema } from "./user.zodSchema";


const router = Router()

router.post("/create-explorer", validateRequest(createExplorerZodSchema), userController.createExplorer);
router.post("/create-admin", userController.createAdmin);
router.get("/", userController.getAllUsers);

export const userRouter = router