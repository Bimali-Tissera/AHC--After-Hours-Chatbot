# Requirements: After-Hours AI Lead Assistant

**Defined:** 2026-03-18
**Core Value:** After-hours website visitors get instant answers and the practice captures leads — no missed opportunities when the office is closed.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Database & Infrastructure

- [x] **DB-01**: Supabase schema created with all 5 tables (practices, chats, messages, leads, admins) per SUPABASE_SCHEMA.md
- [x] **DB-02**: Row Level Security (RLS) policies enabled on all tables from first migration — filter by practice_id
- [x] **DB-03**: Ekwa practice seed data inserted (hours, phone, address, insurance list, services)
- [x] **DB-04**: Next.js project initialized with App Router, TailwindCSS, @supabase/ssr, proxy.ts auth guard

### Authentication

- [ ] **AUTH-01**: Admin can log in with email and password via Supabase Auth
- [x] **AUTH-02**: /admin/* routes protected by proxy.ts — unauthenticated users redirected to login
- [ ] **AUTH-03**: Admin can log out from the dashboard

### Chat Widget

- [ ] **WIDG-01**: Floating chat UI rendered by embeddable vanilla JS script (IIFE/Shadow DOM isolated)
- [ ] **WIDG-02**: Widget only appears outside business hours — isAfterHours() uses practice timezone, not visitor timezone
- [ ] **WIDG-03**: Widget passes practice_id with every message (soft multi-tenant — data-attribute on script tag)
- [ ] **WIDG-04**: Messages POST to Next.js /api/chat proxy route (n8n webhook URL never exposed client-side)
- [ ] **WIDG-05**: Widget handles all response_types from n8n: faq, lead_capture, escalation, emergency
- [ ] **WIDG-06**: Client-side emergency keyword detection shows emergency phone number even if n8n is unavailable
- [ ] **WIDG-07**: Widget is mobile responsive — works on phone screens
- [ ] **WIDG-08**: Chat session tracked via UUID in sessionStorage — correlates multi-turn conversations

### Admin Dashboard

- [ ] **DASH-01**: Leads view — list of captured leads (name, phone, email, timestamp, trigger question)
- [ ] **DASH-02**: Each lead links to its originating chat conversation
- [ ] **DASH-03**: CSV export of leads list
- [ ] **DASH-04**: Dashboard filtered by practice_id (admin only sees their own practice data)

### n8n Integration

- [ ] **N8N-01**: n8n AI Assistant workflow switched from built-in chat trigger to standard webhook trigger
- [ ] **N8N-02**: n8n workflow writes chat session + messages to Supabase after each interaction
- [ ] **N8N-03**: n8n workflow writes lead data to Supabase when lead is captured
- [ ] **N8N-04**: Next.js /api/chat route proxies widget messages to n8n webhook and returns response

### Deployment

- [ ] **DEPL-01**: Next.js app deployed to Vercel
- [ ] **DEPL-02**: CORS configured correctly — widget works when embedded on external sites (cross-origin tested)
- [ ] **DEPL-03**: Environment variables configured (Supabase URL, anon key, service role key, n8n webhook URL)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Dashboard Expansion

- **DASH-05**: Stats overview — total chats, lead capture rate, emergency count, busiest hours bar chart (Recharts)
- **DASH-06**: Conversations view — list chat sessions, expandable transcripts, status management (Followed Up / Needs Attention)
- **DASH-07**: Filter conversations by status and date range
- **DASH-08**: Most common questions ranking

### Settings

- **SETT-01**: Admin can update practice hours (affects isAfterHours logic)
- **SETT-02**: Admin can update emergency phone number

### Auth Expansion

- **AUTH-04**: Admin can reset password via email link
- **AUTH-05**: Multi-practice admin roles (view multiple practices)

### Multi-Tenant

- **MT-01**: Full multi-tenant onboarding — create new practice, run KB workflow per namespace
- **MT-02**: Per-practice Pinecone namespace routing in n8n workflow
- **MT-03**: Practice-specific branding/theming on widget

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rebuilding n8n workflows | Already built and working — only adding webhook trigger + Supabase write step |
| Real-time chat / WebSocket | Webhook POST is sufficient for v1 chatbot interaction pattern |
| OAuth / social login | Email/password via Supabase Auth sufficient for internal admin tool |
| Live agent handoff | High complexity, not needed for after-hours use case |
| Appointment booking integration | Would require PMS integration — out of scope for v1 |
| HIPAA compliance engineering | Leads (name + phone) are not PHI for this use case — confirm with Ekwa legal |
| Custom component library | Clean minimal Tailwind is sufficient for internal dashboard |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| DB-04 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Pending |
| N8N-01 | Phase 2 | Pending |
| N8N-02 | Phase 2 | Pending |
| N8N-03 | Phase 2 | Pending |
| N8N-04 | Phase 2 | Pending |
| WIDG-01 | Phase 3 | Pending |
| WIDG-02 | Phase 3 | Pending |
| WIDG-03 | Phase 3 | Pending |
| WIDG-04 | Phase 3 | Pending |
| WIDG-05 | Phase 3 | Pending |
| WIDG-06 | Phase 3 | Pending |
| WIDG-07 | Phase 3 | Pending |
| WIDG-08 | Phase 3 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
