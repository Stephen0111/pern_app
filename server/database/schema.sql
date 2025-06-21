
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstname VARCHAR(255)  NOT NULL,
  surname VARCHAR(255)  NOT NULL,
  phoneNumber VARCHAR(255)  NOT NULL,
  address VARCHAR(255)  NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Renamed the session table to "user_sessions" to match server.js configuration
CREATE TABLE "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_user_sessions_expire" ON "user_sessions" ("expire");
