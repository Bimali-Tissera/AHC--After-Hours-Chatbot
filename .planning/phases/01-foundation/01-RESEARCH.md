# Phase 1: Foundation - Research

**Researched:** 2026-03-19
**Domain:** Next.js 16 App Router + Supabase Auth + PostgreSQL RLS
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Supabase project needs to be created manually in the dashboard before implementation
- Real Ekwa seed data will be provided by the user at implementation time (not placeholders)
- Seed data includes: practice name, address, phone, emergency phone, hours, insurance list, services
- Simple centered card login page on a plain background — email, password, submit button, minimal branding
- After successful login, redirect to /admin/leads (the primary action page for practice staff)
- Sessions persist across browser closes — stay logged in until explicit logout
- No sign-up page — admin user created manually in Supabase dashboard for v1
- No password reset flow in v1
- Next.js project lives at the repo root (package.json, app/ at top level)
- Use src/ directory convention — app/, components/, lib/, utils/ all inside src/
- TypeScript throughout
- npm as package manager
- proxy.ts for auth guard (Next.js 16 pattern, not middleware.ts)
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DB-01 | Supabase schema created with all 5 tables (practices, chats, messages, leads, admins) per SUPABASE_SCHEMA.md | SQL DDL patterns, migration approach via dashboard SQL editor |
| DB-02 | Row Level Security (RLS) policies enabled on all tables from first migration — filter by practice_id | RLS ENABLE + policy patterns with auth.uid() subquery for practice_id lookup |
| DB-03 | Ekwa practice seed data inserted (hours, phone, address, insurance list, services) | SQL INSERT with jsonb for hours_json, text[] for insurance/services arrays |
| DB-04 | Next.js project initialized with App Router, TailwindCSS, @supabase/ssr, proxy.ts auth guard | create-next-app command, package install, proxy.ts implementation |
| AUTH-01 | Admin can log in with email and password via Supabase Auth | signInWithPassword server action, login page with form |
| AUTH-02 | /admin/* routes protected by proxy.ts — unauthenticated users redirected to login | proxy.ts with getClaims() check + redirect pattern, admin layout guard |
| AUTH-03 | Admin can log out from the dashboard | signOut server action + revalidatePath + redirect |
</phase_requirements>

---

## Summary

This phase establishes every foundational element the rest of the project depends on: the Supabase database schema (5 tables + RLS), a scaffolded Next.js 16 project with App Router and TailwindCSS, and a complete admin authentication flow (login, protected routes, logout).

Next.js is currently at version 16.2.0 (as of 2026-03-03 docs update). The framework has renamed `middleware.ts` to `proxy.ts` to better communicate its purpose — this aligns with the locked decision in CONTEXT.md. The Supabase `@supabase/ssr` package (v0.9.0) is the current standard for cookie-based server-side auth; `@supabase/auth-helpers` is deprecated. A new `getClaims()` method was added to complement `getUser()` — use `getClaims()` in the proxy for fast JWT validation without a network round-trip; use `getUser()` only in protected page components where verifying session liveness matters.

The RLS design (admins.id = auth.users.id, practice_id subquery in every policy, TO authenticated role constraint) is well-matched to Supabase's recommended multi-tenant RLS pattern. All writes through the service role bypass RLS by design — the anon key should never reach the database.

**Primary recommendation:** Scaffold with `create-next-app` non-interactively, install Supabase packages, write the schema SQL in a single file and run it via the Supabase dashboard SQL editor (no CLI needed for v1), implement proxy.ts using `getClaims()` for the session check, and protect routes via the admin layout calling `getUser()`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.0 | Framework — App Router, Server Components, proxy.ts | Current stable; locked decision |
| @supabase/supabase-js | 2.99.2 | Supabase client — auth, data queries | Official JS client |
| @supabase/ssr | 0.9.0 | Cookie-based SSR auth for Next.js | Replaces deprecated auth-helpers; official recommendation |
| tailwindcss | 4.2.2 | Utility CSS — login page, admin shell | Locked decision; built into create-next-app defaults |
| typescript | 5.x (bundled) | Type safety throughout | Locked decision |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react | 19.x (bundled with next 16) | UI rendering | Always (peer dep) |
| next/headers | (bundled) | Cookie access in Server Components | `createServerClient` setup |
| next/navigation | (bundled) | `redirect()` in server actions | Auth guards, post-login redirect |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers | auth-helpers is deprecated — do not use |
| proxy.ts | middleware.ts | Same file, renamed in Next.js 16; both work but proxy.ts is the current name |
| Dashboard SQL editor | Supabase CLI migrations | CLI adds Docker dependency + local Supabase stack; overkill for v1 greenfield |
| getClaims() in proxy | getUser() in proxy | getUser() makes a network round-trip per request; getClaims() validates JWT locally — use getClaims() in proxy, getUser() in page guards |

**Installation:**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
npm install @supabase/supabase-js @supabase/ssr
```

Note: Running `create-next-app` with `.` as the destination scaffolds into the current directory (repo root), matching the locked structure decision.

**Version verification (confirmed 2026-03-19):**
- `next`: 16.2.0
- `@supabase/supabase-js`: 2.99.2
- `@supabase/ssr`: 0.9.0
- `tailwindcss`: 4.2.2

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx        # Auth guard — redirects if no session
│   │   ├── leads/
│   │   │   └── page.tsx      # Primary post-login landing page (AUTH-02 target)
│   │   └── login/
│   │       ├── page.tsx      # Centered card login form
│   │       └── actions.ts    # signInWithPassword server action
│   └── layout.tsx            # Root layout
├── lib/
│   └── supabase/
│       ├── server.ts         # createServerClient for Server Components + Server Actions
│       └── client.ts         # createBrowserClient for Client Components
└── utils/
    └── (shared utilities)
proxy.ts                       # Session refresh + route protection (repo root, beside src/)
.env.local                     # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Note: `proxy.ts` lives at the repo root alongside `src/` — this is how Next.js 16 locates it (same as `middleware.ts` placement).

### Pattern 1: Server-Side Supabase Client (for Server Components and Server Actions)

**What:** Creates a Supabase client that reads/writes cookies via `next/headers`
**When to use:** Any Server Component that reads data, any Server Action that touches auth

```typescript
// src/lib/supabase/server.ts
// Source: Supabase SSR docs + ryankatayi.com verified implementation
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // Server Components throw on cookie writes — proxy.ts handles persistence
          }
        },
      },
    }
  )
}
```

### Pattern 2: proxy.ts — Session Refresh and Route Guard

**What:** Runs on every request (except static assets), refreshes the auth JWT, redirects unauthenticated users away from /admin/*
**When to use:** This is the single auth enforcement point — all /admin/* protection flows through here

```typescript
// proxy.ts (repo root)
// Source: Supabase SSR docs (proxy.ts pattern, Next.js 16)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Use getClaims() for fast local JWT validation — no network round-trip
  const { data: { claims } } = await supabase.auth.getClaims()

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  if (isAdminRoute && !isLoginPage && !claims) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (isLoginPage && claims) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/leads'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Critical note:** The `createServerClient` call inside proxy.ts MUST set cookies on the response object (via `supabaseResponse.cookies.set`). If you create a new `NextResponse` after calling `createServerClient`, the refreshed session cookies get dropped — this is a common bug.

### Pattern 3: Login Server Action

**What:** Handles form submission, calls `signInWithPassword`, redirects on success
**When to use:** The /admin/login form submits to this

```typescript
// src/app/admin/login/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Return error to client — do NOT expose Supabase error messages verbatim
    // "Invalid login credentials" is a safe, generic message
    redirect('/admin/login?error=invalid_credentials')
  }

  redirect('/admin/leads')
}
```

### Pattern 4: Logout Server Action

**What:** Signs out and clears session cookies, redirects to login
**When to use:** Logout button in admin nav

```typescript
// src/app/admin/logout/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}
```

### Pattern 5: Admin Layout Route Guard (defense-in-depth)

**What:** Secondary check in the admin layout — even if proxy.ts passes, layout re-validates
**When to use:** `/admin/layout.tsx` — covers the layout wrapping all /admin/* pages

```typescript
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()  // Use getUser() here — verifies session liveness

  if (!user) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
```

### Pattern 6: RLS Policy Design — Multi-Tenant practice_id Filtering

**What:** Every admin-readable table filtered by practice_id via subquery against admins table
**When to use:** Applied to all 5 tables in the initial migration

```sql
-- Enable RLS on all tables first
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- practices: admin can read their own practice
CREATE POLICY "admins_read_own_practice" ON practices
FOR SELECT TO authenticated
USING (
  id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
);

-- chats: filtered by practice_id
CREATE POLICY "admins_read_own_chats" ON chats
FOR SELECT TO authenticated
USING (
  practice_id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
);

-- messages: join through chats to get practice_id
CREATE POLICY "admins_read_own_messages" ON messages
FOR SELECT TO authenticated
USING (
  chat_id IN (
    SELECT id FROM chats
    WHERE practice_id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
  )
);

-- leads: filtered by practice_id
CREATE POLICY "admins_read_own_leads" ON leads
FOR SELECT TO authenticated
USING (
  practice_id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
);

-- admins: admin can only read their own row
CREATE POLICY "admins_read_own_row" ON admins
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));
```

**Key notes:**
- Wrap `auth.uid()` in a `SELECT` to cache it per statement (performance)
- Always use `TO authenticated` to prevent anon role from running the policy at all
- No INSERT/UPDATE/DELETE policies needed for admin reads — all writes go through service role on server-side API routes
- Service role bypasses RLS entirely — never expose the service role key client-side

### Anti-Patterns to Avoid

- **Using `getSession()` in server code:** `getSession()` does not re-validate the JWT against the auth server. Use `getClaims()` in proxy.ts and `getUser()` in page layouts.
- **Using `getUser()` in proxy.ts:** Valid but expensive — it makes a network round-trip on every request. `getClaims()` validates the JWT locally and is preferred in the hot path.
- **Exposing service role key to client:** The service role key bypasses ALL RLS. It must stay server-side only, in environment variables never prefixed with `NEXT_PUBLIC_`.
- **Creating a new NextResponse after supabase client cookie writes:** This drops the refreshed session cookies. Always mutate and return the same `supabaseResponse` object.
- **Using `auth.uid()` without SELECT wrapper in RLS policies:** Called per-row instead of once per statement — causes significant performance degradation on large tables.
- **Forgetting `TO authenticated` in policies:** Without this, the policy runs for the `anon` role too, adding unnecessary overhead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie management | Custom JWT cookie logic | @supabase/ssr createServerClient | Edge cases: cookie size limits, refresh timing, HttpOnly flags, SameSite |
| Password hashing + auth | Custom auth table + bcrypt | Supabase Auth (built on GoTrue) | Rate limiting, brute-force protection, secure token rotation all built in |
| Route protection | Custom request interceptor | proxy.ts + @supabase/ssr getClaims() | Token refresh timing, cookie propagation to Server Components |
| Multi-tenant data isolation | Client-side practice_id filter | Supabase RLS policies | Client-side filtering is bypassable; RLS enforces at the database level |

**Key insight:** Auth bugs compound. Supabase Auth + @supabase/ssr handles the JWT refresh window, cookie HttpOnly/Secure flags, and session persistence correctly. Hand-rolling any of these introduces subtle session expiration bugs that are hard to reproduce.

---

## Common Pitfalls

### Pitfall 1: Dropped Session Cookies in proxy.ts

**What goes wrong:** Admin logs in successfully, but gets redirected back to login on the next request.
**Why it happens:** If you create a `new NextResponse()` after the Supabase client's `setAll` cookie handler has already written to `supabaseResponse`, you return a response without the updated cookies.
**How to avoid:** Always mutate the existing `supabaseResponse` variable and return it — never create a new response object after the Supabase client is initialized.
**Warning signs:** Login works once, then immediately bounces back to login page.

### Pitfall 2: Using getSession() for Server-Side Auth Checks

**What goes wrong:** A user whose account was deleted or disabled can still access protected routes because their local JWT hasn't expired.
**Why it happens:** `getSession()` trusts the locally stored JWT without verifying with the auth server.
**How to avoid:** Use `getClaims()` in proxy.ts (JWT signature validation), use `getUser()` in layout guards (server-verified session liveness).
**Warning signs:** No immediate symptom — silent security gap.

### Pitfall 3: Service Role Key Exposed Client-Side

**What goes wrong:** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` visible in browser — all RLS bypassed for anyone who inspects the network tab.
**Why it happens:** Accidentally prefixing the service role key with `NEXT_PUBLIC_` or using it in a Client Component.
**How to avoid:** Service role key is `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC_ prefix). Only import it in Server Actions and API Routes.
**Warning signs:** Service role key appears in browser network requests or JavaScript bundle.

### Pitfall 4: RLS Enabled But No Policies — All Rows Blocked

**What goes wrong:** After enabling RLS, all queries return empty results. Dashboard data appears missing.
**Why it happens:** RLS with no policies defaults to DENY ALL. Policies must be created explicitly.
**How to avoid:** Create all policies in the same migration file as `ENABLE ROW LEVEL SECURITY`.
**Warning signs:** Tables exist and have data, but SELECT returns 0 rows.

### Pitfall 5: admins Table Row Missing After Auth User Creation

**What goes wrong:** Admin user can authenticate with Supabase Auth but their practice_id lookup fails — they see no data.
**Why it happens:** Supabase Auth creates a user in `auth.users` but does NOT create a row in the public `admins` table. These must be created separately.
**How to avoid:** After creating the auth user in the dashboard, manually INSERT into `admins` with the user's UUID as the `id` and the correct `practice_id`.
**Warning signs:** Auth works (user can log in), but all dashboard data is empty; practice_id subquery in RLS returns NULL.

### Pitfall 6: Session Persistence "Stay Logged In" Requires No Extra Config

**What goes wrong:** Developer adds custom session expiry logic, breaking the persistence requirement.
**Why it happens:** Supabase Auth sessions persist across browser closes by default when using cookie-based SSR auth (`@supabase/ssr`). This is the default behavior — the token is stored in an HttpOnly cookie with no `expires` manipulation needed.
**Warning signs:** Not applicable if you don't override defaults — just don't fight the default behavior.

### Pitfall 7: create-next-app at Repo Root

**What goes wrong:** `create-next-app` prompts to create a new subdirectory instead of scaffolding into the current directory.
**How to avoid:** Pass `.` as the project name: `npx create-next-app@latest .` — this scaffolds into the current directory. If files exist, it will warn before overwriting.
**Warning signs:** `package.json` ends up nested inside a subdirectory.

---

## Code Examples

### SQL Migration — Full Schema

```sql
-- Source: SUPABASE_SCHEMA.md (project canonical ref)
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create tables
CREATE TABLE practices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text,
  address       text,
  phone         text,
  emergency_phone text,
  hours_json    jsonb,
  insurance_list text[],
  services      text[],
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE chats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id   uuid REFERENCES practices(id),
  started_at    timestamptz DEFAULT now(),
  ended_at      timestamptz,
  status        text DEFAULT 'open',
  is_emergency  boolean DEFAULT false,
  lead_captured boolean DEFAULT false
);

CREATE TABLE messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       uuid REFERENCES chats(id),
  role          text,
  content       text,
  response_type text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id          uuid REFERENCES chats(id),
  practice_id      uuid REFERENCES practices(id),
  name             text,
  phone            text,
  email            text,
  trigger_question text,
  captured_at      timestamptz DEFAULT now(),
  exported         boolean DEFAULT false
);

CREATE TABLE admins (
  id            uuid PRIMARY KEY,  -- Must match auth.users.id
  practice_id   uuid REFERENCES practices(id),
  email         text UNIQUE,
  created_at    timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (see Architecture Patterns > Pattern 6)
-- (policies go here — copy from Pattern 6 above)
```

### Seed Data Insert Pattern

```sql
-- Run AFTER the user provides actual Ekwa data
-- hours_json format: per-day open/close times
INSERT INTO practices (id, name, address, phone, emergency_phone, hours_json, insurance_list, services)
VALUES (
  gen_random_uuid(),
  'Ekwa Dental',
  '123 Main St, City, ST 12345',
  '555-000-0000',
  '555-999-9999',
  '{
    "mon": {"open": "08:00", "close": "17:00"},
    "tue": {"open": "08:00", "close": "17:00"},
    "wed": {"open": "08:00", "close": "17:00"},
    "thu": {"open": "08:00", "close": "17:00"},
    "fri": {"open": "08:00", "close": "17:00"},
    "sat": null,
    "sun": null
  }'::jsonb,
  ARRAY['Delta Dental', 'Cigna', 'Aetna', 'MetLife', 'BCBS'],
  ARRAY['Cleaning', 'Whitening', 'Invisalign', 'Implants', 'X-rays']
);

-- After Supabase Auth user created manually:
-- Copy the UUID from auth.users, then:
INSERT INTO admins (id, practice_id, email)
VALUES (
  '<paste-auth-user-uuid-here>',
  '<paste-practice-uuid-from-above>',
  'admin@ekwa.com'
);
```

### Login Page (minimal, centered card)

```typescript
// src/app/admin/login/page.tsx
import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Admin Login</h1>
        {searchParams.error && (
          <p className="text-sm text-red-600 mb-4">Invalid email or password.</p>
        )}
        <form>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            formAction={login}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers | @supabase/ssr | 2023-2024 | auth-helpers is deprecated — use @supabase/ssr 0.9.0 |
| middleware.ts | proxy.ts | Next.js 16 | Same file, renamed — both work but proxy.ts is the canonical name |
| getUser() in middleware for auth check | getClaims() in proxy.ts | 2025 (getClaims added) | getClaims() validates JWT locally; no network call per request |
| getSession() for server-side checks | getUser() / getClaims() | Ongoing guidance | getSession() doesn't re-validate token — security risk |
| Tailwind CSS v3 | Tailwind CSS v4 | 2025 | Different config approach: v4 uses CSS-based config, not tailwind.config.js |

**Deprecated/outdated:**
- `@supabase/auth-helpers`: Replaced by `@supabase/ssr` — do not use
- `getSession()` in server code: Marked as unsafe for server-side auth by Supabase docs
- `middleware.ts`: Still works in Next.js 16 but `proxy.ts` is the new canonical name

**Tailwind v4 note (MEDIUM confidence):** Tailwind 4.2.2 ships with `create-next-app`. v4 dropped `tailwind.config.js` in favor of CSS-based `@import "tailwindcss"` in your global CSS file. The `className` utility-first approach is unchanged but configuration method differs from v3.

---

## Open Questions

1. **Exact Ekwa seed data format**
   - What we know: Seed data will be real practice data provided at implementation time
   - What's unclear: Exact insurance list, service names, hours format from Ekwa
   - Recommendation: Implementer must wait for user to provide data before running seed SQL; the SQL template is ready

2. **Tailwind v4 configuration approach**
   - What we know: Tailwind 4.2.2 is installed by create-next-app, config method changed from v3
   - What's unclear: Whether create-next-app for Next.js 16 auto-configures Tailwind v4 CSS import correctly
   - Recommendation: Verify the generated `globals.css` uses `@import "tailwindcss"` after scaffolding; if it uses v3 directives (@tailwind base/components/utilities), update it
   - Confidence: MEDIUM — verify during implementation

3. **getClaims() availability in @supabase/ssr 0.9.0**
   - What we know: getClaims() is documented and works for asymmetric key projects (default for new Supabase projects)
   - What's unclear: Whether it's available via the SSR client or only the browser client
   - Recommendation: Test getClaims() in proxy.ts after scaffolding; fall back to getUser() if unavailable in the SSR package version
   - Confidence: MEDIUM

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — greenfield project; no test config exists yet |
| Config file | None — Wave 0 must create |
| Quick run command | `npm run test -- --testPathPattern=auth` (after setup) |
| Full suite command | `npm run test` |

Given this is a Next.js project and the phase is primarily infrastructure (SQL schema, auth config, scaffolding), most verification is manual or integration-level. Unit testing the auth flow requires mocking Supabase — worth setting up jest + jest-environment-jsdom or vitest as part of Wave 0.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DB-01 | 5 tables exist with correct columns | Manual/SQL | `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` in Supabase dashboard | N/A (dashboard check) |
| DB-02 | RLS enabled + policies filter by practice_id | Manual/SQL | `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` | N/A (dashboard check) |
| DB-03 | Seed data present in practices table | Manual/SQL | `SELECT * FROM practices;` in Supabase dashboard | N/A (dashboard check) |
| DB-04 | `npm run dev` starts without errors | Smoke | `npm run dev` — manual browser check | ❌ Wave 0 |
| AUTH-01 | Login form with valid credentials redirects to /admin/leads | Manual/E2E | Manual browser test OR Playwright e2e | ❌ Wave 0 |
| AUTH-02 | /admin/leads without session redirects to /admin/login | Smoke | Manual browser test (clear cookies, navigate to /admin/leads) | ❌ Wave 0 |
| AUTH-03 | Logout clears session and returns to /admin/login | Manual | Manual browser test | ❌ Wave 0 |

**Note:** DB-01 through DB-03 are verified in the Supabase dashboard SQL editor — not automatable in the Next.js test suite. AUTH checks are verifiable with manual browser tests during implementation.

### Sampling Rate
- **Per task commit:** `npm run build` — catches TypeScript errors and import failures
- **Per wave merge:** Full manual smoke test of auth flow (login → /admin/leads → logout → redirect back)
- **Phase gate:** All 5 success criteria verified manually before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test framework configured — if automated tests are desired, install vitest or jest as part of scaffolding
- [ ] `npm run build` script exists via create-next-app — use this as the automated sanity check
- [ ] No e2e framework — Playwright could be added but is optional for Phase 1; manual testing is sufficient

---

## Sources

### Primary (HIGH confidence)
- Supabase SSR Docs (https://supabase.com/docs/guides/auth/server-side/nextjs) — proxy.ts pattern, cookie handling, getClaims() vs getUser()
- Supabase RLS Docs (https://supabase.com/docs/guides/database/postgres/row-level-security) — ENABLE ROW LEVEL SECURITY, policy SQL, TO authenticated, SELECT wrapper for auth.uid()
- Next.js Installation Docs (https://nextjs.org/docs/app/getting-started/installation) — version 16.2.0 confirmed, create-next-app flags, proxy.ts naming
- npm registry (verified 2026-03-19): next@16.2.0, @supabase/supabase-js@2.99.2, @supabase/ssr@0.9.0, tailwindcss@4.2.2

### Secondary (MEDIUM confidence)
- Ryan Katayi's SSR guide (https://www.ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup) — verified implementation of createServerClient with cookies, middleware pattern, login actions, route protection
- getClaims() reference (https://supabase.com/docs/reference/javascript/auth-getclaims) — getClaims() behavior, JWT local validation, difference from getUser()
- Supabase signOut docs (https://supabase.com/docs/guides/auth/signout) — signOut server action pattern, revalidatePath usage
- GitHub issue #39947 (supabase/supabase) — getClaims() vs getUser() clarification

### Tertiary (LOW confidence)
- WebSearch summaries regarding Next.js 16 proxy.ts rename — cross-verified with official Next.js docs confirming proxy.ts is the current name

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all versions verified against npm registry 2026-03-19
- Architecture: HIGH — patterns verified against official Supabase SSR docs and Next.js docs
- RLS policies: HIGH — verified against official Supabase RLS documentation
- getClaims() in proxy: MEDIUM — documented but Open Question 3 flags uncertainty about SSR client availability
- Tailwind v4 config: MEDIUM — version confirmed, v4 config approach verified via documentation but not tested in this project context

**Research date:** 2026-03-19
**Valid until:** 2026-04-18 (stable stack — 30 days)
