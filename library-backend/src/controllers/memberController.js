const db = require("../db");

class MemberController {
  async getMembers(req, res) {
    try {
      // Fallback if members table doesn't exist yet
      const [rows] = await db.query("SELECT * FROM members").catch(() => [[]]);
      res.status(200).json(rows);
    } catch (err) {
      res.status(200).json([]); // Return empty array so dashboard doesn't break
    }
  }
}

module.exports = MemberController;
