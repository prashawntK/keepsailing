// Prisma 7 config — connection URLs live here, not in schema.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // DATABASE_URL = pooler (port 6543) used by the runtime query engine
    // For migrations use DIRECT_URL (override DATABASE_URL at CLI level)
    url: process.env["DATABASE_URL"]!,
  },
});
