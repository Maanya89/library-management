const db = require("../db");

class LoanController {
  async getLoans(req, res) {
    try {
      const [rows] = await db.query("SELECT * FROM loans");
      res.status(200).json(rows);
    } catch (err) {
      console.error("Error fetching loans:", err);
      res.status(500).json({ error: "Database error while fetching loans" });
    }
  }

  // Basic stats endpoint for dashboard overview cards
  async getStats(req, res) {
    try {
      const [booksCount] = await db.query(
        "SELECT COUNT(*) as count FROM books",
      );
      const [activeLoans] = await db.query(
        "SELECT COUNT(*) as count FROM loans WHERE return_date IS NULL",
      );

      res.status(200).json({
        totalBooks: booksCount[0].count,
        activeLoans: activeLoans[0].count,
        dueToday: 0,
        overdue: 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Fallback response so dashboard doesn't completely crash if loans table isn't created yet
      res
        .status(200)
        .json({ totalBooks: 0, activeLoans: 0, dueToday: 0, overdue: 0 });
    }
  }
}

module.exports = LoanController;
