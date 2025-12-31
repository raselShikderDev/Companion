import z from "zod";

export const loginZodSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().min(6).max(6),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(64, "Password is too long"),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });