const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Connect to your PostgreSQL database
const pool = new Pool({
  user: "pern",
  host: "localhost",
  database: "pern_app_db",
  password: "password",
  port: 5432, // default PostgreSQL port
});

const init = async () => {
  try {
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    await pool.query(schema);
    console.log("✅ Database initialized successfully.");

    await pool.end();
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
};

init();
