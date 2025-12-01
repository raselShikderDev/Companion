// src/config/db.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config"; 
import { envVars } from "./envVars.js";

const connectionString = envVars.DATABASE_URL || "postgresql://neondb_owner:npg_NWinazHPA6O1@ep-lucky-bar-a162j9we-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// 1. Initialize the adapter
const adapter = new PrismaPg({ connectionString });

// 2. Initialize the Prisma Client with the adapter
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}