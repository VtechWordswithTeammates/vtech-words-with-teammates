import { z } from "zod";

const envSchema = z.object({
  TEAM_CODE: z.string().min(1, "TEAM_CODE is required").default("changeme"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required").default("adminpass"),
  SESSION_SECRET: z.string().min(8, "SESSION_SECRET is required").default("dev-secret-change"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite")
});

export const env = envSchema.parse({
  TEAM_CODE: process.env.TEAM_CODE,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_PROVIDER: process.env.DATABASE_PROVIDER
});
