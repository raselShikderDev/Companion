/** biome-ignore-all lint/correctness/noUnusedImports: > */
// biome-ignore assist/source/organizeImports: >
import { type Request, type Response, Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createAdminZodSchema, createExplorerZodSchema, updateProfilePictureSchema, updateUserProfileSchema } from "./user.zodSchema";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";


const router = Router()

// Get logged-in user profile (Admin + Explorer)
router.get(
  "/me",
  checkAuth(...(Object.values(Role))),
  userController.getMe
);

// Get all users (Admin only)
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userController.getAllUsers
);

// Get single user by ID (Admin only)
router.get(
  "/:id",
  checkAuth(Role.ADMIN),
  userController.getSingleUser
);


router.post("/create-explorer", validateRequest(createExplorerZodSchema), userController.createExplorer);
router.post("/create-admin", validateRequest(createAdminZodSchema), checkAuth(Role.ADMIN, Role.SUPER_ADMIN), userController.createAdmin);
// Change profile picture
router.patch(
  "/profile-picture",
  checkAuth(Role.ADMIN, Role.EXPLORER),
  validateRequest(updateProfilePictureSchema),
  userController.updateProfilePicture
);

// Update profile info 
router.patch(
  "/update-profile",
  checkAuth(Role.ADMIN, Role.EXPLORER),
  validateRequest(updateUserProfileSchema),
  userController.updateUserProfile
);

// Toggle ACTIVE ⇄ BLOCKED
router.patch(
  "/status/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userController.toggleUserStatusChange
);

// Toggle isDeleted (Soft delete / Restore)
router.patch(
  "/soft-delete/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  userController.toggleSoftDeleteUser
);

// Permanent delete 
router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN),
  userController.permanentDeleteUser
);


export const userRouter = router