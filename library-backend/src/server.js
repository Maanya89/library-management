const express = require("express");
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3000;
// POST Endpoint to insert a new member into MySQL
app.post("/api/members", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  const query = `INSERT INTO members (name, email, status, created_at) VALUES (?, ?, 'Active', NOW())`;

  db.query(query, [name, email], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "A member with this email already exists." });
      }
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      status: "Active",
      message: "Member added successfully",
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
