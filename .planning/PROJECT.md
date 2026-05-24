# After-Hours AI Lead Assistant

## What This Is

An AI-powered chatbot for dental practice websites that activates only outside business hours (after 5 PM weekdays and all weekends). It answers patient FAQs instantly using a knowledge base of dental practice information and captures leads from after-hours visitors who would otherwise bounce. Built as a product for Ekwa Marketing — starting on ekwa.com, then rolling out to all dental clients.

## Core Value

After-hours website visitors get instant answers to their dental questions and the practice captures their contact info as leads — no missed opportunities when the office is closed.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ n8n "Update KB" workflow — chunks FAQ doc, stores vector embeddings in Pinecone — existing
- ✓ n8n "AI Assistant" workflow — receives messages, queries Pinecone, responds via OpenAI — existing
- ✓ Pinecone vector store — populated with FAQ embeddings from Dental_FAQ_Knowledge_Base_v1.docx — existing
- ✓ FAQ Knowledge Base — structured Q&A across 6 categories (Insurance, Hours, Services, Pricing, Emergency, Appointments) — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Supabase database — create tables (practices, chats, messages, leads, admins) per schema
- [ ] Admin authentication — Supabase Auth email/password login for practice admins
- [ ] Dashboard stats overview — total chats, lead capture rate, emergency count, busiest hours chart
- [ ] Conversations view — list chat sessions, expandable transcripts, status management (Followed Up / Needs Attention)
- [ ] Leads view — list captured leads with CSV export
- [ ] Chat widget — floating UI embedded as JS script on ekwa.com
- [ ] After-hours time gate — isAfterHours() check, only shows widget outside business hours
- [ ] Chat-to-n8n integration — widget POSTs to n8n webhook endpoint, handles all response_types (faq, lead_capture, escalation, emergency)
- [ ] Mobile responsive — both chat widget and admin dashboard
- [ ] n8n Supabase write step — add storage step to AI Assistant workflow to persist chats + leads to Supabase
- [ ] Deployment — Vercel for Next.js frontend

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Multi-tenant / multi-practice support — v1 is single-practice on ekwa.com only
- Rebuilding n8n workflows — already done, only adding Supabase write step
- Settings page (update hours, emergency number) — nice-to-have for future
- Real-time chat (WebSocket) — webhook POST is sufficient for v1
- OAuth / social login — email/password via Supabase Auth is sufficient
- Custom branding per practice — single-practice v1, no theming needed

## Context

**Client:** Ekwa Marketing builds websites for dental practices. They have a standard chatbot on all client sites. This project is a smarter after-hours replacement.

**Existing infrastructure:**
- n8n cloud — two workflows already running (Update KB → Pinecone, AI Assistant → Pinecone + OpenAI → response)
- Pinecone — vector store with dental FAQ embeddings
- OpenAI API — used by n8n for chat model and embeddings
- The AI Assistant workflow currently uses n8n's built-in chat trigger — needs to be switched to a standard webhook trigger for the custom chat widget to POST directly

**FAQ Knowledge Base** covers 6 categories with placeholders still to replace:
- `[PRACTICE ADDRESS]`, `[EMERGENCY PHONE NUMBER]`, `[MAIN PHONE NUMBER]`
- Actual insurance list, hours, and services need to be confirmed per practice

**Success metrics:**
- 80% FAQ accuracy
- 15%+ lead capture rate from after-hours visitors
- 100% emergency response accuracy
- Dashboard data accuracy 100%

## Constraints

- **Tech stack**: Next.js (App Router), TailwindCSS (clean minimal, no component library), Supabase (Auth + Postgres), n8n (backend logic)
- **Architecture**: n8n handles all backend/AI logic — no custom Express/API server
- **Embedding**: Chat widget delivered as embedded JS script (like Intercom/Drift)
- **Single app**: One Next.js project — /admin routes for dashboard, chat widget component for embedding
- **Deploy**: Vercel for Next.js frontend, n8n cloud, Supabase cloud, Pinecone cloud
- **Do not modify**: n8n workflows (except adding Supabase write step in Phase 3)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| n8n-based architecture (not custom backend) | n8n workflows already built and working; avoids rebuilding AI logic | — Pending |
| Switch n8n trigger to webhook | Built-in chat trigger doesn't support custom widget POST; webhook gives clean API | — Pending |
| Single Next.js app for dashboard + widget | Simpler deployment, shared Supabase client, one codebase | — Pending |
| Supabase Auth for admin login | Scales to multi-tenant later; built-in email/password flow | — Pending |
| Embedded script delivery for widget | Matches how Ekwa deploys scripts on client sites (like Intercom) | — Pending |
| Single-practice for v1 | Prove concept on ekwa.com first before multi-tenant complexity | — Pending |
| Clean minimal Tailwind (no component library) | Internal tool for practice staff, speed over polish | — Pending |

---
*Last updated: 2026-03-18 after initialization*
