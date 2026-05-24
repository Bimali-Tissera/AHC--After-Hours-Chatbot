# Phase 1: Foundation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Supabase database with all 5 tables (practices, chats, messages, leads, admins) and RLS policies, scaffold the Next.js App Router project, and wire up admin authentication so an admin can log in, access protected routes, and log out. No dashboard UI beyond the login page and a protected landing route.

</domain>

<decisions>
## Implementation Decisions

### Supabase setup
- Supabase project needs to be created manually in the dashboard before implementation
- Real Ekwa seed data will be provided by the user at implementation time (not placeholders)
- Seed data includes: practice name, address, phone, emergency phone, hours, insurance list, services

### Admin auth flow
- Simple centered card login page on a plain background — email, password, submit button, minimal branding
- After successful login, redirect to /admin/leads (the primary action page for practice staff)
- Sessions persist across browser closes — stay logged in until explicit logout
- No sign-up page — admin user created manually in Supabase dashboard for v1
- No password reset flow in v1

### Project structure
- Next.js project lives at the repo root (package.json, app/ at top level)
- Use src/ directory convention — app/, components/, lib/, utils/ all inside src/
- TypeScript throughout
- npm as package manager
- proxy.ts for auth guard (Next.js 16 pattern, not middleware.ts)

### RLS policy design
- admins.id = auth.users.id — admin table UUID matches Supabase Auth user UUID
- RLS policies use auth.uid() to look up admin's practice_id for row filtering
- All database writes go through service role (server-side API routes) — anonymous visitors never touch Supabase directly
- RLS enforces practice_id filtering on all admin reads — can't accidentally see another practice's data
- Widget/anonymous traffic has no direct Supabase access

### Claude's Discretion
- Migration approach (CLI migrations vs dashboard SQL — pick what's most practical)
- Seed data file format and structure
- Login page exact styling and spacing
- Error message wording on auth failures
- Supabase client initialization patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema
- `SUPABASE_SCHEMA.md` — Complete table definitions for all 5 tables (practices, chats, messages, leads, admins), column types, foreign keys, and dashboard query notes

### Project context
- `PROJECT_CONTEXT.md` — Original project brief and context
- `N8N_WORKFLOWS.md` — n8n workflow details (relevant for understanding how data flows into Supabase)

### Knowledge base
- `Dental_FAQ_Knowledge_Base_v1.docx` — FAQ content with placeholder tokens that need replacing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project

### Established Patterns
- No established patterns yet — Phase 1 sets the conventions for all subsequent phases

### Integration Points
- Supabase Auth user creation must happen in dashboard (manual step before auth works)
- admins table must be seeded with a row linking the Auth user's UUID to the Ekwa practice_id
- Future phases (2-4) depend on the schema, auth, and project scaffold created here

</code_context>

<specifics>
## Specific Ideas

- Login should redirect to /admin/leads because leads are the primary reason practice staff check the dashboard
- Session persistence matters because this is an internal tool used by the same people on the same devices daily
- Service role for all writes is a security decision that carries forward — widget never talks to Supabase directly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-19*
