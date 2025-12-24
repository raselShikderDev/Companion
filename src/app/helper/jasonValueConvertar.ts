/** biome-ignore-all lint/style/useImportType: > */
import { Prisma } from "@prisma/client";

export const toJsonValue = (obj: unknown): Prisma.InputJsonValue => {
  // Prisma InputJsonValue union accepts primitives, arrays, objects -> assert as any
  return obj as Prisma.InputJsonValue;
};