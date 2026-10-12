import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import type { StaffUser } from "@shelfwise/contracts";
import { csrfForSession } from "./csrf.js";
import { pool } from "./db.js";
import { HttpError } from "./http.js";

const SESSION_COOKIE = "__Host-shelfwise-session";
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(24).toString("hex"), 12);

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function readSessionCookie(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const pair = header.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = pair?.slice(SESSION_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : undefined;
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = readSessionCookie(req.headers.cookie);
    if (!token) {
      next(new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue."));
      return;
    }
    const result = await pool.query<{
      id: string;
      name: string;
      email: string;
      role: StaffUser["role"];
    }>(
      `SELECT u.id, u.name, u.email, u.role
       FROM staff_sessions s JOIN staff_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [digest(token)],
    );
    const row = result.rows[0];
    if (!row) {
      next(new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue."));
      return;
    }
    req.auth = { user: row, sessionToken: token };
    next();
  } catch (error) {
    next(error);
  }
};

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await pool.query(
    `INSERT INTO staff_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, digest(token), new Date(Date.now() + SESSION_LIFETIME_MS)],
  );
  return token;
}

export async function revokeSession(token: string): Promise<void> {
  await pool.query("DELETE FROM staff_sessions WHERE token_hash = $1", [digest(token)]);
}

export function setSessionCookie(res: import("express").Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_LIFETIME_MS,
  });
}

export function clearSessionCookie(res: import("express").Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
}

export async function verifyPassword(
  supplied: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  const comparisonHash = passwordHash ?? DUMMY_PASSWORD_HASH;
  const matches = await bcrypt.compare(supplied, comparisonHash);
  return Boolean(passwordHash && matches);
}
