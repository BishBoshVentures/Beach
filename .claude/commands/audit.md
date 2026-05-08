Act as a senior engineer doing a production-readiness review of this codebase.

Walk the full codebase. Check for:
- Missing error handling and unhandled async rejections
- Auth holes and session management issues
- RLS policy gaps on Supabase tables (if Supabase)
- Missing rate limiting on public endpoints
- PII in logs or error messages
- Env vars that should be secrets but are exposed
- Missing GDPR / cookie / terms pages for UK/EU users
- Broken or missing loading states
- Silent failure paths (catches that swallow errors)
- N+1 queries or obvious performance issues
- Missing input validation on forms and API routes

Produce a prioritised list:
1. Blockers (must fix before any users)
2. Should-fix (before launch)
3. Nice-to-have (post-launch)

Do not make code changes. Just the audit.
