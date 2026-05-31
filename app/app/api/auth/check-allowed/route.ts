import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Pre-flight check called by /login before triggering a Clerk OTP. Avoids
 * sending verification emails to addresses that aren't on the access list —
 * which would let any visitor receive a 6-digit code from Clerk and gives
 * misleading "check your email" feedback to people who'd be blocked at the
 * dashboard anyway.
 *
 * Returns { allowed: boolean }. We deliberately don't 404 — we always 200
 * so the client can branch on the boolean without dealing with HTTP error
 * states. We also don't return anything about *why* (e.g. "no such row" vs
 * "service unavailable") so a misbehaving DB doesn't leak failure modes.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    const sql = getDb();
    const rows = (await sql`
      SELECT 1 FROM allowed_users WHERE lower(email) = ${email} LIMIT 1
    `) as { "?column?": number }[];

    return NextResponse.json({ allowed: rows.length > 0 });
  } catch (err) {
    const e = err as { message?: string; code?: string };
    console.error("check_allowed_error", { code: e?.code, message: e?.message });
    // Fail closed: if we can't check the list, deny rather than risk sending
    // a code to someone we shouldn't.
    return NextResponse.json({ allowed: false }, { status: 200 });
  }
}
