import { Router } from "express";
import { createBookSchema } from "@shelfwise/contracts";
import { pool } from "../db.js";
import { asyncRoute, HttpError, requireCsrf, validateBody, validateUuid } from "../http.js";
import { authenticate } from "../auth.js";

export const bookRoutes = Router();
bookRoutes.use(authenticate);

bookRoutes.get("/", asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT b.id, b.title, b.author, b.genre, b.isbn, b.copies,
            b.copies - COUNT(l.id) FILTER (WHERE l.returned_on IS NULL) AS available_copies,
            b.created_at
     FROM books b LEFT JOIN loans l ON l.book_id = b.id
     GROUP BY b.id ORDER BY b.title`,
  );
  res.json(result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    isbn: row.isbn,
    copies: Number(row.copies),
    availableCopies: Number(row.available_copies),
    createdAt: new Date(row.created_at).toISOString(),
  })));
}));

bookRoutes.post("/", requireCsrf, asyncRoute(async (req, res) => {
  const input = validateBody(createBookSchema, req.body);
  const result = await pool.query(
    `INSERT INTO books (title, author, genre, isbn, copies)
     VALUES ($1, $2, $3, NULLIF($4, ''), $5)
     RETURNING id, title, author, genre, isbn, copies, created_at`,
    [input.title, input.author, input.genre, input.isbn ?? "", input.copies],
  );
  const book = result.rows[0]!;
  res.status(201).json({
    id: book.id, title: book.title, author: book.author, genre: book.genre,
    isbn: book.isbn, copies: Number(book.copies), availableCopies: Number(book.copies),
    createdAt: new Date(book.created_at).toISOString(),
  });
}));

bookRoutes.delete("/:id", requireCsrf, asyncRoute(async (req, res) => {
  const id = validateUuid(req.params.id!);
  const result = await pool.query(
    "DELETE FROM books WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM loans WHERE book_id = $1)",
    [id],
  );
  if (result.rowCount === 0) {
    const exists = await pool.query("SELECT 1 FROM books WHERE id = $1", [id]);
    if (exists.rowCount === 0) throw new HttpError(404, "BOOK_NOT_FOUND", "Book not found.");
    throw new HttpError(409, "BOOK_HAS_LOANS", "Books with loan history cannot be deleted.");
  }
  res.status(204).end();
}));
