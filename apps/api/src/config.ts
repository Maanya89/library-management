import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.url().refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol)),
  REDIS_URL: z.url().refine((value) => ["redis:", "rediss:"].includes(new URL(value).protocol))
    .default("redis://127.0.0.1:6379"),
  WEB_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32),
  DB_SSL_CA: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid API environment configuration.", parsed.error.flatten().fieldErrors);
  throw new Error("API environment configuration is invalid.");
}

const originList = parsed.data.WEB_ORIGINS.split(",").map((value) => value.trim());
const origins = new Set(originList.map((value) => {
  const url = new URL(value);
  if (url.origin !== value || url.protocol !== "https:" && parsed.data.NODE_ENV === "production") {
    throw new Error("WEB_ORIGINS must contain exact origins; production origins must use HTTPS.");
  }
  return url.origin;
}));

const databaseUrl = new URL(parsed.data.DATABASE_URL);
if (parsed.data.NODE_ENV === "production") {
  const sslOverrides = ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"];
  if (sslOverrides.some((key) => databaseUrl.searchParams.has(key))) {
    throw new Error("Remove PostgreSQL TLS query parameters; production TLS is configured with verified settings.");
  }
  if (new URL(parsed.data.REDIS_URL).protocol !== "rediss:") {
    throw new Error("REDIS_URL must use TLS (rediss://) in production.");
  }
}

export const config = {
  environment: parsed.data.NODE_ENV,
  production: parsed.data.NODE_ENV === "production",
  port: parsed.data.PORT,
  databaseUrl: databaseUrl.toString(),
  redisUrl: parsed.data.REDIS_URL,
  sessionSecret: parsed.data.SESSION_SECRET,
  databaseSslCa: parsed.data.DB_SSL_CA?.trim() || undefined,
  webOrigins: origins,
};
