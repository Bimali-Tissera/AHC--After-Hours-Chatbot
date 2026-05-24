---
phase: 01-foundation
plan: 03
subsystem: admin-auth
tags: [auth, login, logout, admin-dashboard, supabase-auth, next-js, tailwind]
dependency_graph:
  requires:
    - 01-02 (Next.js scaffold with Supabase clients and middleware auth guard)
  provides:
    - Admin login page with form and error state
    - Admin logout server action
    - Auth-guarded admin layout with sidebar
    - Demo-ready leads dashboard shell
  affects:
    - All /admin/* routes (protected by layout + middleware)
tech_stack:
  added: []
  patterns:
    - Next.js 16 async searchParams in page components
    - Server Actions with formAction= pattern for login/logout
    - Supabase signInWithPassword / signOut via server client
    - Auth guard in layout using supabase.auth.getUser()
    - Middleware-first route protection (middleware.ts handles redirects; layout is defense-in-depth)
key_files:
  created:
    - src/app/admin/login/page.tsx
    - src/app/admin/login/actions.ts
    - src/app/admin/logout/actions.ts
    - src/app/admin/layout.tsx
    - src/app/admin/leads/page.tsx
  modified:
    - middleware.ts (renamed from proxy.ts; function renamed from proxy to middleware)
decisions:
  - "Middleware handles primary auth redirect; AdminLayout getUser() is defense-in-depth only — removed duplicate redirect logic from layout to prevent React Server Component errors"
  - "proxy.ts renamed to middleware.ts with exported function renamed from proxy to middleware to satisfy Next.js 16 middleware convention"
metrics:
  duration: ~2 hours
  completed: 2026-03-19
---

# Phase 1 Plan 3: Admin Auth Flow and Dashboard Shell Summary

**One-liner:** Complete Supabase auth flow (login/logout via Server Actions) with middleware-first route protection and a demo-ready admin dashboard shell using Tailwind.

## What Was Built

This plan delivered the complete human-facing side of Phase 1 authentication. An admin can now:
- Navigate to `/admin/login`, see a centered card form, and authenticate with Supabase email/password
- Get an error banner on wrong credentials without exposing Supabase error details
- Land on a protected `/admin/leads` dashboard with sidebar navigation (practice name, nav item, logout button)
- See a demo-ready leads table with 5 column headers and a polished empty state
- Log out and be returned to `/admin/login` with session cleared

Route protection works at two layers: middleware.ts intercepts unauthenticated requests before they reach any page component, and `AdminLayout` calls `getUser()` as defense-in-depth.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Create login page, login action, and logout action | 90b750e | Complete |
| 2 | Create admin layout with auth guard, sidebar, and leads page shell | a4f69e7 | Complete |
| 3 | Verify complete auth flow and dashboard shell | (checkpoint) | Human-verified |

**Bug fix commits (post-task):**
| Commit | Description |
|--------|-------------|
| 5ad825b | fix(auth): resolve middleware routing and redirect loop |
| 063141f | chore: remove old proxy.ts (replaced by middleware.ts) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] proxy.ts renamed to middleware.ts with function renamed from proxy to middleware**
- **Found during:** Post-task verification (auth flow testing)
- **Issue:** Next.js 16 requires the middleware export to be named `middleware` (not `proxy`) and the file must be `middleware.ts` at the project root. The original `proxy.ts` with `export function proxy()` was not recognized by the Next.js runtime, causing route protection to silently fail.
- **Fix:** Renamed `proxy.ts` to `middleware.ts` and renamed the exported function from `proxy` to `middleware` to satisfy Next.js 16 middleware conventions.
- **Files modified:** `middleware.ts` (renamed from `proxy.ts`)
- **Commit:** 5ad825b

**2. [Rule 1 - Bug] AdminLayout simplified to remove duplicate auth redirect**
- **Found during:** Post-task verification (redirect loop debugging)
- **Issue:** The `AdminLayout` contained its own redirect-to-login logic that conflicted with middleware.ts redirects. When middleware redirected an unauthenticated user to `/admin/login`, the layout's own auth check would trigger again inside that page, causing a redirect loop or React Server Component errors.
- **Fix:** Removed the duplicate redirect logic from `AdminLayout`. The layout now only calls `getUser()` for defense-in-depth context but relies on `middleware.ts` as the primary auth gate.
- **Files modified:** `src/app/admin/layout.tsx`
- **Commit:** 5ad825b (same fix commit)

## Decisions Made

1. **Middleware-first auth architecture:** `middleware.ts` is the primary auth guard. `AdminLayout.getUser()` remains as defense-in-depth but does not redirect. This prevents redirect loops and keeps auth logic in one authoritative place.

2. **proxy.ts → middleware.ts rename:** The planning docs referenced `proxy.ts` as the auth guard file name (a custom convention). Next.js requires `middleware.ts` — the rename was necessary for the framework to recognize it. Future plans should reference `middleware.ts`.

## Verification Results

All 11 manual browser checks passed (user-verified):
1. Login page renders centered white card with "Admin Login" heading
2. Email/password fields with correct accessibility attributes
3. Wrong credentials show "Invalid email or password. Please try again." error banner
4. Correct credentials redirect to /admin/leads
5. Sidebar shows "Ekwa Dental" label
6. "Leads" nav item with blue active state (border-l-2 border-blue-600, bg-blue-50)
7. "Log out" button at sidebar bottom
8. Leads table with 5 column headers (Name, Phone, Email, Trigger Question, Date)
9. "No leads yet" empty state
10. Logout redirects to /admin/login and clears session
11. Navigating to /admin/leads after logout redirects back to /admin/login

## Self-Check: PASSED

Files verified present:
- src/app/admin/login/page.tsx — EXISTS
- src/app/admin/login/actions.ts — EXISTS
- src/app/admin/logout/actions.ts — EXISTS
- src/app/admin/layout.tsx — EXISTS
- src/app/admin/leads/page.tsx — EXISTS
- middleware.ts — EXISTS (at project root)

Commits verified:
- 90b750e — feat(01-03): create login page, login action, and logout action
- a4f69e7 — feat(01-03): create admin layout with auth guard, sidebar, and leads page shell
- 5ad825b — fix(auth): resolve middleware routing and redirect loop
- 063141f — chore: remove old proxy.ts (replaced by middleware.ts)
