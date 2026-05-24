# Architecture Patterns

**Domain:** Embeddable AI chat widget + admin dashboard (dental after-hours lead assistant)
**Researched:** 2026-03-18
**Confidence:** HIGH (architecture pre-decided; patterns documented from established conventions)

---

## Recommended Architecture

The system has two distinct user-facing surfaces — the **chat widget** (embedded on client websites) and the **admin dashboard** (internal tool for practice staff) — sharing a single Next.js application and a single Supabase backend.

```
┌─────────────────────────────────────────────────────┐
│  Patient Browser (ekwa.com)                          │
│  ┌───────────────────────────────────────────────┐  │
│  │  Chat Widget (embedded <script> tag)           │  │
│  │  - Floating button + chat panel UI             │  │
│  │  - isAfterHours() time gate                    │  │
│  │  - POST /api/chat → n8n webhook                │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS POST (message + session_id)
                     ▼
┌────────────────────────────────────────────────────┐
│  n8n Cloud (AI Assistant Workflow)                  │
│  - Webhook trigger receives message                 │
│  - Queries Pinecone for relevant FAQ chunks         │
│  - Calls OpenAI to generate response                │
│  - Classifies response_type                         │
│    (faq | lead_capture | escalation | emergency)    │
│  - Writes chat + message to Supabase (Postgres)     │
│  - Returns JSON response to widget                  │
└───────────┬─────────────────────┬───────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────┐   ┌───────────────────────────────┐
│  Pinecone        │   │  Supabase (Postgres)           │
│  Vector Store    │   │  Tables:                       │
│  - FAQ chunks    │   │  - practices                   │
│  - Embeddings    │   │  - chats (sessions)            │
└─────────────────┘   │  - messages                    │
                       │  - leads                       │
                       │  - admins                      │
                       └───────────────┬────────────────┘
                                       │ Supabase JS client
                                       ▼
┌────────────────────────────────────────────────────┐
│  Next.js App (Vercel)                               │
│                                                     │
│  ├── /app/admin/*                                   │
│  │   - Dashboard stats overview                     │
│  │   - Conversations list + transcripts             │
│  │   - Leads list + CSV export                      │
│  │   - Protected by Supabase Auth middleware        │
│  │                                                  │
│  ├── /app/api/chat                                  │
│  │   - Thin proxy route: widget → n8n webhook       │
│  │   - Hides n8n webhook URL from browser           │
│  │                                                  │
│  └── /public/widget.js  (or /app/widget route)     │
│      - Self-contained bundle                        │
│      - Embeds as <script> on external sites         │
└────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Chat Widget (browser JS) | Renders floating UI, gates on after-hours check, sends messages, displays responses | Next.js `/api/chat` proxy route |
| Next.js `/api/chat` proxy | Receives widget POST, forwards to n8n webhook, returns response JSON | n8n webhook (outbound), Chat Widget (inbound) |
| n8n AI Assistant Workflow | AI logic: Pinecone query, OpenAI call, response_type classification, Supabase write | Pinecone (read), OpenAI API (read), Supabase (write), Next.js proxy (response) |
| Pinecone Vector Store | Semantic search over FAQ embeddings | n8n (read only) |
| OpenAI API | Generates chat responses from context + user message | n8n (read only) |
| Supabase Postgres | Persists all chat sessions, messages, leads | n8n (write), Next.js admin routes (read) |
| Supabase Auth | Admin identity and session management | Next.js admin middleware |
| Next.js Admin Routes | Reads Supabase, renders dashboard UI | Supabase Postgres (read), Supabase Auth |
| Vercel (hosting) | Serves Next.js app, widget bundle, API routes | Next.js app |

---

## Data Flow

### Patient Sends a Message (Primary Flow)

```
1. Patient visits ekwa.com after hours
2. Widget JS checks isAfterHours() → true → shows floating button
3. Patient opens chat, types message
4. Widget POSTs { session_id, message, timestamp } to Next.js /api/chat
5. /api/chat forwards POST to n8n webhook URL (server-side, URL stays hidden)
6. n8n workflow:
   a. Embeds message → queries Pinecone for top-k FAQ chunks
   b. Assembles prompt (system + FAQ context + conversation history + user message)
   c. Calls OpenAI chat completion
   d. Classifies response_type from response content
   e. Writes to Supabase: upsert chat row, insert message row, insert lead row if lead_capture
   f. Returns JSON: { response, response_type, session_id }
7. Next.js /api/chat returns JSON to widget
8. Widget renders assistant message, handles response_type:
   - faq → display answer
   - lead_capture → show contact form
   - escalation → show "call us" prompt
   - emergency → show emergency number prominently
```

### Admin Views Dashboard (Secondary Flow)

```
1. Admin navigates to /admin/login
2. Supabase Auth handles email/password → issues JWT session cookie
3. Next.js middleware checks auth on all /admin/* routes
4. Admin requests /admin/dashboard:
   a. Server component queries Supabase: aggregate stats (chat count, lead count, etc.)
   b. Renders stats cards, hourly traffic chart
5. Admin requests /admin/conversations:
   a. Queries chats + messages tables (JOIN)
   b. Renders list with expandable transcripts
   c. Admin clicks status toggle → writes status update back to Supabase
6. Admin requests /admin/leads:
   a. Queries leads table
   b. Renders list with CSV export button
   c. CSV export → client-side or API route generates CSV from Supabase data
```

### Knowledge Base Update Flow (Existing, Separate)

```
1. Admin updates FAQ document
2. Triggers n8n "Update KB" workflow manually (or via webhook)
3. n8n chunks document → generates embeddings via OpenAI → upserts into Pinecone
4. Chat widget now uses updated knowledge on next query (no app redeploy needed)
```

---

## Patterns to Follow

### Pattern 1: Embedded Script Widget Isolation

**What:** The chat widget JS bundle must be self-contained — no dependency on the host page's CSS, JS framework, or global scope. Wrap in an IIFE (Immediately Invoked Function Expression) or use Shadow DOM for style isolation.

**When:** Always — the widget runs on external sites (ekwa.com) that could have conflicting CSS or JS.

**Example:**
```javascript
// widget.js — self-contained IIFE
(function() {
  // All widget code scoped here
  // Mount into a dedicated container div
  const container = document.createElement('div');
  container.id = 'after-hours-widget-root';
  document.body.appendChild(container);
  // React/vanilla render into container
})();
```

### Pattern 2: API Proxy Route Hides Backend URL

**What:** The widget never calls n8n directly. All requests go through a Next.js API route that forwards to n8n. This hides the n8n webhook URL from browser network traffic and allows server-side secret injection (e.g., webhook auth token).

**When:** Always — exposing n8n webhook URLs in browser JS allows anyone to spam the workflow.

**Example:**
```typescript
// /app/api/chat/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data);
}
```

### Pattern 3: Session ID for Stateless Conversation

**What:** The widget generates a `session_id` (UUID) on chat open and includes it in every message POST. n8n uses this to group messages into a conversation thread in Supabase. The widget maintains in-memory message history for UI rendering; n8n maintains persistent history in Supabase.

**When:** Required — n8n webhook is stateless; session_id is the only way to correlate turns.

### Pattern 4: Supabase Row-Level Security (RLS) for Admin Data

**What:** Supabase tables have RLS policies that restrict reads/writes to authenticated admin users only. The n8n workflow uses a service role key (bypasses RLS) for writes. The Next.js admin app uses the anon key + user JWT for reads (respects RLS).

**When:** Always — prevents unauthenticated access to conversation data and leads.

### Pattern 5: Server Components for Dashboard Data Fetching

**What:** Admin dashboard pages use Next.js Server Components to query Supabase directly (server-side, no API round-trip). Avoids exposing Supabase service key to the browser.

**When:** For all read-only admin views (stats, conversations list, leads list).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling n8n Webhook Directly from Widget

**What:** Widget JS contains the n8n webhook URL and POSTs directly from the browser.

**Why bad:** Exposes the webhook URL publicly, enabling spam/abuse. Also makes it impossible to add server-side auth headers without a proxy.

**Instead:** Always route through Next.js `/api/chat` proxy.

### Anti-Pattern 2: Polling Supabase from Widget for Responses

**What:** Widget sends message, then polls Supabase every N seconds to check for a response row.

**Why bad:** Adds latency, hammers Supabase, complex error handling. n8n returns the response synchronously in the webhook response body — use that directly.

**Instead:** n8n returns response in the HTTP response to the webhook POST. Widget reads it from the API proxy response.

### Anti-Pattern 3: Storing OpenAI Conversation History in Widget State Only

**What:** Widget keeps the full message array in React state for context window, not persisted anywhere.

**Why bad:** Refreshing the page loses history. n8n can't reconstruct context for multi-turn conversations.

**Instead:** n8n queries recent messages from Supabase by `session_id` to rebuild context window for each turn. Widget just renders what it receives.

### Anti-Pattern 4: Global CSS in Widget Bundle

**What:** Widget's stylesheet uses generic class names (`.button`, `.container`) that bleed into or get overridden by the host page's CSS.

**Why bad:** Widget looks broken on some client sites; hard to debug.

**Instead:** Use scoped class names (BEM prefix or CSS Modules), or mount widget inside a Shadow DOM root to achieve full CSS isolation.

### Anti-Pattern 5: Blocking Widget Render on Auth Check

**What:** Widget checks admin auth or makes an authenticated API call before deciding whether to show.

**Why bad:** Widget is public-facing for patients, not admins. Any auth delay hurts UX for anonymous visitors.

**Instead:** Widget is fully public. Only `/admin/*` routes require auth. Time gate check (`isAfterHours()`) is pure client-side logic — no network call needed.

---

## Build Order (Dependencies)

The component dependency graph dictates a natural build sequence:

```
Phase 1: Supabase Schema
  └── Required by: n8n write step, admin dashboard (both depend on tables existing)

Phase 2: n8n Supabase Write Step
  └── Depends on: Phase 1 (tables must exist to write to)
  └── Required by: Dashboard (data must flow before dashboard can show anything real)

Phase 3: Chat Widget + API Proxy
  └── Depends on: n8n webhook already working (existing), Phase 2 (to persist chats)
  └── Can be built in parallel with Phase 4 once Phase 1+2 are done

Phase 4: Admin Auth + Dashboard Shell
  └── Depends on: Phase 1 (Supabase Auth uses same project), Phase 2 (data to display)
  └── Dashboard views depend on real data from Phase 2

Phase 5: Dashboard Feature Views
  └── Depends on: Phase 4 (auth shell), Phase 1 (table structure)
  └── Conversations, Leads, Stats all read from Supabase populated by Phase 2

Phase 6: Deployment
  └── Depends on: All phases complete
  └── Vercel env vars: N8N_WEBHOOK_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
```

**Critical path:** `Supabase schema → n8n write step → widget + dashboard (parallel) → deployment`

The single hard dependency is that Supabase tables must exist before anything else. Everything else flows from there.

---

## Scalability Considerations

| Concern | v1 (single practice) | Future (multi-tenant) |
|---------|----------------------|----------------------|
| Practice isolation | Single practice ID hardcoded | Add `practice_id` FK to all tables, RLS per practice |
| Widget customization | Single color/copy | Per-practice config table, widget loads config on init |
| n8n workflows | Single shared workflow | Separate workflows per practice, or practice_id param |
| Knowledge base | Single Pinecone namespace | Separate Pinecone namespace per practice |
| Admin users | Single admin per Supabase project | Supabase Auth with practice_id on user metadata |
| Traffic | Low (one site, after-hours only) | Rate limiting on /api/chat, n8n workflow queuing |

The v1 single-practice design does not foreclose multi-tenancy — the key is that all Supabase tables include a `practice_id` column from the start, even if it's always the same value in v1. Adding multi-tenant support later then becomes an RLS policy change rather than a schema migration.

---

## Key Integration Points (What Must Be Configured)

| Integration | Direction | Secret/Config | Notes |
|-------------|-----------|--------------|-------|
| Widget → Next.js proxy | HTTPS POST | None (public) | Rate limit recommended |
| Next.js proxy → n8n | HTTPS POST | `N8N_WEBHOOK_URL` (env var) | Consider n8n webhook auth header |
| n8n → Pinecone | Read | Pinecone API key in n8n credentials | Already configured |
| n8n → OpenAI | Read | OpenAI API key in n8n credentials | Already configured |
| n8n → Supabase | Write | Supabase service role key in n8n credentials | New — Phase 2 |
| Next.js admin → Supabase | Read | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | JWT-gated by Auth |
| Supabase Auth → Next.js | JWT validation | `SUPABASE_JWT_SECRET` or auto via client | Middleware handles |

---

## Sources

- Architecture pre-decided in project constraints (PROJECT.md) — HIGH confidence
- Embedded widget isolation patterns (IIFE, Shadow DOM) — standard industry practice as used by Intercom, Drift, Crisp — HIGH confidence from training knowledge
- n8n webhook-as-backend pattern — standard n8n usage; synchronous webhook response is documented n8n behavior — HIGH confidence from training knowledge
- Next.js API route proxy pattern — standard Next.js pattern for hiding backend URLs — HIGH confidence from training knowledge
- Supabase RLS + service role key separation — Supabase official documentation pattern — HIGH confidence from training knowledge
- Multi-tenant `practice_id` FK pattern — standard SaaS data modeling — HIGH confidence from training knowledge

**Note:** External research tools (WebSearch, WebFetch, Bash) were unavailable during this session. All findings are based on training knowledge and project context. Core patterns are well-established and unlikely to have changed materially. Confidence is HIGH for structural patterns; validate specific Supabase Auth middleware API against current Supabase docs before implementation.
