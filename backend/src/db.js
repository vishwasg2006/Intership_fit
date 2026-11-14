import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
// Always load backend/.env, no matter which folder the command is run from.
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
// Return DATE columns as plain "YYYY-MM-DD" strings (not JS Date objects, which String() turns into "Fri Nov 20").
pg.types.setTypeParser(1082, (v) => v);
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// An idle-client error (e.g. Postgres restarts) must not crash the API.
pool.on("error", (e) => console.error("Postgres pool error:", e.message));
