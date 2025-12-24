/** biome-ignore-all lint/style/useNodejsImportProtocol: > */

import { defineConfig, env } from "prisma/config";
import "dotenv/config";
import path from "path";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
