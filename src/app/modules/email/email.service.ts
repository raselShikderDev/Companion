import redisClient from "../../configs/redis"; // your redis client instance
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../../configs/db.config";

const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Configure nodemailer securely (SMTP via env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendConfirmationEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const token = crypto.randomBytes(32).toString("hex");
  const key = `email_confirm:${token}`;

  await redisClient.setEx(key, TOKEN_TTL_SECONDS, JSON.stringify({ userId }));

  const confirmUrl = `${process.env.APP_URL}/api/email/confirm?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Confirm your email",
    text: `Please confirm your account by clicking ${confirmUrl}`,
    html: `<p>Please confirm your account by clicking <a href="${confirmUrl}">Confirm email</a></p>`,
  });

  return { token, expiresIn: TOKEN_TTL_SECONDS };
};

export const confirmEmail = async (token: string) => {
  const key = `email_confirm:${token}`;
  const payloadRaw = await redisClient.get(key);
  if (!payloadRaw) throw new Error("Invalid or expired token");
  const payload = JSON.parse(payloadRaw) as { userId: string };

  // update user
  await prisma.user.update({ where: { id: payload.userId }, data: { emailConfirmed: true } });

  // remove token
  await redisClient.del(key);

  return true;
};
