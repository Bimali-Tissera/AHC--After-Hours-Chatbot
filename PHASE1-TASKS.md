# Phase 1 — After-Hours AI Lead Assistant
## Task Registry & Status Audit

> **Instructions for Claude Code:**
> Read this file, then analyse the codebase to determine the status of each task.
> For every task, set the status to one of: `complete` | `in-progress` | `not-started` | `blocked`.
> Add a one-line `finding` under each task explaining what you found (or did not find) in the codebase.
> When done, print a summary table at the end with task ID, name, and status.

---

## How to audit each task

For each task below:
1. Look at the `check` hints — these tell you exactly what files or patterns to look for.
2. Set the `status` field based on what you find.
3. Write a short `finding` (one line max) describing what you found.

**Status definitions:**
- `complete` — code exists and matches the acceptance criteria
- `in-progress` — partial implementation found (file exists but incomplete)
- `not-started` — no relevant files or code found
- `blocked` — depends on a previous task that is not complete

---

## Section 1.1 — Database Foundation

### Task 1.1.i — Create 5-table schema with RLS
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Full DDL for practices, chats, messages, leads, admins tables with RLS enabled and practice_id-based SELECT policies.
- **check:**
  - File exists: `supabase/schema.sql`
  - Contains 5x `CREATE TABLE` statements
  - Contains 5x `ENABLE ROW LEVEL SECURITY`
  - Contains 5x `CREATE POLICY`
  - Every policy uses `(SELECT auth.uid())` (wrapped, not bare)

### Task 1.1.ii — Create seed SQL template
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Practice INSERT with placeholder tokens + admin row INSERT template.
- **check:**
  - File exists: `supabase/seed.sql`
  - Contains `INSERT INTO practices`
  - Contains `INSERT INTO admins`
  - Contains `RETURNING id`
  - Contains placeholder tokens: `[PRACTICE ADDRESS]`, `[MAIN PHONE NUMBER]`, `[EMERGENCY PHONE NUMBER]`

### Task 1.1.iii — Run schema + seed in Supabase dashboard ⚠️ BLOCKING
- **type:** manual (human action)
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** User runs schema.sql and seed.sql in Supabase dashboard SQL editor.
- **check:**
  - Cannot be verified from codebase alone
  - Check if `.env.local` exists and `NEXT_PUBLIC_SUPABASE_URL` is filled in (non-empty value = likely done)

---

## Section 1.2 — n8n Workflow & Supabase Integration

### Task 1.2.i — Set up n8n Supabase credentials
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Supabase project URL and service role key added to n8n credentials store.
- **check:**
  - Cannot be verified from codebase — this lives in n8n UI
  - Note as manual/external if no n8n export file found

### Task 1.2.ii — Build AI Agent node with OpenAI + Pinecone
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** AI Agent with Simple Memory, Pinecone vector store tool, and OpenAI chat model.
- **check:**
  - Look for any exported n8n workflow JSON in the repo (e.g. `n8n/`, `workflows/`, `*.json`)
  - If found, check for `AI Agent`, `Pinecone Vector Store`, `Simple Memory` node types

### Task 1.2.iii — Build Code in JavaScript node
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Parses AI agent output into: chat_id, practice_id, patient_message, ai_response, response_type, is_emergency, lead_captured, lead_name, lead_phone, lead_email, trigger_question.
- **check:**
  - Look for n8n workflow JSON export
  - If found, check for a `Code` node containing these field names

### Task 1.2.iv — Get + IF + Upsert logic for chats table
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Get node checks if session row exists → IF branches → Update (true) or Create (false). Prevents duplicate key errors.
- **check:**
  - Look for n8n workflow JSON export
  - If found, check for a Supabase Get node followed by an If node with true/false branches leading to Update and Create nodes targeting the `chats` table

### Task 1.2.v — Build messages table insert node
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Inserts a row into the messages table for every message exchange.
- **check:**
  - Look for n8n workflow JSON export
  - If found, check for a Supabase Create node targeting the `messages` table

### Task 1.2.vi — Lead capture IF + leads table insert
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** IF node checks response_type = "lead_capture" → inserts into leads table.
- **check:**
  - Look for n8n workflow JSON export
  - If found, check for an If node checking `response_type` equals `lead_capture`, with a true branch Supabase Create node targeting the `leads` table

### Task 1.2.vii — Update chats.lead_captured flag
- **type:** manual
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Sets chats.lead_captured = true when a lead is captured.
- **check:**
  - Look for n8n workflow JSON export
  - If found, check for a Supabase Update node targeting the `chats` table that sets `lead_captured` = true

### Task 1.2.viii — End-to-end workflow test ⚠️ BLOCKING
- **type:** checkpoint
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Full pipeline test: chat → n8n → chats row created → messages rows created → leads row inserted → lead_captured = true.
- **check:**
  - Cannot be verified from codebase
  - If all tasks 1.2.i–1.2.vii are complete, mark as `in-progress` (ready to test)

---

## Section 1.3 — Next.js Project Scaffold

### Task 1.3.i — Scaffold Next.js app with Supabase packages
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Next.js with TypeScript, Tailwind, App Router, src/ dir. Supabase packages installed.
- **check:**
  - File exists: `package.json`
  - `package.json` contains `"next"` in dependencies
  - `package.json` contains `"@supabase/supabase-js"`
  - `package.json` contains `"@supabase/ssr"`
  - Directory exists: `src/app/`
  - File exists: `.env.example` containing `NEXT_PUBLIC_SUPABASE_URL`
  - File exists: `.gitignore` containing `.env.local`

### Task 1.3.ii — Create Supabase server + browser clients
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Cookie-based SSR client and browser client for all Supabase queries.
- **check:**
  - File exists: `src/lib/supabase/server.ts`
  - Contains `createServerClient` from `@supabase/ssr`
  - Contains `export async function createClient()`
  - Contains `cookieStore.getAll()`
  - File exists: `src/lib/supabase/client.ts`
  - Contains `createBrowserClient` from `@supabase/ssr`
  - Contains `export function createClient()`

### Task 1.3.iii — Create proxy.ts auth guard
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Middleware at repo root. Validates JWT, redirects unauthenticated users from /admin/* to /admin/login.
- **check:**
  - File exists: `proxy.ts` at repo root (NOT inside src/)
  - Contains `export async function proxy(`
  - Contains `getClaims()` OR `getUser()` as documented fallback
  - Contains `startsWith('/admin')`
  - Contains redirect to `'/admin/login'`
  - Contains redirect to `'/admin/leads'` for authenticated users on login page
  - Contains `export const config` with matcher array
  - Does NOT contain `new NextResponse` after the createServerClient block

---

## Section 1.4 — Admin Auth Flow

### Task 1.4.i — Login page + server action
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Centered card login form. Server action calls signInWithPassword, redirects to /admin/leads on success.
- **check:**
  - File exists: `src/app/admin/login/page.tsx`
  - File exists: `src/app/admin/login/actions.ts`
  - `actions.ts` contains `signInWithPassword`
  - `actions.ts` contains `redirect('/admin/leads')`
  - `actions.ts` contains `redirect('/admin/login?error=`
  - `page.tsx` contains `formAction={login}`
  - `page.tsx` contains email and password input fields

### Task 1.4.ii — Logout server action
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** signOut() clears session and redirects to /admin/login.
- **check:**
  - File exists: `src/app/admin/logout/actions.ts`
  - Contains `signOut()`
  - Contains `redirect('/admin/login')`
  - Contains `revalidatePath`

### Task 1.4.iii — Admin layout with auth guard + sidebar
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Server component with getUser() guard. Sidebar with practice name, Leads nav, logout button.
- **check:**
  - File exists: `src/app/admin/layout.tsx`
  - Contains `supabase.auth.getUser()` (NOT getSession or getClaims)
  - Contains `redirect('/admin/login')`
  - Contains `"Leads"` nav item
  - Contains `"Log out"` button
  - Contains `formAction={logout}`
  - Contains `w-64` sidebar width
  - Contains `border-l-2 border-blue-600` active nav indicator

### Task 1.4.iv — Verify complete auth flow ⚠️ BLOCKING
- **type:** checkpoint
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Manual browser check of the full login/logout/redirect flow.
- **check:**
  - Cannot be verified from codebase
  - If tasks 1.4.i, 1.4.ii, 1.4.iii are all complete, mark as `in-progress` (ready for human verification)

---

## Section 1.5 — Leads Dashboard UI

### Task 1.5.i — Leads page with empty state
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Table shell with 5 columns and "No leads yet" empty state.
- **check:**
  - File exists: `src/app/admin/leads/page.tsx`
  - Contains `"Leads"` as h1 page title
  - Contains all 5 column headers: `"Name"`, `"Phone"`, `"Email"`, `"Trigger Question"`, `"Date"`
  - Contains `"No leads yet"` empty state text
  - Contains `colSpan={5}` on empty state row

### Task 1.5.ii — Wire leads page to Supabase
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Server component queries leads table filtered by practice_id from admin session.
- **check:**
  - `src/app/admin/leads/page.tsx` calls `createClient()` from `@/lib/supabase/server`
  - Contains a Supabase query selecting from the `leads` table
  - Query filters by `practice_id`
  - Renders real lead rows from query result (not just empty state)

### Task 1.5.iii — End-to-end demo: chat to dashboard ⚠️ BLOCKING
- **type:** checkpoint
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Full pipeline confirmed: n8n chat → Supabase → lead appears in /admin/leads.
- **check:**
  - Cannot be verified from codebase
  - If 1.2.viii and 1.5.ii are both complete, mark as `in-progress` (ready for human verification)

---

## Section 1.6 — UI Enhancements

### Task 1.6.i — Login page polish
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Practice logo/name above card, loading spinner on submit, password show/hide toggle, smooth error animation.
- **check:**
  - `src/app/admin/login/page.tsx` contains a loading/pending state (e.g. `useFormStatus` or `useState`)
  - Contains password visibility toggle button
  - Contains practice name or logo above the card
  - Contains a transition or animation class on the error banner

### Task 1.6.ii — Leads dashboard stats bar
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Metric cards above the table — total leads, leads today, leads this week, conversion rate.
- **check:**
  - `src/app/admin/leads/page.tsx` or a child component contains metric/stat cards
  - Contains at least one of: `total leads`, `today`, `this week`, `conversion`
  - Queries Supabase for aggregate counts

### Task 1.6.iii — Lead detail drawer
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Click a lead row to open a side drawer with full conversation context and "Mark as exported" action.
- **check:**
  - A drawer/slide-over component exists (e.g. `src/components/LeadDrawer.tsx` or similar)
  - Contains click handler on table rows
  - Contains `exported` field display and toggle action
  - Queries messages table for the selected chat_id

### Task 1.6.iv — Leads table search + date filter
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Search by name/phone/email. Date range filter on captured_at.
- **check:**
  - `src/app/admin/leads/page.tsx` or client component contains a search input
  - Contains a date range picker or date filter inputs
  - Search/filter state drives the Supabase query or client-side filter

### Task 1.6.v — Export to CSV
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Export visible leads as CSV. Mark exported = true in Supabase for each row.
- **check:**
  - Contains an "Export CSV" or "Export" button
  - Contains CSV generation logic (converting rows to comma-separated string or using a library)
  - Contains a Supabase Update call setting `exported = true`

### Task 1.6.vi — Sidebar enhancements
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** New leads badge count on nav, active route highlight, collapsible on mobile.
- **check:**
  - `src/app/admin/layout.tsx` or sidebar component contains a badge/count on the Leads nav item
  - Contains responsive classes for mobile sidebar (e.g. `md:flex`, `hidden`, hamburger menu)
  - Active route uses `usePathname()` for dynamic highlighting

### Task 1.6.vii — Embeddable chat widget
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Standalone /widget/[practiceId] route. Floating chat bubble. Connects to n8n webhook. Embeddable via script tag.
- **check:**
  - Directory exists: `src/app/widget/[practiceId]/`
  - Contains a chat bubble component with open/close toggle
  - Contains a message thread UI
  - Contains a fetch/POST call to n8n webhook URL
  - A script tag embed pattern exists (e.g. `public/widget.js` or documented in README)

### Task 1.6.viii — Chat widget UX polish
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Typing indicator, message timestamps, open/close animation, mobile-responsive, accessible keyboard nav.
- **check:**
  - Chat widget contains a typing indicator component (animated dots)
  - Contains timestamp display on messages
  - Contains CSS transition or animation for open/close
  - Contains `aria-` attributes for accessibility
  - Layout is mobile-responsive (no fixed pixel widths that break on small screens)

### Task 1.6.ix — Chat widget emergency state UI
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** When is_emergency = true, widget shows red banner with emergency phone number.
- **check:**
  - Chat widget checks `is_emergency` field in AI response
  - Contains a red/danger banner component rendered conditionally
  - Banner displays the practice emergency phone number
  - Emergency phone is sourced from practice data (not hardcoded)

### Task 1.6.x — Real-time leads update (Supabase Realtime)
- **type:** auto
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Admin dashboard subscribes to Supabase Realtime on leads table. New leads appear instantly.
- **check:**
  - A client component in the leads page uses `supabase.channel()` or `.on('postgres_changes', ...)`
  - Subscribes to INSERT events on the `leads` table
  - Adds new rows to local state without page refresh
  - New row has an animation or highlight on insertion

### Task 1.6.xi — UI enhancements visual review ⚠️ BLOCKING
- **type:** checkpoint
- **status:** `not-started`
- **finding:** _TODO_
- **purpose:** Human reviews all enhanced UI states end-to-end.
- **check:**
  - Cannot be verified from codebase
  - If tasks 1.6.i through 1.6.x are all complete, mark as `in-progress` (ready for human review)

---

## Audit Summary

> **Claude Code: replace the table below with your findings after analysing the codebase.**

| Task ID | Name | Status | Blocking? |
|---------|------|--------|-----------|
| 1.1.i | Create 5-table schema with RLS | `not-started` | no |
| 1.1.ii | Create seed SQL template | `not-started` | no |
| 1.1.iii | Run schema + seed in Supabase | `not-started` | ⚠️ yes |
| 1.2.i | Set up n8n Supabase credentials | `not-started` | no |
| 1.2.ii | Build AI Agent node | `not-started` | no |
| 1.2.iii | Build Code in JavaScript node | `not-started` | no |
| 1.2.iv | Get + IF + Upsert for chats | `not-started` | no |
| 1.2.v | Messages table insert node | `not-started` | no |
| 1.2.vi | Lead capture IF + leads insert | `not-started` | no |
| 1.2.vii | Update chats.lead_captured flag | `not-started` | no |
| 1.2.viii | End-to-end workflow test | `not-started` | ⚠️ yes |
| 1.3.i | Scaffold Next.js app | `not-started` | no |
| 1.3.ii | Supabase server + browser clients | `not-started` | no |
| 1.3.iii | proxy.ts auth guard | `not-started` | no |
| 1.4.i | Login page + server action | `not-started` | no |
| 1.4.ii | Logout server action | `not-started` | no |
| 1.4.iii | Admin layout + sidebar | `not-started` | no |
| 1.4.iv | Verify auth flow | `not-started` | ⚠️ yes |
| 1.5.i | Leads page with empty state | `not-started` | no |
| 1.5.ii | Wire leads page to Supabase | `not-started` | no |
| 1.5.iii | End-to-end demo: chat to dashboard | `not-started` | ⚠️ yes |
| 1.6.i | Login page polish | `not-started` | no |
| 1.6.ii | Leads stats bar | `not-started` | no |
| 1.6.iii | Lead detail drawer | `not-started` | no |
| 1.6.iv | Search + date filter | `not-started` | no |
| 1.6.v | Export to CSV | `not-started` | no |
| 1.6.vi | Sidebar enhancements | `not-started` | no |
| 1.6.vii | Embeddable chat widget | `not-started` | no |
| 1.6.viii | Chat widget UX polish | `not-started` | no |
| 1.6.ix | Chat widget emergency state | `not-started` | no |
| 1.6.x | Real-time leads update | `not-started` | no |
| 1.6.xi | UI enhancements visual review | `not-started` | ⚠️ yes |

---

_This file is the source of truth for Phase 1 task status. Update the `status` and `finding` fields after each audit run._
