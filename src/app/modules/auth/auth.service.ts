/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/style/useNodejsImportProtocol: > */
/** biome-ignore-all lint/suspicious/noExplicitAny: > */
/** biome-ignore-all lint/style/useImportType: > */
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { UserStatus } from "@prisma/client";
import { createUserToken } from "../../helper/userTokenGenerator";
import crypto from "crypto";

import { ResetPasswordInput, VerifyOtpInput } from "./auth.interface";
import { generateOtp } from "../../helper/generateOtp";
import { envVars } from "../../configs/envVars";
import { sendEmail } from "../../helper/sendEmail";
import { maskEmail } from "../../helper/muskEmail";
import { generateJwtToken, verifyJwtToken } from "../../helper/jwtHelper";
import { JwtPayload } from "jsonwebtoken";
import { getRedis } from "../../configs/redis.config";

const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new customError(StatusCodes.FORBIDDEN, "Account removed");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new customError(StatusCodes.FORBIDDEN, `Account is ${user.status}`);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new customError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password"
    );
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const userTokens = createUserToken(payload);

  return userTokens;
};

const refreshToken = async (token: string) => {
  let decodedData: JwtPayload | null;
  try {
    decodedData = (await verifyJwtToken(
      token,
      envVars.JWT_REFRESH_SECRET as string
    )) as JwtPayload;
  } catch (err) {
    console.log(err);
    throw new Error("You are not authorized!");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // generating token by utils function
  const accessToken = await generateJwtToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET as string,
    envVars.JWT_ACCESS_EXPIRES as string
  );

  // generating refresh token by utils function
  const refreshToken = await generateJwtToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET as string,
    envVars.JWT_REFRESH_EXPIRES as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const RESET_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const OTP_MAX_ATTEMPTS = 5; // max verification attempts
const FORGOT_RATE_LIMIT = 5; // max forgot requests per hour

// step 1: initiate forgot password (generate OTP and email it)
const forgotPassword = async (email: string) => {
  console.log({ email });

  const redis = await getRedis();
  // rate-limit: how many forgot requests in last hour
  const rateKey = `pwd_flood:${email}`;
  const floods = Number((await redis.get(rateKey)) ?? 0);
  if (floods >= FORGOT_RATE_LIMIT) {
    throw new customError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many requests. Try again later."
    );
  }

  // find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.email) {
    throw new customError(StatusCodes.NOT_FOUND, "Email is not registerd");
  }
  if (!user) {
    // Don't reveal whether email exists: act as if it was sent
    await redis.incr(rateKey);
    await redis.expire(rateKey, 60 * 60);
    return { ok: true, message: "If the email exists, an OTP has been sent." };
  }

  // produce OTP and store hashed in Redis
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpKey = `pwd_otp:${email}`;
  await redis.setEx(
    otpKey,
    OTP_TTL_SECONDS,
    JSON.stringify({ hashedOtp, createdAt: Date.now() })
  );

  // reset attempts counter
  const attemptsKey = `pwd_otp_attempts:${email}`;
  await redis.del(attemptsKey);

  // record flood counter
  await redis.incr(rateKey);
  await redis.expire(rateKey, 60 * 60); // 1 hour

  // const resetVerifyUrl = `${envVars.FRONEND_URL}/verify-otp`; // frontend route if you have one

  await sendEmail({
    to: email,
    subject: "Reset Password OTP",
    templateName: "forgotPassword",
    templateData: { otp, year: new Date().getFullYear() },
  });
  console.log({ otp });

  return { success: true, message: `OTP sent to ${maskEmail(user.email)}` };
};

// step 2: verify OTP (returns a single-use reset token if success)
const verifyOtp = async (input: VerifyOtpInput) => {
  const redis = await getRedis();

  const email = input.email.toLowerCase();
  const otpKey = `pwd_otp:${email}`;
  const attemptsKey = `pwd_otp_attempts:${email}`;

  // check attempts
  const attempts = Number((await redis.get(attemptsKey)) ?? 0);
  if (attempts >= OTP_MAX_ATTEMPTS) {
    throw new customError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many attempts. Request a new OTP."
    );
  }

  const payloadRaw = await redis.get(otpKey);
  if (!payloadRaw) {
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, OTP_TTL_SECONDS);
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
  }

  let payload: { hashedOtp: string; createdAt: number };
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    await redis.del(otpKey);
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
  }

  const valid = await bcrypt.compare(input.otp, payload.hashedOtp);
  if (!valid) {
    // increment attempts
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, OTP_TTL_SECONDS);
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  }

  // OTP valid → make reset token and delete otp
  await redis.del(otpKey);
  await redis.del(attemptsKey);

  const resetToken = crypto.randomBytes(36).toString("hex");
  const resetKey = `pwd_reset:${resetToken}`;
  // store user id to reset later
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

  await redis.setEx(
    resetKey,
    RESET_TOKEN_TTL_SECONDS,
    JSON.stringify({ userId: user.id })
  );

  return { resetToken, expiresIn: RESET_TOKEN_TTL_SECONDS };
};

// step 3: reset password using reset token
const resetPassword = async (input: ResetPasswordInput) => {
  const redis = await getRedis();

  const token = input.token;
  const resetKey = `pwd_reset:${token}`;
  const payloadRaw = await redis.get(resetKey);
  if (!payloadRaw) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired reset token"
    );
  }

  let payload: { userId: string };
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    await redis.del(resetKey);
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired reset token"
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

  // Hash new password
  const hashed = await bcrypt.hash(
    input.newPassword,
    Number(envVars.BCRYPT_SALT_ROUND as string)
  );

  // Update in DB atomically, remove tokens
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, updatedAt: new Date() },
    }),
    // optionally: log password reset in a table if you have one
  ]);

  // delete token(s)
  await redis.del(resetKey);

  // Send confirmation email
  // const html = `<p>Your password has been successfully reset. If you did not perform this action, contact support immediately.</p>`;
  try {
    // Attempt to send with sendEmail wrapper, fallback handled by wrapper
    await sendEmail({
      to: user.email,
      subject: "Your password was changed",
      templateName: "reset-success",
      templateData: {},
    });
  } catch {
    console.log("failed to send error");

    // swallow email error
  }

  return { ok: true };
};

// Chnage password for logged in user
const changePassword = async (
  userId: string,
  payload: {
    oldPassword: string;
    newPassword: string;
  }
) => {
  const { oldPassword, newPassword } = payload;

  // 1. Fetch user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2. Verify old password
  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordCorrect) {
    throw new customError(
      StatusCodes.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }

  // 3. Prevent reusing same password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from current password"
    );
  }

  // 4. Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND as string)
  );

  // 5. Update password
  const updatedUserPass = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });

  if (!updatedUserPass.password) {
    throw new customError(StatusCodes.BAD_GATEWAY, "New password not set");
  }
  return updatedUserPass;
};

export const authService = {
  login,
  resetPassword,
  verifyOtp,
  forgotPassword,
  refreshToken,
  changePassword,
};
