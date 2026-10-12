import { Router } from "express";
import { loginSchema } from "@shelfwise/contracts";
import { csrfForSession } from "../csrf.js";
import { pool } from "../db.js";
import { asyncRoute, HttpError, requireCsrf, validateBody } from "../http.js";
import { authenticate, clearSessionCookie, createSession, revokeSession, setSessionCookie, verifyPassword } from "../auth.js";

export const authRoutes = Router();

authRoutes.post("/login", asyncRoute(async (req, res) => {
  const input = validateBody(loginSchema, req.body);
  const email = input.email.toLowerCase();
  const result = await pool.query<{ id: string; name: string; email: string; role: "librarian" | "admin"; password_hash: string }>(
    "SELECT id, name, email, role, password_hash FROM staff_users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  const token = await createSession(user.id);
  setSessionCookie(res, token);
  res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    csrfToken: csrfForSession(token),
  });
}));

authRoutes.get("/session", authenticate, (req, res) => {
  res.json({
    user: req.auth!.user,
    csrfToken: csrfForSession(req.auth!.sessionToken),
  });
});

authRoutes.post("/logout", authenticate, requireCsrf, asyncRoute(async (req, res) => {
  await revokeSession(req.auth!.sessionToken);
  clearSessionCookie(res);
  res.status(204).end();
}));
