---
phase: 01-foundation
plan: "02"
subsystem: project-scaffold
tags: [next.js, supabase, auth, tailwind, typescript, proxy]
dependency_graph:
  requires: []
  provides:
    - next.js-project
    - supabase-server-client
    - supabase-browser-client
    - proxy-ts-auth-guard
  affects:
    - all subsequent plans (every plan builds on top of this scaffold)
tech_stack:
  added:
    - next@16.2.0
    - "@supabase/supabase-js@2.99.2"
    - "@supabase/ssr@0.9.0"
    - tailwindcss@4.2.2
    - typescript@5.x
  patterns:
    - Next.js App Router with src/ directory convention
    - proxy.ts at repo root for session refresh and route protection
    - getClaims() for fast local JWT validation (no network round-trip)
    - createServerClient with cookie handlers for SSR auth
    - createBrowserClient for client-side auth
key_files:
  created:
    - proxy.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - package.json
    - tsconfig.json
    - .env.example
    - .env.local
    - src/app/page.tsx
    - src/app/globals.css
  modified:
    - .gitignore
decisions:
  - getClaims() used with safe null coalescing (data?.claims ?? null) to prevent destructuring errors when no session exists
  - project scaffolded via create-next-app in temp dir and copied to repo root to work around npm naming restriction on capital letters in directory name
  - .env.example force-added to git despite .env* gitignore pattern so the template is committed
metrics:
  duration: "8 minutes"
  completed: "2026-03-19"
  tasks_completed: 2
  files_created: 15
---

# Phase 1 Plan 2: Next.js Scaffold with Supabase Auth Guard Summary

**One-liner:** Next.js 16.2.0 project scaffolded at repo root with App Router, TailwindCSS v4, @supabase/ssr cookie-based auth clients, and proxy.ts route guard using getClaims() for JWT validation.

## What Was Built

### Task 1: Next.js Project Scaffold

Scaffolded a Next.js 16.2.0 project into the repo root using `create-next-app` with all required flags. Due to a npm naming restriction blocking capital letters in directory names, the project was scaffolded into a temp directory and copied to the repo root.

The generated globals.css already uses Tailwind v4 syntax (`@import "tailwindcss"`) — no migration from v3 directives was needed.

Replaced the Next.js boilerplate page.tsx with a minimal placeholder page showing "After-Hours AI Lead Assistant".

**Build verification:** `npm run build` passes with zero TypeScript errors.

### Task 2: Supabase Client Utilities and proxy.ts Auth Guard

Created three files implementing the Supabase auth pattern recommended by the research:

**`src/lib/supabase/server.ts`** — Async `createClient()` using `createServerClient` from `@supabase/ssr` with `next/headers` cookie access. The `setAll` handler wraps cookie writes in try/catch since Server Components cannot set cookies (proxy.ts handles session persistence).

**`src/lib/supabase/client.ts`** — Synchronous `createClient()` using `createBrowserClient` from `@supabase/ssr` for use in Client Components.

**`proxy.ts`** (repo root, beside `src/`) — Session refresh and route guard. Uses `getClaims()` for fast local JWT validation with safe null coalescing to handle the no-session case. Guards:
- `/admin/*` (except `/admin/login`) → redirects unauthenticated users to `/admin/login`
- `/admin/login` → redirects authenticated users to `/admin/leads`

Anti-pattern avoided: the same `supabaseResponse` object is mutated and returned — no new `NextResponse` created after the Supabase client's `setAll` has run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Safe null coalescing for getClaims() data**
- **Found during:** Task 2
- **Issue:** Plan code used `const { data: { claims } } = await supabase.auth.getClaims()` but the type signature shows `data` can be `null` when there's no session, which would throw a destructuring error at runtime
- **Fix:** Used `const { data } = await supabase.auth.getClaims()` then `const claims = data?.claims ?? null`
- **Files modified:** proxy.ts
- **Commit:** dbf714f

**2. [Rule 3 - Blocking] create-next-app npm naming restriction**
- **Found during:** Task 1
- **Issue:** `create-next-app` uses the destination directory name as the package name, but directory "After-Hours-Chatbot" contains capital letters which fail npm naming validation
- **Fix:** Scaffolded to `/tmp/after-hours-chatbot` (lowercase), then copied all files (excluding `.git`, `.next`, `node_modules`) to the repo root
- **Files modified:** All scaffold files
- **Commit:** ea384c0

## Commits Made

| Hash | Type | Description |
|------|------|-------------|
| ea384c0 | chore | Scaffold Next.js project with Supabase packages |
| a4d9186 | chore | Add .env.example with required Supabase environment variables |
| dbf714f | feat | Add Supabase client utilities and proxy.ts auth guard |

## Verification Results

- `npm run build` passes with zero TypeScript errors
- proxy.ts exists at repo root (not inside src/)
- src/lib/supabase/server.ts and client.ts exist with correct exports
- .env.example documents all required env vars without NEXT_PUBLIC_ on service role key
- Tailwind v4 syntax confirmed in globals.css

## Next Steps

This scaffold is the foundation for all subsequent plans. The next required step is the human-action checkpoint from plan 01-01 (creating the Supabase project and running the schema SQL in the dashboard). Once that's done, plan 01-03 will implement the admin authentication flow (login page, server action, admin layout guard, logout).

## Self-Check: PASSED
