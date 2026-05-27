## Stack

Beach is a Next.js monorepo (pnpm workspaces) deployed on Railway:
- `app/` — Internal dashboard (Clerk auth + Neon DB), runs at `app.beach-events.co.uk`
- `marketing/` — Public holding page + enquiry form, runs at `beach-events.co.uk`

Both apps share the same Neon database (project `young-frost-89607178`, region `aws-eu-west-2`).

## Database

This project uses **Neon Postgres** accessed via the `@neondatabase/serverless` HTTP driver. No ORM, no migration tool — raw SQL only.

Schema lives in `supabase/migrations/` (kept for historical reference, but those migrations were applied to Supabase originally and are not what the live database runs). For new schema changes:

1. Create a `.sql` file under a new `schema/` directory (or wherever you decide).
2. Apply it directly with `psql "$DATABASE_URL" -f schema/your-change.sql`.
3. Commit the SQL file so the history is in version control.

There is no `supabase db push` any more.

## Auth

Clerk handles authentication. The `allowed_users` table in Neon is still the access list — `app/app/dashboard/layout.tsx` enforces it server-side (any signed-in Clerk user not in `allowed_users` is redirected to `/login?error=not_authorised`).

To add a new user: insert into `allowed_users` (email + name). They can self-sign-up via Clerk on first sign-in; the allowlist gates them in.
