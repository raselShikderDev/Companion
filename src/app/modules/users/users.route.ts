/** biome-ignore-all lint/correctness/noUnusedImports: > */
import { type Request, type Response, Router } from "express";
import { userController } from "./user.controller";


const router = Router()

router.get("/", userController.getAllUsers);

export const userRouter = router