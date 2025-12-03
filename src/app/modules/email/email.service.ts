import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../../configs/db.config";
import { redisClient } from "../../configs/redis.config";
import { envVars } from "../../configs/envVars";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";

const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const REDIS_PREFIX = "email_confirm:";

// Create transporter using env vars and choose secure automatically based on port
const smtpPort = Number(envVars.SMTP.SMTP_PORT || 587);
const transporter = nodemailer.createTransport({
  host: envVars.SMTP.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // if using 465 use secure true, otherwise false (STARTTLS)
  auth: {
    user: envVars.SMTP.SMTP_USER,
    pass: envVars.SMTP.SMTP_PASS,
  },
});

/**
 * Send confirmation email:
 * - generates token, saves to redis with TTL
 * - sends email containing confirmation URL
 */
export const sendConfirmationEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

  const token = crypto.randomBytes(32).toString("hex");
  const key = `${REDIS_PREFIX}${token}`;

  await redisClient.setEx(key, TOKEN_TTL_SECONDS, JSON.stringify({ userId }));

  const confirmUrl = `${envVars.FRONEND_URL.replace(/\/$/, "")}/api/email/confirm?token=${token}`;

  const mailOptions = {
    from: envVars.SMTP.SMTP_FROM,
    to: user.email,
    subject: "Confirm your email",
    text: `Please confirm your account by clicking the following link: ${confirmUrl}`,
    html: `<p>Please confirm your account by clicking <a href="${confirmUrl}">Confirm email</a></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (envVars.NODE_ENV === "Development") {
      console.log(`✉️ Email sent to ${user.email}: ${info.messageId}`);
    }
    return { token, expiresIn: TOKEN_TTL_SECONDS };
  } catch (err) {
    if (envVars.NODE_ENV === "Development") console.error("sendConfirmationEmail error:", err);
    // cleanup token if email fails
    await redisClient.del(key).catch(() => {});
    throw new customError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send confirmation email");
  }
};

/**
 * Confirm email:
 * - reads token from redis
 * - marks user as confirmed (if your schema supports it)
 * - deletes token from redis
 *
 * NOTE: If your User model has a boolean `emailConfirmed` or `emailVerifiedAt` field, adjust the update accordingly.
 */
export const confirmEmail = async (token: string) => {
  if (!token) throw new customError(StatusCodes.BAD_REQUEST, "Missing token");

  const key = `${REDIS_PREFIX}${token}`;
  const payloadRaw = await redisClient.get(key);
  if (!payloadRaw) throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired token");

  let payload: { userId: string };
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    await redisClient.del(key).catch(() => {});
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid token payload");
  }

  const userId = payload.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await redisClient.del(key).catch(() => {});
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Try to update a common field if exists. We avoid writing a field that may not exist.
  // If your schema has `emailConfirmed` (boolean) or `emailVerifiedAt` (DateTime), change/update below accordingly.
  // Safest action: update updatedAt and (optionally) status if you want to enforce a status change.
  // If you DO have emailConfirmed, uncomment the next block and remove the safe update.

  // Example (uncomment if `emailConfirmed` exists on your User model):
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { emailConfirmed: true, updatedAt: new Date() },
  // });

  // Safe default: just touch updatedAt (non-destructive)
  await prisma.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() } as any,
  });

  // remove token
  await redisClient.del(key).catch(() => {});

  return true;
};



// import crypto from "crypto";
// import nodemailer from "nodemailer";
// import { prisma } from "../../configs/db.config";
// import { redisClient } from "../../configs/redis.config";

// const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// // Configure nodemailer securely (SMTP via env)
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT || 587),
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export const sendConfirmationEmail = async (userId: string) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   const token = crypto.randomBytes(32).toString("hex");
//   const key = `email_confirm:${token}`;

//   await redisClient.setEx(key, TOKEN_TTL_SECONDS, JSON.stringify({ userId }));

//   const confirmUrl = `${process.env.APP_URL}/api/email/confirm?token=${token}`;

//   await transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     to: user.email,
//     subject: "Confirm your email",
//     text: `Please confirm your account by clicking ${confirmUrl}`,
//     html: `<p>Please confirm your account by clicking <a href="${confirmUrl}">Confirm email</a></p>`,
//   });

//   return { token, expiresIn: TOKEN_TTL_SECONDS };
// };

// export const confirmEmail = async (token: string) => {
//   const key = `email_confirm:${token}`;
//   const payloadRaw = await redisClient.get(key);
//   if (!payloadRaw) throw new Error("Invalid or expired token");
//   const payload = JSON.parse(payloadRaw) as { userId: string };

//   // update user
//   await prisma.user.update({ where: { id: payload.userId }, data: { emailConfirmed: true } });

//   // remove token
//   await redisClient.del(key);

//   return true;
// };
