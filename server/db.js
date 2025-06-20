const { Pool } = require("pg");

let pool;

// Check if a DATABASE_URL environment variable is provided (e.g., by Render)
if (process.env.DATABASE_URL) {
  // Production environment (e.g., Render.com)
  console.log("Connecting to production database using DATABASE_URL");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      // This is crucial for connecting to Render's PostgreSQL from Node.js,
      // as Render uses self-signed certificates for internal connections.
      rejectUnauthorized: false,
    },
  });
} else {
  // Local development environment
  console.log("Connecting to local database");
  pool = new Pool({
    user: "postgres", // Your local PostgreSQL username
    host: "localhost", // Your local PostgreSQL host
    database: "pern_app_db", // Your local database name
    port: 5432, // Your local PostgreSQL port
    // No 'ssl' object here, as local PostgreSQL typically does not use SSL
  });
}

module.exports = pool;
