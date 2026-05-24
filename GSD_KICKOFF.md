# GSD Session Kickoff — After Hours AI Lead Assistant
> Paste this as your first message to Claude Code after opening the project folder.
> Then run the GSD commands listed at the bottom.

---

## Briefing for Claude Code

I am working on the **After-Hours AI Lead Assistant** for Ekwa Marketing — a dental industry SaaS product.

Please read these files before we begin (they are in this folder):
- `PROJECT_CONTEXT.md` — Full project overview, architecture, and goals
- `SUPABASE_SCHEMA.md` — Existing database schema (already created, do not modify)
- `N8N_WORKFLOWS.md` — Existing n8n workflows (already built, do not recreate)

### Key facts to remember:
- The n8n workflows (chatbot) are DONE. Do NOT touch them.
- Supabase is NOT set up yet — tables need to be created from scratch using `SUPABASE_SCHEMA.md`
- We are building the **Next.js frontend** — specifically:
  1. **Admin Dashboard** (primary focus) — password-protected, reads from Supabase directly
  2. **Chat Widget** (secondary) — patient-facing, connects to n8n
- Stack: Next.js (App Router), TailwindCSS, Supabase JS client
- Do NOT modify the n8n workflows
- The n8n AI Assistant workflow will also need a Supabase write step added (Phase 3) — but that comes later

---

## GSD Commands to Run (in order)

```
# Step 1 — Map the existing codebase (if repo has existing Next.js code)
/gsd:map-codebase

# Step 2 — Initialize the project with GSD
/gsd:new-project

# When asked about the project, provide context from PROJECT_CONTEXT.md

# Step 3 — Discuss Phase 1 (Admin Dashboard)
/gsd:discuss-phase 1

# Step 4 — Plan Phase 1
/gsd:plan-phase 1

# Step 5 — Execute
/gsd:execute-phase 1
```

---

## Suggested Phase Breakdown (propose this to GSD during new-project)

**Phase 1 — Supabase Setup + Admin Dashboard Core**
- Create Supabase tables (practices, chats, messages, leads, admins) using schema in `SUPABASE_SCHEMA.md`
- Supabase Auth login page for admins
- Dashboard home: stats overview (total chats, lead capture rate, emergency count, busiest hours chart)
- Conversations view: list of chat sessions, expandable transcripts, status management (Followed Up / Needs Attention)
- Leads view: list of captured leads, CSV export

**Phase 2 — Chat Widget**
- Floating chat widget (Next.js component)
- `isAfterHours()` time gate — only shows after 5 PM weekdays and weekends
- Connects to n8n webhook
- Handles all response_types (faq, lead_capture, escalation, emergency)
- Mobile responsive

**Phase 3 — n8n Storage Integration + Polish**
- Add Supabase write step to n8n AI Assistant workflow (store chats + leads)
- Connect dashboard to real live data
- FAQ placeholders replaced with real practice data
- Demo video prep
- Deployment to Vercel
