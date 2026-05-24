---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — greenfield project; Wave 0 installs build check |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual smoke test of auth flow
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DB-01 | manual/SQL | `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` | N/A | ⬜ pending |
| 1-01-02 | 01 | 1 | DB-02 | manual/SQL | `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` | N/A | ⬜ pending |
| 1-01-03 | 01 | 1 | DB-03 | manual/SQL | `SELECT * FROM practices;` | N/A | ⬜ pending |
| 1-02-01 | 02 | 1 | DB-04 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | AUTH-01 | manual | Manual browser: login → /admin/leads | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | AUTH-02 | manual | Manual browser: clear cookies → /admin/leads → redirect | ❌ W0 | ⬜ pending |
| 1-03-03 | 03 | 2 | AUTH-03 | manual | Manual browser: logout → /admin/login | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm run build` — available via create-next-app scaffolding (no extra install needed)
- [ ] Supabase dashboard SQL editor — used for DB verification (no install needed)

*Existing infrastructure covers automated build checks. DB and auth verification is manual via Supabase dashboard and browser.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 5 tables exist with correct columns | DB-01 | Schema created via Supabase dashboard SQL editor | Run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` in SQL editor — expect practices, chats, messages, leads, admins |
| RLS enabled on all tables | DB-02 | RLS is a database-level setting | Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` — all 5 should show `true` |
| Seed data present | DB-03 | Data inserted via dashboard | Run `SELECT * FROM practices;` — expect Ekwa practice row |
| Login with valid credentials | AUTH-01 | Requires real Supabase auth user | Navigate to /admin/login, enter valid credentials, verify redirect to /admin/leads |
| Route protection | AUTH-02 | Requires browser session state | Clear cookies, navigate to /admin/leads, verify redirect to /admin/login |
| Logout flow | AUTH-03 | Requires active session | Click logout button, verify redirect to /admin/login, verify /admin/leads now redirects |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
