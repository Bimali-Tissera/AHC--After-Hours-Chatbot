# Technology Stack

**Project:** After-Hours AI Lead Assistant
**Researched:** 2026-03-18
**Research mode:** Ecosystem — confirmed against official Next.js v16 docs

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.1.7 (latest) | Full-stack React framework | Already decided. App Router, Server Actions, Route Handlers, built-in Turbopack. v16 introduces `proxy.ts` replacing `middleware.ts` — important for auth guards |
| React | 19 (canary, bundled) | UI rendering | Bundled with Next.js App Router. React 19 `useActionState` and `useFormStatus` are available |
| TypeScript | 5.1+ | Type safety | Default in `create-next-app`. Required minimum v5.1 per Next.js 16 |
| Node.js | 20.9+ | Runtime | Minimum required by Next.js 16. Node.js runtime is now default for `proxy.ts` (was Edge) |

**Confidence:** HIGH — verified against official Next.js docs v16.1.7 (2026-03-16)

### Database / Auth / Backend-as-a-Service

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | cloud (managed) | Postgres database + Auth | Already decided. Handles email/password auth, JWT sessions, row-level security. Listed as recommended auth provider in official Next.js auth docs |
| @supabase/supabase-js | latest (^2.x) | Supabase JS client | Official Supabase client. Use for all DB queries from Server Components and Route Handlers |
| @supabase/ssr | latest (^0.x) | SSR-safe Supabase client | Required for App Router. Handles cookie-based session management correctly in Server Components, Route Handlers, and `proxy.ts`. Replaces deprecated `@supabase/auth-helpers-nextjs` |

**Confidence:** MEDIUM — Supabase is confirmed in Next.js auth docs. Package names and SSR pattern from training data (August 2025), not re-verified via live docs due to access restrictions. Verify `@supabase/ssr` version at install time with `npm install @supabase/ssr@latest`

### AI / Automation Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| n8n cloud | existing | AI workflow orchestration | Already built. Receives webhook POSTs from chat widget, queries Pinecone, calls OpenAI, returns structured JSON responses. No custom backend needed |
| Pinecone | existing | Vector store | Already populated with FAQ embeddings. Queried by n8n, not directly by Next.js |
| OpenAI API | existing | LLM responses | Called by n8n. Not called directly from Next.js frontend |

**Confidence:** HIGH — existing infrastructure confirmed in PROJECT.md

### Deployment / Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | managed | Next.js hosting | Already decided. Native Next.js support including App Router, Server Actions, Route Handlers. Official adapter available |
| Supabase cloud | managed | DB + Auth hosting | Already decided. No self-hosting overhead |
| n8n cloud | managed | Workflow hosting | Already running |

**Confidence:** HIGH — confirmed in PROJECT.md and Vercel listed as official Next.js adapter partner

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | latest (^3.x) | Form/input validation | Server Actions for login form. Official Next.js docs recommend Zod for server-side form validation |
| jose | latest (^5.x) | JWT encryption/decryption | Session token encryption in `app/lib/session.ts`. Official Next.js docs recommend Jose for stateless sessions — Edge-compatible unlike `jsonwebtoken` |
| server-only | latest | Server bundle protection | Mark files that must never run client-side (DAL, session utilities). Prevents accidental data leakage |
| tailwindcss | 4.x | Utility CSS | Already decided. No component library — write all UI with Tailwind utilities directly |

**Confidence:** MEDIUM-HIGH — Zod and Jose are explicitly recommended in official Next.js authentication docs (v16.1.7). Tailwind 4.x confirmed as default in `create-next-app` as of Next.js 16. `server-only` pattern from official Next.js security docs.

### Chart Library (Dashboard)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | latest (^2.x) | "Busiest hours" bar chart | Only one chart needed on the dashboard stats page. Recharts is React-native (no D3 wrapper complexity), tree-shakeable, renders as SVG. Use `BarChart` component for the hourly distribution |

**Confidence:** MEDIUM — Recharts is the standard lightweight React chart library for Next.js dashboards. Version not confirmed via live docs due to access restrictions. Verify at install time. Alternative: `chart.js` via `react-chartjs-2` — rejected because it requires a Canvas context wrapper and is heavier for a single chart use case.

---

## Architecture-Specific Stack Decisions

### Chat Widget — Embedded JS Script Delivery

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Widget delivery | Serve from `/public/widget.js` on the Next.js/Vercel deployment | Simple. No npm package. Matches how Intercom/Drift deliver scripts. Ekwa adds `<script src="https://chatbot.ekwa.com/widget.js">` to client sites |
| Widget build tool | None — write vanilla JS | Widget must run on arbitrary dental practice sites without React overhead. A single self-contained `widget.js` file injected via script tag |
| Widget communication | `fetch()` POST to Next.js API Route Handler (`/api/chat`) | Route Handler validates and forwards to n8n webhook. Avoids CORS issues (widget posts to same-origin API proxy, not n8n directly) |
| CORS for API route | Handle in `proxy.ts` or Route Handler response headers | Widget on external domains needs `Access-Control-Allow-Origin`. Official Next.js docs show CORS pattern in Route Handlers and `proxy.ts` |

**Confidence:** HIGH — pattern confirmed via Next.js docs CORS examples and Route Handler documentation

### Auth Guard for `/admin`

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Route protection | `proxy.ts` (NOT `middleware.ts`) | Next.js 16 renamed `middleware.ts` to `proxy.ts`. Confirmed in official docs v16.0.0 migration notes. Old name throws deprecation warnings |
| Session storage | Supabase Auth cookies via `@supabase/ssr` | `@supabase/ssr` handles cookie refresh automatically on each request |
| Session verification | Call `verifySession()` in DAL, not in layout | Per official Next.js auth guide: layouts don't re-render on navigation, so auth checks in layouts miss route changes. Check in page components or close to data source |

**Confidence:** HIGH — proxy.ts rename confirmed in official Next.js v16 changelog and middleware documentation

### Data Flow

```
Chat Widget (vanilla JS on ekwa.com)
  → POST /api/chat (Next.js Route Handler)
    → Forward to n8n webhook
      → n8n: Pinecone vector search + OpenAI response
      → n8n: Write to Supabase (chats, messages, leads tables)
    → Return n8n response to widget

Admin Dashboard (Next.js /admin routes)
  → Supabase Auth (cookie session via @supabase/ssr)
  → Server Components query Supabase Postgres directly
  → No additional API layer needed for dashboard data
```

---

## What NOT to Use

| Category | Rejected Option | Why Rejected |
|----------|-----------------|--------------|
| Component library | shadcn/ui, Radix, MUI, Chakra | Project constraint: clean minimal Tailwind only. Internal tool — no need for design system overhead |
| Auth library | NextAuth.js / Auth.js | Supabase Auth already handles email/password + JWT. Adding NextAuth on top adds unnecessary complexity for a single-provider setup |
| State management | Zustand, Redux, Jotai | No global state needed. Dashboard reads from Supabase server-side. Chat widget is standalone vanilla JS |
| ORM | Prisma, Drizzle | Supabase client provides typed queries with RLS built-in. Adding an ORM layer for a simple 5-table schema adds migration complexity without benefit |
| Real-time | Supabase Realtime, WebSockets | Explicitly out of scope for v1. Webhook POST flow is sufficient |
| Edge Runtime for proxy.ts | Edge | Next.js 16 defaults `proxy.ts` to Node.js runtime (stable in v15.5). No need to force Edge — Supabase `@supabase/ssr` is compatible with both |
| `middleware.ts` file name | — | Deprecated in Next.js v16.0.0. Use `proxy.ts`. Codemod available: `npx @next/codemod@canary middleware-to-proxy .` |
| `jsonwebtoken` | — | Not Edge-compatible. Use `jose` instead (official Next.js recommendation) |
| `@supabase/auth-helpers-nextjs` | — | Deprecated package. Replaced by `@supabase/ssr` |

---

## Installation

```bash
# Create project (enables TypeScript, Tailwind, ESLint, App Router, Turbopack by default)
npx create-next-app@latest after-hours-chatbot --yes

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr

# Validation and session utilities
npm install zod jose server-only

# Charts (dashboard only)
npm install recharts

# Dev dependencies (TypeScript types)
npm install -D @types/node @types/react @types/react-dom
```

**Node.js requirement:** 20.9 minimum. Verify with `node --version` before starting.

---

## Environment Variables

```bash
# .env.local — never commit this file

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # server-only, never NEXT_PUBLIC_

# n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.cloud/webhook/your-webhook-id

# Session
SESSION_SECRET=generate-with-openssl-rand-base64-32
```

**Convention:** `NEXT_PUBLIC_` prefix = bundled into client JS (safe for public keys). No prefix = server-only. Never use `NEXT_PUBLIC_` for `SERVICE_ROLE_KEY` or `SESSION_SECRET`.

---

## Version Constraints Summary

| Package | Minimum | Notes |
|---------|---------|-------|
| Node.js | 20.9 | Hard requirement from Next.js 16 |
| Next.js | 16.x | Use `proxy.ts` not `middleware.ts` |
| TypeScript | 5.1 | Hard requirement from Next.js 16 |
| React | 19 | Bundled with Next.js App Router — use `useActionState` not legacy `useFormState` |

---

## Sources

| Source | Confidence | URL |
|--------|------------|-----|
| Next.js v16.1.7 Installation | HIGH | https://nextjs.org/docs/app/getting-started/installation |
| Next.js v16.1.7 Proxy (formerly Middleware) | HIGH | https://nextjs.org/docs/app/api-reference/file-conventions/proxy |
| Next.js v16.1.7 Authentication Guide | HIGH | https://nextjs.org/docs/app/guides/authentication |
| Next.js v16.1.7 Forms Guide | HIGH | https://nextjs.org/docs/app/guides/forms |
| Next.js v16.1.7 Environment Variables | HIGH | https://nextjs.org/docs/app/guides/environment-variables |
| Next.js v16.1.7 Deploying | HIGH | https://nextjs.org/docs/app/getting-started/deploying |
| Supabase listed as auth provider | MEDIUM | https://nextjs.org/docs/app/guides/authentication#auth-libraries |
| PROJECT.md existing infrastructure | HIGH | .planning/PROJECT.md |
| @supabase/ssr package name | MEDIUM | Training data (Aug 2025) — verify version at install |
| Recharts for React charts | MEDIUM | Training data (Aug 2025) — verify version at install |
