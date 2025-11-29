/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from "dotenv";

dotenv.config();

interface IEnvVars {
  PORT: string;
  NODE_ENV: "Development" | "Production";
  DATABASE_URL: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_ACCESS_SECRET: string;
  BCRYPT_SALT_ROUND: string;
  SUPER_ADMIN_PASSWORD: string;
  SUPER_ADMIN_EMAIL: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES: string;
  FRONEND_URL: string;
  EXPRESS_SESSION_SECRET: string;
  SMTP: {
    SMTP_HOST: string;
    SMTP_FROM: string;
    SMTP_PASS: string;
    SMTP_USER: string;
    SMTP_PORT: string;
  };
  SSL: {
    SSL_VALIDATION_API: string;
    SSL_PAYMENT_API: string;
    SSL_SECRET_KEY: string;
    SSL_STORE_ID: string;
    SSL_SUCCESS_BACKEND_URL: string;
    SSL_FAIL_BACKEND_URL: string;
    SSL_CANCEL_BACKEND_URL: string;
    SSL_SUCCESS_FRONTEND_URL: string;
    SSL_FAIL_FRONTEND_URL: string;
    SSL_CANCEL_FRONTEND_URL: string;
    SSL_IPN_URL: string;
  };
  CLOUDINARY: {
    CLOUDINARY_URL: string;
    CLOUDINARY_API_SECRET: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_NAME: string;
  };
  REDIS: {
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;
  };
}

const loadEnvVariables = (): IEnvVars => {
  const requiredEnv: string[] = [
    "DATABASE_URL",
    "PORT",
    "NODE_ENV",
    "JWT_ACCESS_EXPIRES",
    "JWT_ACCESS_SECRET",
    "BCRYPT_SALT_ROUND",
    "SUPER_ADMIN_PASSWORD",
    "SUPER_ADMIN_EMAIL",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES",
    "EXPRESS_SESSION_SECRET",
    "FRONEND_URL",
    "SSL_VALIDATION_API",
    "SSL_PAYMENT_API",
    "SSL_SECRET_KEY",
    "SSL_STORE_ID",
    "SSL_SUCCESS_BACKEND_URL",
    "SSL_CANCEL_BACKEND_URL",
    "SSL_FAIL_BACKEND_URL",
    "SSL_CANCEL_FRONTEND_URL",
    "SSL_FAIL_FRONTEND_URL",
    "SSL_SUCCESS_FRONTEND_URL",
    "CLOUDINARY_URL",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_NAME",
    "SMTP_HOST",
    "SMTP_FROM",
    "SMTP_PASS",
    "SMTP_PORT",
    "SMTP_USER",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_USERNAME",
    "REDIS_PASSWORD",
    "SSL_IPN_URL",
  ];

  requiredEnv.forEach((env) => {
    if (!process.env[env]) {
      throw new Error(`Missing envoirnment varriabls ${env}`);
    }
  });

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as "Development" | "Production",
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONEND_URL: process.env.FRONEND_URL as string,
    SMTP: {
      SMTP_HOST: process.env.SMTP_HOST as string,
      SMTP_FROM: process.env.SMTP_FROM as string,
      SMTP_PASS: process.env.SMTP_PASS as string,
      SMTP_USER: process.env.SMTP_USER as string,
      SMTP_PORT: process.env.SMTP_PORT as string,
    },
    SSL: {
      SSL_VALIDATION_API: process.env.SSL_VALIDATION_API as string,
      SSL_PAYMENT_API: process.env.SSL_PAYMENT_API as string,
      SSL_SECRET_KEY: process.env.SSL_SECRET_KEY as string,
      SSL_STORE_ID: process.env.SSL_STORE_ID as string,
      SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL as string,
      SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL as string,
      SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL as string,
      SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL as string,
      SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL as string,
      SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL as string,
      SSL_IPN_URL: process.env.SSL_IPN_URL as string,
    },
    CLOUDINARY: {
      CLOUDINARY_URL: process.env.CLOUDINARY_URL as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
    },
    REDIS: {
      REDIS_HOST: process.env.REDIS_HOST as string,
      REDIS_PORT: process.env.REDIS_PORT as string,
      REDIS_USERNAME: process.env.REDIS_USERNAME as string,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
    },
  };
};

export const envVars = loadEnvVariables();
