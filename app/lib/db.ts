import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

/**
 * Lazy-initialized Neon SQL client. Uses HTTP fetch (works in Edge runtime,
 * Node, and Vercel serverless).
 *
 * Usage:
 *   const sql = getDb();
 *   const rows = await sql`SELECT * FROM allowed_users WHERE email = ${email}`;
 */
export function getDb() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _sql = neon(url);
  return _sql;
}
