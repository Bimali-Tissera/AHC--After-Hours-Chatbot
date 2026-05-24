---
phase: 01-foundation
plan: 01
subsystem: database
tags: [supabase, postgres, rls, sql, row-level-security]

# Dependency graph
requires: []
provides:
  - supabase/schema.sql — DDL for 5 tables (practices, chats, messages, leads, admins) with RLS enabled and 5 SELECT-only policies
  - supabase/seed.sql — Ekwa practice INSERT template and admin row INSERT template with placeholder tokens
affects:
  - 01-02 (Next.js scaffold needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase project)
  - 01-03 (Auth flow depends on admins table and Supabase Auth user being linked via admins.id)
  - All subsequent phases (schema defines the data model for dashboard, widget, n8n writes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS pattern: auth.uid() wrapped in (SELECT auth.uid()) for per-statement caching"
    - "RLS pattern: TO authenticated on all policies to prevent anon role execution"
    - "RLS pattern: practice_id subquery — every table filters through admins.practice_id lookup"
    - "admins.id = auth.users.id — no DEFAULT on admins.id; must be set manually to match Supabase Auth UUID"

key-files:
  created:
    - supabase/schema.sql
    - supabase/seed.sql
  modified: []

key-decisions:
  - "Dashboard SQL editor over Supabase CLI — no Docker dependency, simpler greenfield setup"
  - "SELECT wrapper on auth.uid() in all RLS policies for performance (cached per-statement, not per-row)"
  - "No INSERT/UPDATE/DELETE RLS policies needed — all writes go through service role on server-side"
  - "seed.sql uses placeholder tokens for address/phone — must be replaced with real Ekwa data before running"

patterns-established:
  - "Pattern: RLS multi-tenant practice_id filtering via admins subquery — applied to all 5 tables"
  - "Pattern: SQL files in supabase/ directory, run via Supabase dashboard SQL editor"

requirements-completed: [DB-01, DB-02, DB-03]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 1 Plan 01: Database Schema Summary

**PostgreSQL schema for 5-table multi-tenant dental chatbot DB with practice_id RLS policies and Ekwa seed data template**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-18T22:29:55Z
- **Completed:** 2026-03-18T22:34:00Z
- **Tasks:** 3 of 3 complete
- **Files modified:** 2

## Accomplishments
- Complete DDL schema for all 5 tables matching SUPABASE_SCHEMA.md canonical definitions
- RLS enabled on all 5 tables with SELECT-only policies filtering by practice_id through admins subquery
- Seed data SQL template with placeholder tokens and step-by-step comments for the manual Supabase setup process

## Task Commits

Each task was committed atomically:

1. **Task 1: Create complete schema SQL with RLS policies** - `0962e51` (feat)
2. **Task 2: Create seed data SQL template** - `5107822` (feat)
3. **Task 3: User creates Supabase project and runs SQL** - completed (user provided credentials)

**Plan metadata:** (added after state update)

## Files Created/Modified
- `supabase/schema.sql` — Full DDL: 5 CREATE TABLE, 5 ENABLE ROW LEVEL SECURITY, 5 CREATE POLICY statements with practice_id filtering
- `supabase/seed.sql` — Ekwa practice INSERT template (with [PRACTICE ADDRESS], [MAIN PHONE NUMBER], [EMERGENCY PHONE NUMBER] placeholders) and admins INSERT template

## Decisions Made
- Used dashboard SQL editor instead of Supabase CLI migrations (no Docker dependency needed for v1 greenfield)
- auth.uid() wrapped in (SELECT auth.uid()) in every policy — caches the value per statement, not per row
- No INSERT/UPDATE/DELETE RLS policies — all writes go through server-side service role which bypasses RLS by design

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Task 3 is a blocking human-action checkpoint. The user must:

1. Create a Supabase project at https://supabase.com/dashboard
2. Open SQL Editor in the Supabase dashboard
3. Paste and run `supabase/schema.sql` — should complete without errors
4. Replace placeholder tokens in `supabase/seed.sql` with real Ekwa data (address, phone numbers)
5. Paste and run the practices INSERT from `supabase/seed.sql` — note the returned UUID
6. Create an admin user in Authentication > Users (email + password)
7. Copy the auth user UUID and the practice UUID into the admins INSERT
8. Run the admins INSERT
9. Copy Supabase project URL and anon key from Settings > API for `.env.local`

**Verification queries to run in Supabase SQL Editor:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: practices, chats, messages, leads, admins

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Expected: all 5 show rowsecurity = true

-- Check seed data
SELECT * FROM practices;
-- Expected: 1 row with real Ekwa data
```

**Resume signal:** Type "supabase ready" with the project URL and anon key.

## Next Phase Readiness

- `supabase/schema.sql` and `supabase/seed.sql` are ready to run
- Next phase (01-02) requires Supabase project URL and anon key from this setup
- Once user completes Task 3 and provides credentials, Phase 1 Plan 02 (Next.js scaffold) can proceed

## Self-Check: PASSED

- supabase/schema.sql: FOUND
- supabase/seed.sql: FOUND
- .planning/phases/01-foundation/01-01-SUMMARY.md: FOUND
- Commit 0962e51 (schema.sql): FOUND
- Commit 5107822 (seed.sql): FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-19*
