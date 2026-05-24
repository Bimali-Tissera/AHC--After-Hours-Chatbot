# Feature Landscape

**Domain:** Dental practice AI chatbot / after-hours lead assistant + admin dashboard
**Researched:** 2026-03-18
**Confidence note:** External research tools (WebSearch, WebFetch) were unavailable for this session. All findings draw from training-data knowledge of competitor products (Podium, Weave, PatientPop, Drift, Intercom, Dentrix Ascend Chat, NexHealth, and similar) through August 2025. Confidence levels reflect that limitation.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| After-hours time gate | Core premise — chatbot should only appear outside office hours. Showing during hours creates confusion with staff handling inquiries. | Low | isAfterHours() check; compare against configured hours per timezone. Already planned in PROJECT.md. |
| Floating chat widget (embedded JS) | Standard delivery mechanism for site overlays — exactly how Intercom, Drift, Podium work. Practice staff expect drop-in scripts. | Medium | Single `<script>` tag; loads widget async. Ekwa already deploys scripts this way. |
| FAQ answer via knowledge base | Primary value proposition. Patients expect instant answers to "Do you accept Delta Dental?", "What are your hours?", "Do you do implants?" without waiting until morning. | Medium | RAG pipeline via Pinecone + OpenAI already exists. Accuracy target: 80%+. |
| Lead capture (name + phone/email) | Every competing product (Podium, Weave, NexHealth) captures contact info before or during conversation. A visitor who asks 3 questions and leaves without a name = missed opportunity. | Medium | Must be triggered at the right moment — not on message 1, but after engagement. PROJECT.md already plans this. |
| Emergency escalation / triage | Dental emergencies (broken tooth, severe pain, abscess, knocked-out tooth) are medical situations. Failing to distinguish them from routine FAQs is a liability and a patient safety issue. All dental chatbot competitors have this. | Low | Hardcoded keywords + LLM classification; show emergency phone + after-hours dentist info. 100% accuracy target is correct. |
| Chat transcript storage | Admins need to review what the bot said, catch errors, and follow up. No transcript = no accountability and no QA loop. | Low | Supabase messages table. Already planned. |
| Admin login / authentication | Dashboard exposes patient names and contact info — must be gated. Email/password minimum. | Low | Supabase Auth. Already planned. |
| Leads list view | The core deliverable for the practice — a list of who contacted them after hours. Must be reviewable the next morning. | Low | Table with name, phone/email, timestamp, conversation summary. Already planned. |
| Dashboard stats overview | Practice managers want to know "Is this working?" Total chats, lead rate, emergency count. | Medium | Aggregation queries on Supabase. Already planned. |
| Conversation list with transcripts | Staff follow up on overnight conversations. Need to see full context before calling a lead. | Low | Expandable transcript rows. Already planned. |
| Mobile-responsive widget | 60-70% of dental website traffic is mobile. A widget that breaks on iOS/Android loses most of its value. | Low | Tailwind responsive classes. Already planned. |
| Mobile-responsive dashboard | Practice managers check overnight activity from phones the next morning. | Low | Same as above — Tailwind handles this if designed mobile-first. |
| CSV export of leads | Practices import leads into their CRM or PMS (Dentrix, Eaglesoft, etc.) manually. CSV is the universal connector. | Low | Single query + file stream. Already planned. |
| "Not available right now" fallback | When the bot cannot answer, it should not hallucinate. It should acknowledge the limit and still offer to take contact info. | Low | n8n workflow `escalation` response_type handles this. |

---

## Differentiators

Features that set this product apart from generic chatbots. Not expected by default, but meaningfully valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dental-domain FAQ accuracy | Generic chatbots answer vaguely. This chatbot answers "Do you accept MetLife?" with the actual answer from the practice's real insurance list. That specificity is the differentiator. | Medium | Depends entirely on knowledge base quality. The Dental_FAQ_Knowledge_Base_v1.docx must be populated with real practice data before go-live. |
| Emergency protocol response | Unlike generic chatbots that say "call your dentist," this one recognizes dental emergency keywords (abscess, knocked-out tooth, severe swelling) and responds with the practice's specific after-hours emergency number plus actionable guidance. Liability-aware, not generic. | Low | Already in FAQ KB under Emergency category. Critical to get right. |
| Conversation status management (Followed Up / Needs Attention) | Lets front-desk staff mark leads as actioned, preventing double-calls and missed follow-ups. Generic admin panels don't have workflow state. | Low | Status enum on chat_sessions table. Already planned. |
| Busiest hours chart | Shows when after-hours traffic peaks — which nights, which hours. Helps practice understand their actual patient behavior patterns. Not just "we got 5 chats" but "we get 3 chats every Sunday between 8-10 PM." | Medium | Aggregation by hour-of-week on Supabase. Already planned. |
| Lead capture rate metric | Showing "15% of after-hours visitors became leads" is a concrete ROI number Ekwa can use with clients. Generic chatbots don't surface this. | Low | (total leads / total chat sessions) * 100 — simple calculation. Already planned. |
| Contextual lead capture trigger | Capture contact info at the right moment (after engagement, before the patient leaves or asks to book) rather than a cold popup on first message. Improves both conversion rate and user experience. | Medium | n8n `lead_capture` response_type handles this via conversation flow logic. |
| Knowledge base that can be updated by Ekwa | Practices update their insurance lists, add new services, change hours. An updateable KB (the existing n8n Update KB workflow) means the bot stays accurate without a developer touching it. | Medium | Already exists (n8n + Pinecone). This is genuinely rare in simple chatbot products. |
| Per-lead conversation link in dashboard | Each lead row links directly to the full conversation that generated it — click a lead, see exactly what the patient asked. Eliminates context-switching between leads list and conversations list. | Low | Foreign key join, clickable row in dashboard. Not explicitly planned — worth adding. |

---

## Anti-Features

Features to deliberately NOT build in v1. Each has a reason.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time chat (WebSocket / live handoff) | Adds significant infrastructure complexity (socket server, presence tracking, reconnection handling). During after-hours, there is no staff to receive a handoff anyway — the whole point is the office is closed. | Webhook POST + async response is sufficient. Re-evaluate for v2 if live handoff becomes a requirement. |
| Appointment booking integration | Connecting to Dentrix, Eaglesoft, or Curve Dental requires PMS-specific OAuth + API work per system. Each practice uses a different PMS. This is a multi-sprint project on its own. | Capture lead + intent ("wants to book a cleaning"), staff books manually the next morning. |
| Multi-tenant / multi-practice support | Adds auth layer, data isolation, per-practice config UI, billing — easily doubles the scope. v1 must prove the concept first. | Single-practice on ekwa.com. Design DB schema to be tenant-ready (practices table already planned) without building the full tenant UI. |
| Settings page (update hours, emergency number) | Nice-to-have but shifts scope from "does this work" to "is this configurable." The FAQ KB covers hours; emergency number is in the KB. | Ekwa staff update the KB document directly via the existing Update KB workflow. Revisit in v2. |
| SMS/email notifications to admins | Notifying the dentist at 11 PM when a lead comes in adds Twilio/SendGrid integration, opt-in flows, and notification preferences. Out of scope for v1. | Admins review dashboard the next morning. Emergency escalation already shows the emergency phone number to the patient — no need to alert the dentist via the bot. |
| Sentiment analysis / patient satisfaction scores | Interesting analytics but no immediate operational value. Adds LLM cost per conversation and complexity without helping the practice follow up on leads. | Leave for v2 if there is demand. |
| Custom branding / white-labeling per practice | Theming engine (colors, logo, widget position) is a UI configuration feature. v1 is one practice — one set of styles hardcoded in Tailwind. | Single brand. Multi-tenant theming is a v2 feature if Ekwa rolls this out to all clients. |
| Payment / deposit collection | Out of scope for a lead-capture chatbot. Introduces PCI compliance surface area. | Not applicable to this use case. |
| HIPAA-compliant message encryption / BAA | A dental chatbot discussing "do you accept my insurance" is not collecting PHI. Names + phone numbers for lead capture are not PHI under HIPAA. Over-engineering this for v1 creates compliance theater. | Standard Supabase Postgres with RLS. If collecting SSN, DOB, or treatment records ever becomes a requirement, revisit. |

---

## Feature Dependencies

```
After-hours time gate
  → Chat widget (gate controls widget visibility)

Chat widget
  → Chat-to-n8n integration (widget POSTs to webhook)
  → Lead capture (widget collects the form input)

Chat-to-n8n integration
  → FAQ answers (n8n queries Pinecone, returns faq response_type)
  → Lead capture trigger (n8n returns lead_capture response_type)
  → Emergency escalation (n8n returns emergency response_type)
  → Escalation fallback (n8n returns escalation response_type)

n8n Supabase write step
  → Chat transcript storage (writes messages to Supabase)
  → Lead storage (writes lead record to Supabase)

Supabase database
  → Admin authentication (Supabase Auth requires DB)
  → Dashboard stats (queries require data)
  → Conversations view (requires messages table)
  → Leads view (requires leads table)
  → CSV export (requires leads table)
  → Conversation status management (requires status column on chat_sessions)

Dashboard stats
  → Busiest hours chart (sub-feature of stats)
  → Lead capture rate metric (sub-feature of stats)

Leads view
  → CSV export (export is a feature of the leads view)
  → Per-lead conversation link (links from leads view to conversation detail)
```

---

## MVP Recommendation

**Prioritize (v1 must-haves):**

1. After-hours time gate + chat widget (without these, nothing else runs)
2. Chat-to-n8n integration with all 4 response_types (faq, lead_capture, emergency, escalation)
3. n8n Supabase write step (persists everything downstream)
4. Supabase schema + admin auth (unlocks the entire dashboard)
5. Leads view with CSV export (primary deliverable for the practice)
6. Conversations view with transcripts and status management
7. Dashboard stats: total chats, lead rate, emergency count, busiest hours chart
8. Emergency escalation with practice emergency number

**Defer to v2:**

- Per-lead conversation link (nice-to-have, adds minor complexity)
- Settings page for hours/emergency number config
- SMS/email admin notifications
- Multi-practice / tenant support
- Appointment booking integration

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes features | MEDIUM | Based on training-data knowledge of competitor products (Podium, Weave, NexHealth, PatientPop) through August 2025. No live competitor verification possible this session. |
| Differentiators | MEDIUM | Drawn from understanding of what generic chatbots lack vs. dental-specific tools. Domain reasoning is sound but not verified against current market. |
| Anti-features / scope cuts | HIGH | Drawn directly from PROJECT.md explicit out-of-scope decisions + standard scope management principles. Less dependent on market research. |
| Feature dependencies | HIGH | Derived from the technical architecture described in PROJECT.md — these are factual system dependencies, not market claims. |

---

## Sources

- PROJECT.md — primary source for scope, constraints, existing infrastructure, and out-of-scope decisions
- Training-data knowledge of dental chatbot / patient engagement SaaS products: Podium, Weave, PatientPop, NexHealth, Dentrix Ascend, Intercom, Drift (through August 2025)
- Note: WebSearch and WebFetch were unavailable during this research session. Claims marked MEDIUM confidence should be validated against current competitor product pages before roadmap finalization.
