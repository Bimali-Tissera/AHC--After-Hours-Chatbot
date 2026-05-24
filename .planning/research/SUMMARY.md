# Project Research Summary

**Project:** After-Hours AI Lead Assistant
**Domain:** Dental practice AI chatbot with embeddable widget + admin dashboard
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a two-surface product: a vanilla JS embeddable chat widget that dental practices drop onto their websites, and a Next.js admin dashboard that lets practice staff review overnight conversations and act on leads. The core premise — surface an AI assistant only when the office is closed, capture leads, and escalate genuine dental emergencies — maps to established patterns used by Intercom, Drift, and Podium, but this product adds dental-domain specificity that generic chatbots lack. The recommended build approach is pragmatic: the AI pipeline (n8n, Pinecone, OpenAI) already exists and is not touched by this project; the work is wiring a Next.js app around it via a thin API proxy, building a self-contained widget bundle, and presenting the resulting data in a clean Supabase-backed admin panel.

The recommended stack is Next.js 16 App Router on Vercel, Supabase for auth and Postgres, and Tailwind CSS for all UI. No component library, no ORM, no real-time infrastructure. The widget is vanilla JS served from `/public/widget.js`, communicates through a Next.js API proxy route to hide the n8n webhook URL, and is completely isolated from host-site CSS and JS via an IIFE wrapper. The critical path through the build is: Supabase schema (with RLS enabled from day one) → n8n Supabase write step → widget and admin dashboard shell in parallel → dashboard feature views → deployment.

The most significant risk is patient safety, not technical complexity. Emergency dental situations (knocked-out tooth, abscess, trauma) must reach the emergency phone number reliably, even if n8n misclassifies the message or is temporarily unavailable. This demands a defense-in-depth approach: keyword interception in the widget as a client-side fallback, and the emergency number hardcoded in the embed config rather than fetched from an API. Secondary risks are operational: CORS blocking the widget on third-party sites (easily prevented with proper Route Handler headers), timezone errors in the after-hours gate, and KB placeholder tokens (`[EMERGENCY PHONE NUMBER]`) reaching production. All three have clear prevention steps and should be addressed before any real-user testing.

---

## Key Findings

### Recommended Stack

The project's pre-decided choices (Next.js, Supabase, Vercel, n8n, Tailwind) are well-supported by current ecosystem documentation. The one important API-level change to note is that Next.js 16 renamed `middleware.ts` to `proxy.ts` — all auth guards and CORS headers must go in `proxy.ts`, not `middleware.ts`. The `@supabase/ssr` package (replacing the deprecated `@supabase/auth-helpers-nextjs`) handles cookie-based sessions correctly in App Router Server Components and Route Handlers. Supporting libraries are lightweight: `zod` for Server Action form validation, `jose` for JWT encryption (Edge-compatible, unlike `jsonwebtoken`), `server-only` to prevent accidental client-side data leakage, and `recharts` for the single bar chart on the stats dashboard.

**Core technologies:**
- **Next.js 16.1.7**: Full-stack React framework — App Router, Server Actions, Route Handlers, Turbopack; use `proxy.ts` not `middleware.ts`
- **Supabase**: Postgres + Auth via cookie sessions — already decided; use `@supabase/ssr` package, not deprecated auth-helpers
- **n8n cloud**: AI workflow orchestration — already built and running; Next.js is a thin proxy, not a replacement
- **Vercel**: Hosting — native Next.js adapter, zero config for App Router
- **Tailwind CSS 4.x**: All UI styling — no component library; internal tool does not need design system overhead
- **Recharts**: Single bar chart for busiest-hours view — tree-shakeable, React-native, no D3 complexity
- **zod + jose + server-only**: Form validation, JWT encryption, server bundle protection — all explicitly recommended in Next.js 16 auth docs

See `.planning/research/STACK.md` for full version constraints, installation commands, and what NOT to use.

### Expected Features

The must-have list maps directly to what dental practice staff will check for the next morning: a leads list with CSV export, conversation transcripts with status management, and aggregate stats. The chat widget itself must nail three behaviors — the after-hours time gate, the FAQ response loop, and the emergency escalation — before any other feature matters. Everything else is a differentiator or a v2 scope cut.

**Must have (table stakes):**
- After-hours time gate — the entire product premise; must use practice timezone, not browser timezone
- Floating chat widget (embedded script) — drop-in delivery via `<script>` tag, exactly like Intercom/Drift
- FAQ answers via Pinecone/OpenAI (n8n) — primary patient value; accuracy target 80%+
- Lead capture (name + phone/email) — triggered by n8n `lead_capture` response_type, not a timer
- Emergency escalation — 100% accuracy target; show practice emergency number regardless of AI state
- Chat transcript storage in Supabase — accountability and QA loop
- Admin login with Supabase Auth — patient contact data must be gated
- Leads list with CSV export — primary deliverable for the practice the next morning
- Conversations list with transcripts and status management — staff follow-up workflow
- Dashboard stats: total chats, lead capture rate, emergency count, busiest hours chart
- Mobile-responsive widget and dashboard — 60-70% of dental site traffic is mobile

**Should have (competitive differentiators):**
- Dental-domain FAQ accuracy — specificity ("Do you accept MetLife?") vs. generic vague answers
- Emergency protocol with practice-specific after-hours number — liability-aware, not generic
- Conversation status management (Followed Up / Needs Attention) — workflow state for front desk
- Busiest hours chart — concrete ROI evidence for Ekwa's client conversations
- Lead capture rate metric — (leads / sessions) as a concrete number
- Updatable knowledge base via existing n8n workflow — rare capability in simple chatbot products

**Defer to v2+:**
- Per-lead conversation link in dashboard (minor complexity, not planned)
- Settings page for office hours / emergency number config
- SMS/email admin notifications
- Multi-practice / multi-tenant support
- Appointment booking PMS integration
- Custom branding per practice

See `.planning/research/FEATURES.md` for full feature dependency graph.

### Architecture Approach

The system uses two distinct user surfaces (chat widget on patient-facing sites; admin dashboard for internal staff) sharing a single Next.js app and a single Supabase backend. The widget is entirely vanilla JS — no React — served as a self-contained IIFE bundle from `/public/widget.js`. It never touches Supabase directly and never calls n8n directly; all communication goes through a Next.js `/api/chat` proxy route that hides the n8n webhook URL from browser network traffic. The admin dashboard uses Next.js Server Components to query Supabase directly server-side, with `proxy.ts` enforcing auth on all `/admin/*` routes. The n8n workflow remains the sole writer to Supabase; the Next.js admin app is read-only from Supabase's perspective, except for status updates.

**Major components:**
1. **Chat Widget (vanilla JS IIFE)** — renders floating UI, enforces after-hours time gate, sends messages, handles all 4 response_types, has client-side emergency keyword fallback
2. **Next.js `/api/chat` proxy** — thin Route Handler that forwards widget POST to n8n webhook (server-side), hides webhook URL, handles CORS headers for cross-origin widget requests
3. **n8n AI Assistant Workflow** — existing; Pinecone query, OpenAI call, response_type classification, Supabase write; no changes required for v1
4. **Supabase Postgres** — persists all sessions, messages, leads; RLS enforced from first migration; n8n uses service role key to write, Next.js admin uses anon key + user JWT to read
5. **Next.js Admin Routes (`/admin/*`)** — Server Components reading Supabase directly; protected by `proxy.ts`; renders dashboard stats, conversations, leads views

See `.planning/research/ARCHITECTURE.md` for the full system diagram, data flow walkthroughs, and scalability considerations.

### Critical Pitfalls

1. **Emergency detection silently failing** — n8n misclassifies an emergency message as `faq`. Prevention: implement client-side keyword interception in the widget (defense layer independent of n8n); hardcode the emergency phone number in the embed config so it renders even if n8n is down. This must be in place before any real-user testing.

2. **CORS blocking the widget on third-party sites** — developers test on localhost (same origin) and never see the error; it fails on first production embed. Prevention: set `Access-Control-Allow-Origin` headers on `/api/chat` Route Handler; test the widget from a separate local HTML file on a different port before staging deployment.

3. **After-hours time gate using visitor's browser timezone** — `new Date().getHours()` returns local time, not practice time. Prevention: use IANA timezone string (`America/New_York`) in the embed config; compute gate logic with `Intl.DateTimeFormat` options; test boundary times explicitly.

4. **Supabase RLS disabled on sensitive tables** — enabled "later" becomes a rewrite when multi-tenant is needed. Prevention: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the very first migration; simple v1 policy (admin reads all, service role writes) takes minutes to configure.

5. **KB placeholder tokens (`[EMERGENCY PHONE NUMBER]`) shipped to production** — n8n KB update runs before document is finalized. Prevention: mandatory pre-flight checklist before any KB update; post-update test query to Pinecone validating no `[` brackets in responses.

Additional moderate pitfalls: n8n cold start timeouts (set 15s+ widget timeout + retry logic), widget script polluting host page global scope (IIFE + fully self-contained bundle), lead capture form firing too early (only on `lead_capture` response_type), missing `practice_id` filter on dashboard queries.

See `.planning/research/PITFALLS.md` for full details including detection warning signs.

---

## Implications for Roadmap

The architecture research provides an explicit, dependency-driven build order. The roadmap should follow it closely because each phase unblocks the next in a hard dependency chain.

### Phase 1: Foundation — Supabase Schema + Project Setup

**Rationale:** Everything downstream depends on the database tables existing with RLS enabled. This is the only true hard blocker for all other work. Also the right moment to scaffold the Next.js project, configure environment variables, and verify Node.js 20.9+ / TypeScript 5.1+ requirements.

**Delivers:** Supabase schema (`practices`, `chats`, `messages`, `leads`, `admins` tables) with RLS policies in place; initialized Next.js 16 project on Vercel; `.env.local` configured; no functional UI yet.

**Addresses:** Admin auth prerequisite; all dashboard data views; n8n write step target.

**Avoids:** Pitfall 5 (RLS disabled), Pitfall 9 (missing practice_id filter — establish the column and query pattern from day one).

**Research flag:** Standard patterns — no phase research needed. Next.js 16 setup and Supabase schema creation are well-documented.

---

### Phase 2: n8n Supabase Write Integration

**Rationale:** Data must flow into Supabase before any dashboard work shows real data. Without this, the admin dashboard can only be built against mocked data, which delays validation.

**Delivers:** n8n AI Assistant workflow configured to write `chats`, `messages`, and `leads` rows to Supabase on every conversation turn. Verifiable via Supabase Table Editor.

**Addresses:** Transcript storage, lead storage, all downstream dashboard queries.

**Avoids:** Pitfall 4 (n8n cold start — verify n8n cloud plan tier is always-on before wiring to production widget).

**Research flag:** Standard patterns — n8n Supabase node is a known integration. Verify current Supabase node version in n8n at implementation time.

---

### Phase 3: Chat Widget + API Proxy

**Rationale:** The widget is the patient-facing surface and the source of all data. It can be built in parallel with Phase 4 once Phase 1 and 2 are complete. This phase includes the most safety-critical code (emergency detection) and the most cross-cutting concern (CORS).

**Delivers:** `widget.js` (self-contained IIFE vanilla JS bundle served from `/public`); Next.js `/api/chat` Route Handler proxy; after-hours time gate with IANA timezone support; all 4 response_type handlers (`faq`, `lead_capture`, `escalation`, `emergency`); client-side emergency keyword fallback; mobile-responsive widget UI; CORS headers configured.

**Addresses:** Table stakes features 1-6 (time gate, floating widget, FAQ answers, lead capture trigger, emergency escalation, transcript storage).

**Avoids:** Pitfall 1 (emergency detection), Pitfall 2 (CORS), Pitfall 3 (timezone), Pitfall 7 (global scope pollution), Pitfall 10 (webhook URL hardcoded in bundle — use `data-attribute` embed config pattern), Pitfall 12 (session persistence in sessionStorage), Pitfall 13 (mobile viewport overlap).

**Research flag:** May benefit from phase research on the IIFE + Shadow DOM widget isolation pattern and current Next.js 16 CORS Route Handler configuration syntax. The emergency keyword pattern and `Intl.DateTimeFormat` timezone approach are standard and do not need research.

---

### Phase 4: Admin Auth + Dashboard Shell

**Rationale:** Can be built in parallel with Phase 3 once Phase 1 is complete. Auth must be wired before any dashboard views are built to avoid retrofitting protection onto existing pages.

**Delivers:** `proxy.ts` protecting all `/admin/*` routes; Supabase Auth email/password login page (`/admin/login`); dashboard shell layout (navigation, logout); session management via `@supabase/ssr` cookie pattern.

**Addresses:** Admin authentication table stake; auth prereq for all dashboard views.

**Avoids:** Pitfall 14 (unprotected admin routes — middleware-first approach, component-level check is secondary).

**Research flag:** Standard patterns — Next.js 16 `proxy.ts` auth pattern and `@supabase/ssr` session management are documented. Verify `@supabase/ssr` API surface against current docs at implementation time (MEDIUM confidence from STACK.md).

---

### Phase 5: Dashboard Feature Views

**Rationale:** Depends on Phase 4 (auth shell) and Phase 1 (schema). Can begin immediately after those two phases are done, even before the widget is finalized — as long as Phase 2 is writing real data.

**Delivers:** `/admin/dashboard` — stats cards (total chats, lead capture rate, emergency count) + busiest hours bar chart (Recharts); `/admin/conversations` — expandable transcript list with status toggle (Followed Up / Needs Attention); `/admin/leads` — leads table with CSV export button.

**Addresses:** All dashboard table stakes and differentiator features (stats, busiest hours chart, lead capture rate metric, status management, CSV export).

**Avoids:** Pitfall 9 (every query scoped to `practice_id` from the authenticated session); Pitfall 11 (use polling, not Supabase Realtime subscriptions, for v1).

**Research flag:** Standard patterns — Server Components + Supabase queries and Recharts `BarChart` are well-documented.

---

### Phase 6: Deployment + Pre-Launch Validation

**Rationale:** Final phase after all features are complete. Includes production environment variable configuration, end-to-end testing on a real third-party domain (CORS validation), and the KB pre-flight checklist.

**Delivers:** Live Vercel deployment with production Supabase and n8n credentials; widget verified on a real external HTML page (CORS); emergency detection test suite passing (20+ phrase variations); KB pre-flight checklist completed (no `[PLACEHOLDER]` tokens in Pinecone); Ekwa embed script tag documented.

**Addresses:** CSV export validation, mobile layout testing on real dental site templates.

**Avoids:** Pitfall 2 (CORS — final cross-origin embed test), Pitfall 6 (KB placeholders — pre-flight checklist gate).

**Research flag:** Standard deployment patterns. Verify Vercel environment variable configuration for `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`).

---

### Phase Ordering Rationale

- **Supabase schema is the single hard dependency** — identified in both ARCHITECTURE.md and PITFALLS.md (RLS). Nothing else can proceed correctly without it.
- **n8n write integration must precede dashboard data work** — builds against real data prevents mocked-data mistakes.
- **Widget and admin shell are parallel tracks** — they share only the database schema. Building them simultaneously reduces total elapsed time.
- **Dashboard feature views are last** — they need auth shell (Phase 4) and real data (Phase 2) but otherwise have no dependencies on the widget.
- **Emergency handling and CORS are Phase 3 concerns, not Phase 6** — both PITFALLS.md and FEATURES.md are explicit that these must be resolved before real-user testing, not as deployment polish.

### Research Flags Summary

| Phase | Research Needed | Reason |
|-------|----------------|--------|
| Phase 1 | No | Standard Next.js 16 setup + Supabase schema DDL |
| Phase 2 | No | Standard n8n Supabase node; verify node version at install |
| Phase 3 | Partial | IIFE/Shadow DOM isolation pattern and Next.js 16 CORS syntax worth confirming; emergency logic and timezone handling are standard Web APIs |
| Phase 4 | Partial | Verify `@supabase/ssr` API surface against current docs (MEDIUM confidence in STACK.md) |
| Phase 5 | No | Server Components + Supabase + Recharts all have established patterns |
| Phase 6 | No | Standard Vercel deployment |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core framework (Next.js 16, Supabase, Vercel, Tailwind) verified against official Next.js 16.1.7 docs. `@supabase/ssr` package name from training data (Aug 2025) — verify version at install. Recharts version also from training data. |
| Features | MEDIUM | Competitor feature analysis (Podium, Weave, NexHealth) from training data through Aug 2025; WebSearch unavailable during research session. Anti-features and feature dependencies are HIGH confidence — derived from PROJECT.md first-party context. |
| Architecture | HIGH | Architecture pre-decided in PROJECT.md. All patterns (IIFE widget, API proxy, RLS, Server Components) are established industry conventions with strong training-data confidence. |
| Pitfalls | MEDIUM-HIGH | CORS behavior, timezone handling, and RLS defaults are HIGH confidence (standard specs and documentation). n8n cold start behavior and Supabase Realtime pricing are LOW confidence — verify against current n8n pricing and Supabase pricing at implementation time. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **`@supabase/ssr` API surface**: Package confirmed, but specific method signatures (cookie handling in `proxy.ts`) should be validated against current Supabase docs before Phase 4 implementation. Run `npm install @supabase/ssr@latest` and check changelog at install time.
- **n8n cloud plan tier**: Whether the current n8n cloud plan supports always-on (non-suspending) workflows is unverified. Confirm at https://n8n.io/pricing before Phase 2 cutover. If not always-on, budget for a warm-up ping strategy.
- **Supabase Realtime pricing limits**: Confirmed as not needed for v1 (use polling), but verify current free tier connection limits if dashboard requirements change.
- **Competitor feature validation**: Feature research was based on training data through Aug 2025. Before roadmap finalization, a quick review of current Podium and NexHealth feature pages would validate the table-stakes list.
- **Emergency keyword list completeness**: The PITFALLS.md recommends 20+ emergency phrase variations in a test suite. This list needs to be drafted and reviewed with Ekwa before Phase 3 sign-off.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — first-party project constraints, existing infrastructure, out-of-scope decisions
- Next.js v16.1.7 official docs — installation, proxy.ts, authentication guide, forms, environment variables, deploying (https://nextjs.org/docs)
- CORS browser standard — well-established Web API specification

### Secondary (MEDIUM confidence)
- Supabase listed in Next.js auth docs as recommended provider — https://nextjs.org/docs/app/guides/authentication#auth-libraries
- `@supabase/ssr` package (Aug 2025 training data) — verify at install
- Recharts for React charts (Aug 2025 training data) — verify version at install
- Next.js App Router middleware auth pattern (Aug 2025 training data) — verify current `proxy.ts` API
- Dental chatbot competitor feature analysis: Podium, Weave, NexHealth, PatientPop, Dentrix Ascend Chat, Intercom, Drift (Aug 2025 training data)

### Tertiary (LOW confidence — verify before implementation)
- n8n cloud cold start / plan tier behavior — https://n8n.io/pricing
- Supabase Realtime pricing and connection limits — https://supabase.com/pricing

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
