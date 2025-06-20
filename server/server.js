const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const path = require("path"); // Keep path if used for other purposes, but not for static serving now

const authRoutes = require("./routes/authroute.js");
console.log("authRoutes:", authRoutes);
const fs = require("fs");
// const postRoutes = require("./routes/postRoutes"); // Keep commented if not in use
const initializePassport = require("./auth/passportauth");

const app = express();
// --- IMPORTANT: Port Configuration for Render ---
// Use the PORT environment variable provided by Render, fallback to 5000 for local development.
const PORT = process.env.PORT || 5000;

// Middleware
// --- IMPORTANT: CORS Configuration for Render ---
// The 'origin' should be the URL of your deployed React frontend on Render.
// Use an environment variable (CLIENT_URL) which you will set on Render.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Fallback for local development
    credentials: true, // Crucial for sending session cookies
  })
);
app.use(express.json());
app.use(
  session({
    secret: "secret_key", // In production, this should be a robust, long, random string stored as an environment variable (process.env.SESSION_SECRET)
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Set to true in production (requires HTTPS)
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site cookies in production
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);

// --- IMPORTANT: Ensure these lines for serving frontend files are ABSENT ---
// As you are deploying the React frontend as a separate Static Site on Render,
// these lines should NOT be in your backend server.js.
// app.use(express.static(path.join(__dirname, "../client/dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/dist/index.html"));
// });
// Based on your last provided server.js, these lines are already commented out/removed, which is correct.

// Routes
console.log("authroute.js exists?", fs.existsSync("./routes/authroute.js"));
console.log("Type of authRoutes before app.use:", typeof authRoutes);
app.use("/api", authRoutes); // Your backend API routes
// app.use("/api", productroutes); // Keep commented if not in use

app.listen(
  PORT,
  () => console.log(`Server running on http://localhost:${PORT}`) // This will show the dynamic port on Render logs
);
