const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const path = require("path");
const fs = require("fs"); // Used for console.log, can be removed if not needed

// For PostgreSQL session store
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

const authRoutes = require("./routes/authroute.js");
console.log("authRoutes:", authRoutes); // For debugging purposes
const initializePassport = require("./auth/passportauth");

// --- IMPORTANT: Initialize 'app' and 'PORT' first ---
const app = express();
const PORT = process.env.PORT || 5000; // Use Render's PORT, fallback to 5000 for local development

// --- Database Pool for pgSession ---
// This pool will be used by connect-pg-simple for session storage
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Required for Render's PostgreSQL when connecting from Node.js
    rejectUnauthorized: false,
  },
});

// Middleware (These MUST come after 'const app = express();')

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Dynamic origin for Render frontend or local dev
    credentials: true, // Crucial for sending session cookies across domains
  })
);

app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// --- Consolidated Session Middleware with connect-pg-simple ---
app.use(
  session({
    store: new pgSession({
      pool: pgPool, // Use the pgPool for session storage
      tableName: "user_sessions", // Optional, defaults to "session"
      // createTableIfMissing: true // Add this if you want connect-pg-simple to create the table
    }),
    secret: process.env.SESSION_SECRET || "super_secret_dev_key", // Use a robust, random string (env var in production)
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site cookies in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
    },
  })
);

// Passport.js Middleware (Must come AFTER session middleware)
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport); // Initialize your Passport strategies

// --- Ensure frontend serving lines are ABSENT (as discussed) ---
// These lines are for local development with a single server, not separate Render services.
// app.use(express.static(path.join(__dirname, "../client/dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/dist/index.html"));
// });

// Routes (These MUST come after all authentication middleware)
console.log("authroute.js exists?", fs.existsSync("./routes/authroute.js")); // For debugging purposes
console.log("Type of authRoutes before app.use:", typeof authRoutes); // For debugging purposes
app.use("/api", authRoutes); // Mount your authentication routes under /api

// Start the server
app.listen(
  PORT,
  () => console.log(`Server running on http://localhost:${PORT}`) // Will show the dynamic port on Render logs
);
