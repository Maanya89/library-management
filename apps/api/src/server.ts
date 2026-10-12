import { createApp, redis } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { runMigrations } from "./migration-service.js";

async function start(): Promise<void> {
  await pool.query("SELECT 1");
  await redis.ping();
  await runMigrations();
  const cleanup = setInterval(() => {
    void pool.query("DELETE FROM staff_sessions WHERE expires_at < NOW()")
      .catch((error: unknown) => console.error("Expired session cleanup failed.", error));
  }, 60 * 60 * 1000);
  cleanup.unref();

  const app = createApp();
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.info(JSON.stringify({ event: "api_listening", port: config.port }));
  });

  const shutdown = (signal: string): void => {
    console.info(JSON.stringify({ event: "shutdown", signal }));
    server.close((error) => {
      void Promise.all([pool.end(), redis.quit()]).then(() => {
        if (error) {
          console.error("Server shutdown failed.", error);
          process.exitCode = 1;
        }
      });
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error: unknown) => {
  console.error("API startup failed.", error);
  process.exitCode = 1;
});
