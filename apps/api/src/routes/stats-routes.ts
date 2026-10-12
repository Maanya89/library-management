import { Router } from "express";
import { pool } from "../db.js";
import { asyncRoute } from "../http.js";
import { authenticate } from "../auth.js";

export const statsRoutes = Router();
statsRoutes.use(authenticate);

statsRoutes.get("/", asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM books) AS titles,
       (SELECT COALESCE(SUM(copies), 0) FROM books) AS copies,
       (SELECT COALESCE(SUM(b.copies), 0) - COUNT(l.id)
          FROM books b LEFT JOIN loans l ON l.book_id = b.id AND l.returned_on IS NULL) AS available_copies,
       (SELECT COUNT(*) FROM loans WHERE returned_on IS NULL) AS active_loans,
       (SELECT COUNT(*) FROM loans WHERE returned_on IS NULL AND due_date = CURRENT_DATE) AS due_today,
       (SELECT COUNT(*) FROM loans WHERE returned_on IS NULL AND due_date < CURRENT_DATE) AS overdue,
       (SELECT COUNT(*) FROM members WHERE status = 'active') AS active_members,
       (SELECT COUNT(*) FROM loans) AS total_loans,
       (SELECT COUNT(*) FROM loans WHERE returned_on IS NOT NULL) AS returned_loans`,
  );
  const row = result.rows[0]!;
  res.json(Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])));
}));
