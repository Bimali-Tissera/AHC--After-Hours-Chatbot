# Roadmap: After-Hours AI Lead Assistant

## Overview

Four phases delivering a working after-hours AI chatbot on ekwa.com. Phase 1 lays the Supabase schema and Next.js scaffold including admin auth — everything else depends on it. Phase 2 wires n8n to write real data into Supabase. Phase 3 builds both patient-facing surfaces (chat widget) and the admin dashboard in parallel. Phase 4 deploys to Vercel and validates the live system end-to-end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase schema with RLS, Next.js project scaffold, admin auth plumbing
- [ ] **Phase 2: n8n Integration** - Webhook trigger switch, Supabase write steps for chats/leads
- [ ] **Phase 3: Widget + Dashboard** - Chat widget (vanilla JS) and admin dashboard views in parallel
- [ ] **Phase 4: Deployment** - Vercel deploy, CORS validation, pre-launch checklist

## Phase Details

### Phase 1: Foundation
**Goal**: The database exists with correct structure and security, and the Next.js app can be run locally with an admin able to log in
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02, DB-03, DB-04, AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Supabase has all 5 tables (practices, chats, messages, leads, admins) with RLS enabled and Ekwa seed data present
  2. `npm run dev` starts the Next.js app without errors and /admin/login renders
  3. Admin can log in with email and password and land on a protected /admin route
  4. Navigating to /admin/* without a session redirects to /admin/login
  5. Admin can log out and is returned to /admin/login
**Plans:** 2/3 plans executed

Plans:
- [ ] 01-01-PLAN.md — Supabase schema SQL (5 tables + RLS policies) and seed data
- [ ] 01-02-PLAN.md — Next.js scaffold with Supabase clients and proxy.ts auth guard
- [ ] 01-03-PLAN.md — Admin auth flow (login, logout) and demo-ready dashboard shell

### Phase 2: n8n Integration
**Goal**: Every chat interaction writes real session, message, and lead data to Supabase — no more mock data
**Depends on**: Phase 1
**Requirements**: N8N-01, N8N-02, N8N-03, N8N-04
**Success Criteria** (what must be TRUE):
  1. Sending a test message via the n8n webhook (curl or Postman) returns a valid response_type and creates a row in the chats and messages tables in Supabase
  2. A conversation that triggers lead capture creates a row in the leads table with name, phone/email, and trigger question
  3. The Next.js /api/chat proxy route forwards a POST to n8n and returns the response — n8n webhook URL never appears in browser network tab
**Plans**: TBD

### Phase 3: Widget + Dashboard
**Goal**: A dental patient can chat with the AI after hours from ekwa.com, and a logged-in admin can see leads and conversations in the dashboard
**Depends on**: Phase 1 (dashboard auth), Phase 2 (real data)
**Requirements**: WIDG-01, WIDG-02, WIDG-03, WIDG-04, WIDG-05, WIDG-06, WIDG-07, WIDG-08, DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. The chat widget appears on a page only when the current time is outside Ekwa's business hours (practice timezone) and does not appear during business hours
  2. A patient can send a message and receive a FAQ answer, lead capture form, escalation response, or emergency phone number depending on the message content
  3. An emergency keyword in a message always shows the emergency phone number — even when n8n is unreachable
  4. The admin dashboard shows a leads list (name, phone, email, timestamp, trigger question) with a working CSV export
  5. Each lead in the dashboard links to the originating chat transcript
  6. The widget is usable on a 375px-wide mobile screen and the dashboard layout does not break on tablet width
**Plans**: TBD

### Phase 4: Deployment
**Goal**: The live Vercel deployment serves the admin dashboard and widget to real users, CORS works on an external domain, and the system passes pre-launch validation
**Depends on**: Phase 3
**Requirements**: DEPL-01, DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):
  1. The Next.js app is live on a Vercel URL with production environment variables set and /admin/login loads without errors
  2. The widget.js embed script, loaded from a plain HTML file on a different origin (e.g., localhost:9999), successfully sends a message and receives a response — no CORS errors in browser console
  3. The KB pre-flight checklist passes: no [PLACEHOLDER] tokens appear in Pinecone query responses for standard test questions
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/3 | In Progress|  |
| 2. n8n Integration | 0/? | Not started | - |
| 3. Widget + Dashboard | 0/? | Not started | - |
| 4. Deployment | 0/? | Not started | - |
