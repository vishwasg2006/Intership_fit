import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
// Always load backend/.env, no matter which folder the command is run from.
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
