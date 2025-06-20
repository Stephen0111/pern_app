console.log("authroute.js start");
const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const pool = require("../db");

const router = express.Router();

// Register
// --- NEW: Registration Route ---
router.post("/register", async (req, res) => {
  const { firstName, surname, email, password, phoneNumber, address } =
    req.body;

  // Basic validation (you should add more robust validation)
  if (
    !firstName ||
    !surname ||
    !email ||
    !password ||
    !phoneNumber ||
    !address
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered." }); // 409 Conflict
    }

    // 2. Hash the password
    const saltRounds = 10; // Standard salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insert new user into the database
    const newUser = await pool.query(
      `INSERT INTO users (firstname, surname, email, password, phoneNumber, address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email`, // RETURNING id, email to send back to frontend
      [firstName, surname, email, hashedPassword, phoneNumber, address]
    );

    console.log("✅ User registered successfully:", newUser.rows[0]);
    // Send back a success response (don't send the password hash back)
    res.status(201).json({
      message: "User registered successfully!",
      user: { id: newUser.rows[0].id, email: newUser.rows[0].email },
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.send("Logged in");
});

router.get("/checkauth", (req, res) => {
  if (req.isAuthenticated()) {
    // Passport.js method to check if user is authenticated
    // Send back user info (e.g., id, email) but NOT sensitive data like password hash
    res.status(200).json({
      isAuthenticated: true,
      user: { id: req.user.id, email: req.user.email },
    });
  } else {
    res
      .status(401)
      .json({ isAuthenticated: false, message: "Not authenticated" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.send("Logged out");
  });
});

module.exports = router;
console.log("authroute.js end");
