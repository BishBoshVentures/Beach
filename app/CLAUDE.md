## App workspace

Internal Beach dashboard. Auth via Clerk, data via Neon (`@neondatabase/serverless`).

See the root `CLAUDE.md` for the database + auth overview that applies to both workspaces.

## Local development

```bash
cp .env.local.example .env.local
# Fill in DATABASE_URL, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
pnpm install
pnpm dev
```

## Key files

- `middleware.ts` — Clerk middleware; `/login*` and `/api/webhook*` are public, everything else requires a session
- `app/login/page.tsx` — Single-page login that handles both email entry and OTP verification using Clerk's `useSignIn` / `useSignUp` hooks. Falls back to sign-up if Clerk doesn't know the email yet (the `allowed_users` table is the real gate)
- `app/dashboard/layout.tsx` — Looks up the signed-in user's email in `allowed_users`; if absent, redirects to `/login?error=not_authorised`
- `lib/db.ts` — Lazy-initialised Neon HTTP client; `getDb()` returns the tagged-template SQL function
