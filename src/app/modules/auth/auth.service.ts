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
import { redisClient } from "../../configs/redis.config";
import { ForgotPasswordInput, ResetPasswordInput, VerifyOtpInput } from "./auth.interface";
import { generateOtp } from "../../helper/generateOtp";
import { envVars } from "../../configs/envVars";
import { sendEmail } from "../../helper/sendEmail";
import { maskEmail } from "../../helper/muskEmail";
import { generateJwtToken, verifyJwtToken } from "../../helper/jwtHelper";
import { JwtPayload } from "jsonwebtoken";


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
    let decodedData:JwtPayload | null;
    try {
        decodedData = await verifyJwtToken(token, envVars.JWT_REFRESH_SECRET as string) as JwtPayload;

    }
    catch (err) {
      console.log(err);
      
        throw new Error("You are not authorized!")
    }

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData?.email,
            status: UserStatus.ACTIVE
        }
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
const FORGOT_RATE_LIMIT = 3; // max forgot requests per hour



 // step 1: initiate forgot password (generate OTP and email it)
const forgotPassword = async (input: ForgotPasswordInput) => {
    const email = input.email.toLowerCase();

    // rate-limit: how many forgot requests in last hour
    const rateKey = `pwd_flood:${email}`;
    const floods = Number((await redisClient.get(rateKey)) ?? 0);
    if (floods >= FORGOT_RATE_LIMIT) {
      throw new customError(StatusCodes.TOO_MANY_REQUESTS, "Too many requests. Try again later.");
    }

    // find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists: act as if it was sent
      await redisClient.incr(rateKey);
      await redisClient.expire(rateKey, 60 * 60);
      return { ok: true, message: "If the email exists, an OTP has been sent." };
    }

    // produce OTP and store hashed in Redis
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpKey = `pwd_otp:${email}`;
    await redisClient.setEx(otpKey, OTP_TTL_SECONDS, JSON.stringify({ hashedOtp, createdAt: Date.now() }));

    // reset attempts counter
    const attemptsKey = `pwd_otp_attempts:${email}`;
    await redisClient.del(attemptsKey);

    // record flood counter
    await redisClient.incr(rateKey);
    await redisClient.expire(rateKey, 60 * 60); // 1 hour

    // Send email with OTP (secure: don't include extra info)
    // const resetVerifyUrl = `${envVars.FRONEND_URL}/auth/verify-otp`; // frontend route if you have one


    await sendEmail({
            to: email,
            subject: "Reset Password OTP",
            templateName: "forgotPassword",
            templateData: { otp }
        });

    return { ok: true, message: `OTP sent to ${maskEmail(user.email)}` };
  }


  // step 2: verify OTP (returns a single-use reset token if success)
  const verifyOtp = async (input: VerifyOtpInput) => {
    const email = input.email.toLowerCase();
    const otpKey = `pwd_otp:${email}`;
    const attemptsKey = `pwd_otp_attempts:${email}`;

    // check attempts
    const attempts = Number((await redisClient.get(attemptsKey)) ?? 0);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new customError(StatusCodes.TOO_MANY_REQUESTS, "Too many attempts. Request a new OTP.");
    }

    const payloadRaw = await redisClient.get(otpKey);
    if (!payloadRaw) {
      await redisClient.incr(attemptsKey);
      await redisClient.expire(attemptsKey, OTP_TTL_SECONDS);
      throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
    }

    let payload: { hashedOtp: string; createdAt: number };
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      await redisClient.del(otpKey);
      throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
    }

    const valid = await bcrypt.compare(input.otp, payload.hashedOtp);
    if (!valid) {
      // increment attempts
      await redisClient.incr(attemptsKey);
      await redisClient.expire(attemptsKey, OTP_TTL_SECONDS);
      throw new customError(StatusCodes.BAD_REQUEST, "Invalid OTP");
    }

    // OTP valid → make reset token and delete otp
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);

    const resetToken = crypto.randomBytes(36).toString("hex");
    const resetKey = `pwd_reset:${resetToken}`;
    // store user id to reset later
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

    await redisClient.setEx(resetKey, RESET_TOKEN_TTL_SECONDS, JSON.stringify({ userId: user.id }));
    

    return { ok: true, resetToken, expiresIn: RESET_TOKEN_TTL_SECONDS };
  }

  // step 3: reset password using reset token
 const resetPassword = async (input: ResetPasswordInput) => {
    const token = input.token;
    const resetKey = `pwd_reset:${token}`;
    const payloadRaw = await redisClient.get(resetKey);
    if (!payloadRaw) {
      throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token");
    }

    let payload: { userId: string };
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      await redisClient.del(resetKey);
      throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

    // Hash new password
    const saltRounds = Number(process.env.BCRYPT_SALT || 10);
    const hashed = await bcrypt.hash(input.newPassword, saltRounds);

    // Update in DB atomically, remove tokens
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashed, updatedAt: new Date() } }),
      // optionally: log password reset in a table if you have one
    ]);

    // delete token(s)
    await redisClient.del(resetKey);

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
      // swallow email error
    }

    return { ok: true };
  }




export const authService = {
  login,
  resetPassword,
  verifyOtp,
  forgotPassword,
  refreshToken
};
