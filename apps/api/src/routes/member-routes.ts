import { Router } from "express";
import { createMemberSchema } from "@shelfwise/contracts";
import { pool } from "../db.js";
import { asyncRoute, requireCsrf, validateBody } from "../http.js";
import { authenticate } from "../auth.js";

export const memberRoutes = Router();
memberRoutes.use(authenticate);

memberRoutes.get("/", asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT m.id, m.name, m.email, m.status, m.joined_at,
            COUNT(l.id) FILTER (WHERE l.returned_on IS NULL) AS books_out
     FROM members m LEFT JOIN loans l ON l.member_id = m.id
     GROUP BY m.id ORDER BY m.name`,
  );
  res.json(result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    joinedAt: new Date(row.joined_at).toISOString(),
    booksOut: Number(row.books_out),
  })));
}));

memberRoutes.post("/", requireCsrf, asyncRoute(async (req, res) => {
  const input = validateBody(createMemberSchema, req.body);
  const result = await pool.query(
    `INSERT INTO members (name, email) VALUES ($1, $2)
     RETURNING id, name, email, status, joined_at`,
    [input.name, input.email.toLowerCase()],
  );
  const member = result.rows[0]!;
  res.status(201).json({
    id: member.id, name: member.name, email: member.email, status: member.status,
    joinedAt: new Date(member.joined_at).toISOString(), booksOut: 0,
  });
}));
