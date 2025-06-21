CREATE TABLE users (
  id SERIAL PRIMARY KEY,
 firstname VARCHAR(255)  NOT NULL,
 Surname VARCHAR(255)  NOT NULL,
  phoneNumber VARCHAR(255)  NOT NULL,
  address VARCHAR(255)  NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");