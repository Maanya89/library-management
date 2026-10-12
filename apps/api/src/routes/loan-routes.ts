import { Router } from "express";
import { createLoanSchema } from "@shelfwise/contracts";
import { pool } from "../db.js";
import { asyncRoute, HttpError, requireCsrf, validateBody, validateUuid } from "../http.js";
import { authenticate } from "../auth.js";

export const loanRoutes = Router();
loanRoutes.use(authenticate);

loanRoutes.get("/", asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT l.id, l.book_id, l.member_id, b.title AS book_title, b.author AS book_author,
            m.name AS member_name, l.checked_out, l.due_date, l.returned_on
     FROM loans l JOIN books b ON b.id = l.book_id JOIN members m ON m.id = l.member_id
     ORDER BY l.checked_out DESC`,
  );
  res.json(result.rows.map((row) => ({
    id: row.id, bookId: row.book_id, memberId: row.member_id,
    bookTitle: row.book_title, bookAuthor: row.book_author, memberName: row.member_name,
    checkedOut: new Date(row.checked_out).toISOString(),
    dueDate: new Date(row.due_date).toISOString().slice(0, 10),
    returnedOn: row.returned_on ? new Date(row.returned_on).toISOString() : null,
    status: row.returned_on ? "returned" : "active",
  })));
}));

loanRoutes.post("/", requireCsrf, asyncRoute(async (req, res) => {
  const input = validateBody(createLoanSchema, req.body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const book = await client.query<{ copies: number }>(
      "SELECT copies FROM books WHERE id = $1 FOR UPDATE",
      [input.bookId],
    );
    if (!book.rows[0]) throw new HttpError(404, "BOOK_NOT_FOUND", "Book not found.");
    const member = await client.query<{ status: string }>(
      "SELECT status FROM members WHERE id = $1 FOR UPDATE",
      [input.memberId],
    );
    if (!member.rows[0]) throw new HttpError(404, "MEMBER_NOT_FOUND", "Member not found.");
    if (member.rows[0].status !== "active") {
      throw new HttpError(409, "MEMBER_INACTIVE", "Inactive members cannot borrow books.");
    }
    if (input.dueDate < new Date().toISOString().slice(0, 10)) {
      throw new HttpError(400, "DUE_DATE_IN_PAST", "The due date cannot be in the past.");
    }
    const active = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM loans WHERE book_id = $1 AND returned_on IS NULL",
      [input.bookId],
    );
    if (Number(active.rows[0]?.count) >= book.rows[0].copies) {
      throw new HttpError(409, "BOOK_UNAVAILABLE", "No copies of this book are currently available.");
    }
    const result = await client.query(
      `INSERT INTO loans (book_id, member_id, issued_by, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, book_id, member_id, checked_out, due_date`,
      [input.bookId, input.memberId, req.auth!.user.id, input.dueDate],
    );
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

loanRoutes.patch("/:id/return", requireCsrf, asyncRoute(async (req, res) => {
  const id = validateUuid(req.params.id!);
  const result = await pool.query(
    `UPDATE loans SET returned_on = NOW()
     WHERE id = $1 AND returned_on IS NULL
     RETURNING id`,
    [id],
  );
  if (!result.rowCount) throw new HttpError(404, "ACTIVE_LOAN_NOT_FOUND", "Active loan not found.");
  res.status(204).end();
}));
