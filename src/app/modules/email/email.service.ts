/** biome-ignore-all lint/suspicious/noExplicitAny: > */
/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/style/useNodejsImportProtocol: > */
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../../configs/db.config";
import { getRedis } from "../../configs/redis.config";
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
    const redis = await getRedis()

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

  const token = crypto.randomBytes(32).toString("hex");
  const key = `${REDIS_PREFIX}${token}`;

  await redis.setEx(key, TOKEN_TTL_SECONDS, JSON.stringify({ userId }));

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
    await redis.del(key).catch(() => {});
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
    const redis = await getRedis()

  if (!token) throw new customError(StatusCodes.BAD_REQUEST, "Missing token");

  const key = `${REDIS_PREFIX}${token}`;
  const payloadRaw = await redis.get(key);
  if (!payloadRaw) throw new customError(StatusCodes.BAD_REQUEST, "Invalid or expired token");

  let payload: { userId: string };
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    await redis.del(key).catch(() => {});
    throw new customError(StatusCodes.BAD_REQUEST, "Invalid token payload");
  }

  const userId = payload.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await redis.del(key).catch(() => {});
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
  await redis.del(key).catch(() => {});

  return true;
};
