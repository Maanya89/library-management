import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

async function migrate(): Promise<void> {
  const sql = await readFile(new URL("./migrations/001-initial.sql", import.meta.url), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.info("Database migrations are up to date.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

await migrate();
