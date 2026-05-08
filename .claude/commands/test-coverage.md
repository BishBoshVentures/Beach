Audit test coverage in this repo.

1. Identify the 10 highest-risk code paths that have no tests. Prioritise in this order:
   - Auth and session
   - Payment and billing
   - Data writes (especially destructive ones)
   - External API integrations
   - Business logic with branching

2. For the top 3 paths, write tests:
   - Vitest for unit / integration
   - Playwright for end-to-end user journeys

3. Test-driven: tests must be written to fail first, then I'll make them pass.

Output the list of 10, then start writing tests for the top 3.
