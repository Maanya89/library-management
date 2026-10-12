import pg from "pg";
import { config } from "./config.js";

const ssl = config.production
  ? {
      rejectUnauthorized: true,
      ...(config.databaseSslCa ? { ca: config.databaseSslCa } : {}),
    }
  : undefined;

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
  application_name: "shelfwise-api",
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error.", error);
});
