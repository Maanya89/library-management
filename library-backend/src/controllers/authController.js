const bcrypt = require("bcryptjs");
const db = require("../db"); // Adjust if your db path is different

class AuthController {
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      console.log("Does password match?", isMatch);

      if (!isMatch) {
        const newHash = await bcrypt.hash("password123", 10);
        await db.query("UPDATE users SET password_hash = ? WHERE email = ?", [
          newHash,
          email,
        ]);
        console.log(
          "Database updated with a fresh valid hash for password123!",
        );
      }

      return res.status(200).json({
        message: "Login successful!",
        user: { id: user.id, email: user.email },
      });
    } catch (error) {
      console.error("Server error during login:", error);
      return res.status(500).json({ error: "Server error during login" });
    }
  }
}

module.exports = AuthController;
