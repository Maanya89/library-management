const db = require("../db"); // Adjust this path if your database file is in a different folder

class BookController {
  async getBooks(req, res) {
    try {
      const [rows] = await db.query("SELECT * FROM books");
      res.status(200).json(rows);
    } catch (err) {
      console.error("Error fetching books:", err);
      res.status(500).json({ error: "Database error while fetching books" });
    }
  }

  async addBook(req, res) {
    try {
      const { title, author, isbn, total_copies, available_copies } = req.body;
      const [result] = await db.query(
        "INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)",
        [title, author, isbn, total_copies || 1, available_copies || 1],
      );
      res.status(201).json({ id: result.insertId, title, author });
    } catch (err) {
      console.error("Error adding book:", err);
      res.status(500).json({ error: "Database error while adding book" });
    }
  }
}

module.exports = BookController;
