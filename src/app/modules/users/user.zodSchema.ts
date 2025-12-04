import { Gender } from "@prisma/client";
import { z } from "zod";

export const createExplorerZodSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    explorer: z.object({
        fullName: z.string().min(3, "Full name is too short"),
        phone: z.string().min(10, "Phone number is too short"),
        gender: z.enum(["MALE", "FEMALE"], {
            error: "Gender must be male, female or other"
        }),
        profilePicture: z.string().url("Profile picture must be a valid URL"),
    })
});


export const createAdminZodSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    admin: z.object({
        fullName: z.string().min(3, "Full name is too short"),
        phone: z.string().min(10, "Phone number is too short"),
        profilePicture: z.string().url("Profile picture must be a valid URL")
    })
});

export const updateProfilePictureSchema = z.object({
  profilePicture: z.url("Invalid image URL"),
});

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  gender: z.enum(Gender).optional(),
  age: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  travelStyleTags: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});