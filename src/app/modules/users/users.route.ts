/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { type Request, type Response, Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createAdminZodSchema, createExplorerZodSchema, updateProfilePictureSchema, updateUserProfileSchema } from "./user.zodSchema";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";


const router = Router()

router.post("/create-explorer", validateRequest(createExplorerZodSchema), userController.createExplorer);
router.post("/create-admin", validateRequest(createAdminZodSchema), checkAuth(Role.ADMIN, Role.SUPER_ADMIN), userController.createAdmin);
// Change profile picture
router.patch(
  "/profile-picture",
  checkAuth(Role.ADMIN, Role.EXPLORER),
  validateRequest(updateProfilePictureSchema),
  userController.updateProfilePicture
);

// Update profile info (except email, password)
router.patch(
  "/update-profile",
  checkAuth(Role.ADMIN, Role.EXPLORER),
  validateRequest(updateUserProfileSchema),
  userController.updateUserProfile
);
router.get("/", userController.getAllUsers);

export const userRouter = router