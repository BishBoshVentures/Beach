import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

/**
 * Lazy-initialized Neon SQL client. Uses HTTP fetch (works in Edge runtime,
 * Node, and Vercel serverless).
 *
 * Usage:
 *   const sql = getDb();
 *   await sql`INSERT INTO enquiry_submissions (...) VALUES (...)`;
 */
export function getDb() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _sql = neon(url);
  return _sql;
}
