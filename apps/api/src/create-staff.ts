import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { staffPasswordSchema } from "@shelfwise/contracts";
import { pool } from "./db.js";
import { runMigrations } from "./migration-service.js";

async function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("Create staff must be run in an interactive terminal.");
  }
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  let value = "";
  try {
    return await new Promise<string>((resolve, reject) => {
      const onData = (input: Buffer): void => {
        for (const char of input.toString("utf8")) {
          if (char === "\u0003") {
            reject(new Error("Staff creation cancelled."));
            return;
          }
          if (char === "\r" || char === "\n") {
            stdin.off("data", onData);
            stdout.write("\n");
            resolve(value);
            return;
          }
          if (char === "\u007f" || char === "\b") {
            value = value.slice(0, -1);
          } else if (char >= " ") {
            value += char;
          }
        }
      };
      stdin.on("data", onData);
    });
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
  }
}

async function main(): Promise<void> {
  await runMigrations();
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    const name = z.string().trim().min(1).max(150).parse(await readline.question("Staff name: "));
    const email = z.email().max(254).parse((await readline.question("Staff email: ")).trim().toLowerCase());
    readline.close();
    const password = await readHidden("Password (minimum 12 characters, maximum 72 UTF-8 bytes): ");
    staffPasswordSchema.parse(password);
    const confirmation = await readHidden("Confirm password: ");
    if (password !== confirmation) throw new Error("Passwords do not match.");

    const hash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    let role: "admin" | "librarian" = "librarian";
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(710421)");
      const count = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM staff_users");
      role = Number(count.rows[0]?.count) === 0 ? "admin" : "librarian";
      await client.query(
        "INSERT INTO staff_users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        [name, email, hash, role],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    console.info(`Created ${role} account for ${email}.`);
  } finally {
    readline.close();
    await pool.end();
  }
}

await main();
