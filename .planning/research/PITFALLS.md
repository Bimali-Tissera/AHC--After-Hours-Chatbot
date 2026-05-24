# Domain Pitfalls

**Domain:** Dental AI chatbot / embeddable widget / admin dashboard
**Researched:** 2026-03-18
**Confidence:** MEDIUM — based on training data (knowledge cutoff August 2025) with no external verification available during this session. Phase-specific research recommended for items flagged LOW.

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or patient safety failures.

---

### Pitfall 1: Emergency Detection Silently Failing

**What goes wrong:** The n8n AI Assistant returns `response_type: "faq"` for a message like "my child knocked out a tooth and it's bleeding badly" because the RAG hit a dental FAQ answer instead of triggering the `escalation` or `emergency` path. The patient never receives the emergency phone number. No alarm fires.

**Why it happens:** RAG retrieval is probabilistic. If a user's phrasing doesn't closely match emergency-flagged KB chunks, the wrong response_type comes back. Keyword-based fallback is not implemented. The widget renders the FAQ response and the session closes.

**Consequences:** Patient medical harm. Practice liability. Complete loss of trust in the product. This is a show-stopper failure mode.

**Prevention:**
- Implement a keyword interception layer in the widget itself (client-side, not dependent on n8n) that matches patterns like "bleeding", "knocked out", "can't breathe", "severe pain", "swallowed", "trauma". If matched, display the emergency number immediately regardless of n8n response_type.
- Treat this as a defense-in-depth: n8n handles it first; the widget catches it if n8n misses.
- The emergency phone number must be hardcoded in the widget embed config (not fetched async). It must render even if n8n is down.
- Write a dedicated test suite for emergency phrases covering 20+ variations before any deployment.

**Detection (warning signs):**
- No unit tests on emergency phrase coverage.
- Emergency number is fetched from an API call instead of being in the embed config.
- `response_type` is the sole gating condition for displaying emergency content.

**Phase:** Must be addressed in Phase 1 (widget build) before any real-user testing.

---

### Pitfall 2: CORS Blocking the Widget on Third-Party Sites

**What goes wrong:** The chat widget is embedded as a `<script>` tag on ekwa.com (and later dental client sites). The widget's JavaScript makes `fetch()` calls to the Next.js API routes on Vercel. When those domains differ (e.g., widget hosted on `ekwa.com`, API on `chatbot.vercel.app`), the browser enforces CORS. Without explicit `Access-Control-Allow-Origin` headers on the API routes, every request fails silently in the browser — the widget just spins or shows nothing.

**Why it happens:** Developers test the widget on `localhost` (same origin) or the Vercel preview domain (same origin), so CORS never fires during development. It fails on first production embed on a third-party domain.

**Consequences:** Widget completely non-functional on client sites. Requires emergency redeploy.

**Prevention:**
- Set CORS headers on every Next.js API route the widget calls, as well as on the n8n webhook endpoint (n8n allows setting response headers in the Respond to Webhook node).
- For the Next.js routes: use a `next.config.js` headers block or middleware to add `Access-Control-Allow-Origin: *` (or a domain whitelist) plus `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`.
- Test the widget from a local HTML file on a different port (e.g., `http://127.0.0.1:5500`) against the dev server before any staging deployment.
- Document allowed origins as an environment variable so Ekwa can add new client domains without a code change.

**Detection (warning signs):**
- All widget testing happens within the same Next.js app during development.
- No local HTML test harness for the embed script.
- Browser console shows CORS errors only after deploying to a client site.

**Phase:** Must be addressed in Phase 1 (widget build) and verified again in deployment phase.

---

### Pitfall 3: After-Hours Time Gate Using the Wrong Timezone

**What goes wrong:** `isAfterHours()` checks `new Date()` in the browser. A patient visits the site at 6 PM from a timezone different from the practice's timezone. If the check uses the browser's local time instead of the practice's configured timezone, patients in different timezones see the widget when the office is actually open (false positive) or don't see it when they should (false negative). A patient in California visiting a New York practice at 8 PM ET (5 PM PT) gets no after-hours assistance because the browser says it's 5 PM locally.

**Why it happens:** JavaScript's `new Date()` returns local machine time. Developers implement `isAfterHours()` without specifying a timezone, assuming the server or practice is co-located with the visitor.

**Consequences:** Widget shows during business hours (AI answers calls the staff should take) or doesn't show after hours (missed leads — the core product failure mode).

**Prevention:**
- `isAfterHours()` must compute time in the practice's configured timezone using the IANA timezone string (e.g., `America/New_York`), not the visitor's browser timezone.
- Use `Intl.DateTimeFormat` with `timeZone` option, or a minimal library like `date-fns-tz` to convert.
- The practice timezone should be in the widget embed config (set once by the developer, not derived from the visitor).
- Test explicitly with mocked dates crossing boundary conditions: 4:59 PM, 5:00 PM, 5:01 PM, weekend midnight.

**Detection (warning signs):**
- `isAfterHours()` uses `new Date().getHours()` with no timezone parameter.
- No unit tests for the time gate function.
- Testing only happens from the same timezone as the practice.

**Phase:** Phase 1 (widget build). Time gate logic should be the first thing tested.

---

### Pitfall 4: n8n Webhook Cold Start Causing Apparent Chat Failures

**What goes wrong:** n8n cloud workflows on free/starter plans deactivate when idle. The first message a patient sends after a period of inactivity hits the webhook while n8n is "cold" — the workflow hasn't reactivated yet — and returns a 502 or timeout. The widget shows an error. The patient leaves. This looks like a bug in the widget but is an infrastructure issue.

**Why it happens:** n8n cloud's lower tiers suspend inactive workflows. The first request triggers a cold start that can take 10-30 seconds or fail entirely. The widget is written to expect a quick response and treats the timeout as a fatal error.

**Consequences:** Lost leads and frustrated patients during the exact period the product is supposed to shine (after hours, when traffic is sparse and cold starts are most likely).

**Prevention:**
- Set widget timeout to at least 15-20 seconds with a "thinking..." state, not a 5-second failure.
- Implement retry logic (1-2 retries with 3s delay) before showing the user an error.
- Confirm the n8n cloud plan in use supports always-on workflows. If not, budget for the plan tier that does, or implement a scheduled ping (lightweight webhook call every 5 minutes) to keep the workflow warm.
- The error state shown to patients must still display the emergency number and practice phone even if the AI is unavailable.

**Detection (warning signs):**
- Widget timeout is set to less than 10 seconds.
- No retry logic on webhook POST failure.
- The error state shows only "Something went wrong" with no practice contact info.
- n8n plan tier has not been confirmed to support persistent active workflows.

**Phase:** Phase 2 (n8n integration). Verify plan tier before wiring the widget to production.

---

### Pitfall 5: Supabase Row Level Security (RLS) Disabled on Sensitive Tables

**What goes wrong:** Supabase tables are created with RLS disabled (the default). The dashboard is built and works. Later, when considering multi-tenant expansion or when a security review happens, it's discovered that `chats`, `messages`, and `leads` tables are exposed to any authenticated user (or via the anon key). Enabling RLS at that point requires rewriting all data access patterns.

**Why it happens:** RLS adds friction during development. Developers enable it later "when it matters." For a single-practice v1 it seems unnecessary. But the schema and access patterns are being designed now — retrofitting RLS is significantly harder than building with it from day one.

**Consequences:** Potential data exposure. Multi-tenant expansion becomes a rewrite instead of a config change. Compliance risk for patient contact data.

**Prevention:**
- Enable RLS on every table from the first migration, even for v1.
- For v1, the RLS policy can be simple: `admin` role can read all rows, service role (used by n8n) can write. This is a one-time setup that makes multi-tenant expansion trivial later.
- Never use the `anon` key from the widget to write to Supabase directly. All writes go through n8n (service role) or Next.js API routes (server-side). The widget never touches Supabase directly.

**Detection (warning signs):**
- Supabase tables exist but the migration file has no `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements.
- The widget's client-side code imports the Supabase client with the anon key and calls `.insert()` directly.

**Phase:** Phase 1 (database setup). Schema migration must include RLS policies before any data is written.

---

### Pitfall 6: KB Placeholder Tokens Shipped to Production

**What goes wrong:** The FAQ Knowledge Base contains literal placeholder strings: `[PRACTICE ADDRESS]`, `[EMERGENCY PHONE NUMBER]`, `[MAIN PHONE NUMBER]`. If these are embedded into Pinecone and the n8n workflow goes live without substituting real values, the AI will literally respond with "You can reach us at [MAIN PHONE NUMBER]" — which a patient cannot act on and which looks broken.

**Why it happens:** The KB update workflow runs once to populate Pinecone. If it's run before the placeholders are filled, the vectors contain the placeholder text. Subsequent KB updates may not be run again before launch.

**Consequences:** Patient confusion, calls to a non-number, broken trust in the product. Emergency scenarios where `[EMERGENCY PHONE NUMBER]` is returned are especially dangerous.

**Prevention:**
- Create a pre-flight checklist that must be completed before running the KB update workflow: all placeholders replaced, insurance list confirmed, hours confirmed.
- Add a simple validation step: after the KB update workflow runs, test-query Pinecone for "phone number" and "address" and verify the response contains no `[` brackets.
- Store the canonical phone numbers in the embed config for the widget as a secondary source of truth (so the emergency number is always real even if the KB has issues).

**Detection (warning signs):**
- The FAQ document has not been reviewed for `[PLACEHOLDER]` strings before the Pinecone update is run.
- No test queries run against the KB after the update workflow completes.

**Phase:** Pre-deployment checklist item. Flag in deployment phase documentation.

---

## Moderate Pitfalls

---

### Pitfall 7: Widget Script Tag Polluting the Host Page's Global Scope

**What goes wrong:** The embedded `<script>` tag introduces global variables (e.g., `window.chatWidget`, `window.supabase`, `window.React`) that conflict with globals the host dental website already uses. The host site's own JavaScript breaks, or the widget breaks, or both.

**Prevention:**
- Wrap all widget code in an IIFE (Immediately Invoked Function Expression) or use a bundler (Vite/esbuild) configured to output a self-contained bundle with no globals except the single mount function.
- Prefix any globals that must exist (e.g., `window.__afterHoursChat`).
- Bundle React and all dependencies into the widget script — do not assume the host page has React available. The widget script must be fully self-contained.
- Test on a plain HTML page that also includes jQuery and another React version to verify no conflicts.

**Phase:** Phase 1 (widget build). Bundler config is a day-one decision.

---

### Pitfall 8: Lead Capture Triggering Too Early (Interrupting Users)

**What goes wrong:** The lead capture form fires after the first message or after a fixed timer. Patients who just have a quick FAQ question are hit with a name/email form before they've gotten any value. They close the widget.

**Why it happens:** Lead capture rate is a success metric. Developers prioritize showing the form early to maximize capture attempts. This backfires — the form annoys users and reduces both FAQ satisfaction and lead capture rate.

**Prevention:**
- Trigger lead capture only after the patient has received at least one substantive FAQ answer, or when they ask a question that requires a callback ("Can I book an appointment?", "What are your hours?").
- The n8n `response_type: "lead_capture"` signal is the correct trigger — trust the AI's assessment of when to ask, not a timer.
- Do not ask for lead info during an emergency flow. If `response_type: "emergency"`, show the phone number only — do not intercept with a form.

**Phase:** Phase 2 (n8n integration). Lead capture flow design must consider response_type handling from the start.

---

### Pitfall 9: Admin Dashboard Exposing All Sessions Without Practice Scoping

**What goes wrong:** The dashboard query fetches `SELECT * FROM chats` with no `WHERE practice_id = ?` filter. For v1 (single practice) this is invisible. When a second practice is onboarded (even informally), their data appears in the first practice's dashboard. Practice A can read Practice B's patient leads.

**Why it happens:** Multi-tenant support is "out of scope for v1" so the `practice_id` column gets added to the schema but no queries actually filter by it. The dashboard "works" for v1 and the filter never gets added.

**Prevention:**
- Even for v1, every query in the dashboard must include `WHERE practice_id = ?` with the practice_id sourced from the authenticated user's session (not the URL or a query parameter).
- This is a one-line change per query now, versus a full audit later when data is already mixed.
- The RLS policy (see Pitfall 5) provides a database-level enforcement backstop.

**Phase:** Phase 1 (database + dashboard setup). Query patterns set now determine multi-tenant safety later.

---

### Pitfall 10: n8n Webhook URL Hardcoded in Widget Bundle

**What goes wrong:** The n8n webhook URL is hardcoded into the compiled widget JavaScript. When the URL changes (n8n cloud URL rotation, workflow recreation, environment switch), every embedded instance of the widget must be redeployed. If Ekwa deploys the widget on 50 client sites, updating one URL means 50 deployments.

**Why it happens:** The widget is a static JS file. Environment variables aren't naturally available at runtime in a static file. Hardcoding the URL is the path of least resistance.

**Prevention:**
- Inject the webhook URL via the embed script config at deploy time: `<script src="widget.js" data-webhook-url="https://..."></script>`. The widget reads `document.currentScript.dataset.webhookUrl` at initialization.
- This means the URL is configured per-embed, not baked into the bundle. Changing the URL requires updating one line in each site's embed tag — which Ekwa can do via their CMS template in one edit.
- For v1 (one site), this is simple. For scale, it's critical.

**Phase:** Phase 1 (widget build). Embed config pattern must be decided before the first deployment.

---

### Pitfall 11: Supabase Realtime / Live Queries in Dashboard Causing Unexpected Costs

**What goes wrong:** The admin dashboard is built with Supabase's realtime subscriptions (`.on('INSERT', ...)`) because it seems convenient for live lead notifications. Supabase realtime has connection limits and costs on paid plans. With many concurrent admin sessions or a misconfigured subscription that never unsubscribes, costs spike.

**Prevention:**
- For v1 (one admin, low traffic), use polling (a 30-second interval `fetch` in the dashboard) instead of realtime subscriptions. Simpler, zero extra cost, easier to debug.
- If realtime is added later, ensure subscriptions are cleaned up in `useEffect` return functions and scoped to the authenticated practice.

**Phase:** Phase 2 (dashboard data). Default to polling for v1.

---

## Minor Pitfalls

---

### Pitfall 12: Chat History Not Persisted on Page Refresh

**What goes wrong:** If a patient navigates away or refreshes, the chat window reopens empty. They have to re-explain their situation. For a 3-message FAQ session this is fine. For a mid-flow lead capture interrupted by a refresh, the lead is lost.

**Prevention:**
- Store the current session in `sessionStorage` (not `localStorage`) so it survives page refreshes within the same tab but clears when the tab closes.
- On widget init, check `sessionStorage` for an existing session ID and resume the conversation from the last message.
- Do not use `localStorage` — it persists indefinitely and a patient returning days later would see old chat history, which is confusing.

**Phase:** Phase 1 (widget build).

---

### Pitfall 13: Mobile Viewport Widget Covering Critical Page Content

**What goes wrong:** The floating widget button sits at `bottom: 20px; right: 20px`. On mobile, this overlaps the dental site's own "Book Appointment" CTA button or their phone number in the footer. The host site's conversion actions are blocked by the widget.

**Prevention:**
- Use `bottom: 70px` on mobile (to clear typical mobile bottom navigation areas and common CTA placements).
- Widget open state on mobile should be full-screen or near-full-screen, not a small floating window that partially obscures content.
- Test the widget on at least two different dental website templates (Ekwa uses templates) before launch.

**Phase:** Phase 1 (widget build). Mobile layout is part of the initial UI, not a polish step.

---

### Pitfall 14: Admin Route Not Protected by Middleware

**What goes wrong:** `/admin` and its subroutes are Next.js App Router pages with a Supabase session check inside the component. If the check is client-side only (inside `useEffect`), there is a flash of the protected content before the redirect fires. Worse, if the check is forgotten on one page, it's fully accessible without authentication.

**Prevention:**
- Use Next.js middleware (`middleware.ts`) to protect all `/admin/*` routes at the edge. Redirect to `/login` if no valid Supabase session cookie exists.
- Component-level checks are a secondary guard, not the primary one.
- Test by navigating directly to `/admin/leads` while logged out — the correct behavior is an immediate redirect with no content flash.

**Phase:** Phase 1 (admin auth setup). Middleware is the first thing built for the dashboard, before any dashboard pages.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Database schema migration | RLS disabled by default | Include RLS + policies in first migration file |
| Widget time gate | Browser timezone vs practice timezone | Use IANA timezone in embed config, test boundary times |
| Widget emergency handling | n8n miss → wrong response_type | Client-side keyword interception as defense layer |
| Widget embed bundling | Global scope pollution on host site | IIFE wrap + fully self-contained bundle |
| n8n webhook integration | Cold start timeouts | 15s+ timeout, retry logic, always-on plan verification |
| Lead capture flow | Form fires too early | Trigger only on lead_capture response_type, never during emergency |
| Dashboard queries | Missing practice_id filter | Every query scoped to authenticated practice from day one |
| KB update workflow | Placeholder tokens in production | Pre-flight checklist, post-update query validation |
| Deployment | n8n webhook URL hardcoded in bundle | data-attribute config pattern on embed script tag |
| Admin routes | Unprotected route on page miss | Next.js middleware protecting all /admin/* routes |

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — first-party source)
- Supabase RLS behavior: Based on training data from Supabase official documentation (MEDIUM confidence — verify current RLS default behavior at https://supabase.com/docs/guides/database/postgres/row-level-security)
- n8n cloud cold start behavior: Based on training data from n8n community forums and docs (LOW confidence — verify current n8n cloud plan tiers at https://n8n.io/pricing and confirm always-on behavior)
- CORS behavior for embedded scripts: Well-established browser standard (HIGH confidence)
- JavaScript timezone handling with `Intl.DateTimeFormat`: Well-established Web API standard (HIGH confidence)
- Next.js App Router middleware for auth: Based on training data from Next.js docs (MEDIUM confidence — verify at https://nextjs.org/docs/app/building-your-application/routing/middleware)
- Supabase realtime pricing: Based on training data (LOW confidence — verify current limits at https://supabase.com/pricing)
