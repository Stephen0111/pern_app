const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("../db");

function initialize(passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // <--- THIS IS THE KEY FIX!
        passwordField: "password", // Good practice to include, though 'password' is often default
      },
      async (email, password, done) => {
        try {
          const res = await pool.query("SELECT * FROM users WHERE email = $1", [
            email,
          ]);
          const user = res.rows[0];

          if (!user) return done(null, false, { message: "No user found" });

          // IMPORTANT: Ensure 'user.password' here matches the column where the HASHED password is stored in your DB
          const match = await bcrypt.compare(password, user.password);
          if (!match) return done(null, false, { message: "Wrong password" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      const user = res.rows[0]; // Make sure you always get user if exists
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
