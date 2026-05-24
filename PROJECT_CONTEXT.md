# After-Hours AI Lead Assistant — Project Context
> Feed this file to Claude Code before running `/gsd:new-project` or `/gsd:map-codebase`

---

## What Is This Project?

**Ekwa Marketing** builds websites for dental practices. They already have a standard chatbot on all client sites. This project is a new **After-Hours AI Lead Assistant** — an intelligent chatbot that activates only when the dental office is closed (after 5 PM on weekdays and all weekend).

The goal: instead of after-hours visitors bouncing or waiting for a callback form, the AI answers their FAQs instantly and captures leads.

**Phase 1 target:** Build and validate on the Ekwa website itself (`ekwa.com`) first. If it works well, roll it out as a product to all dental clients. Eventually expand beyond dental to other practice types.

---

## Current State of the Project

### ✅ Already Built
- **n8n workflow 1 — "Update KB"**: Chunks the FAQ knowledge base document and stores vector embeddings into **Pinecone** vector store (NOT Supabase). This enables semantic similarity search when answering patient questions.
- **n8n workflow 2 — "AI Assistant"**: The core chatbot logic — receives patient messages, performs vector similarity search on Pinecone to retrieve relevant FAQ chunks, builds a structured prompt, sends to Claude API, classifies the response (FAQ / Lead Capture / Escalation / Emergency), returns response to frontend.
- **Pinecone vector store**: Already set up and populated with FAQ chunks from `Dental_FAQ_Knowledge_Base_v1.docx`
- **FAQ Knowledge Base**: `Dental_FAQ_Knowledge_Base_v1.docx` — structured Q&A across 6 categories (Insurance, Hours & Location, Services, Pricing, Emergency, Appointments)

### 🔲 Not Yet Built
- **Supabase database**: NOT set up yet — tables need to be created (`practices`, `chats`, `messages`, `leads`, `admins`)
- **Chat Widget** (patient-facing frontend) — the floating chat UI that appears after hours
- **Admin Dashboard** (practice admin frontend) — password-protected, shows transcripts, stats, lead management
- Connecting the frontend to the existing n8n workflows via webhook
- Updating n8n AI Assistant workflow to also **write** chat + lead data to Supabase (currently it only reads from Pinecone and responds — storage to Supabase needs to be added)

---

## Architecture

**Chosen Architecture: Option 2 (n8n-based)**

```
Patient Browser
     │
     │ (after 5 PM / weekends only — JS time check)
     ▼
Chat Widget (Next.js)
     │ POST /chat
     ▼
n8n AI Agent  ──────────── Pinecone Vector Store (FAQ retrieval)
     │                         │ OpenAI Embeddings (for vector search)
     │                    OpenAI Chat Model (AI responses)
     │                    Simple Memory (conversation context)
     ▼
Supabase (Postgres)  ← TO BE SET UP
  - practices             (n8n writes chat + leads here)
  - chats
  - messages
  - leads
  - admins
     │
     ▼
Admin Dashboard (Next.js)  ← practice staff log in here
```

### Key Design Decisions
- **n8n handles all backend logic** — no custom Express/API server needed
- **Pinecone** stores FAQ vector embeddings — n8n queries it for semantic FAQ retrieval
- **OpenAI API** is the AI brain — the n8n AI Agent uses OpenAI Chat Model for responses, and OpenAI Embeddings for Pinecone vector search
- **Supabase** will be the single source of truth for chat transcripts, leads, and admin auth (needs to be created)
- **Next.js** for both the chat widget and the admin dashboard
- **Smart JS toggle** on the chat widget: checks `isAfterHours()` before showing the AI chatbot
- **Emergency handling is rule-based** — keyword detection triggers immediate emergency number surfacing

---

## n8n Workflow Logic (AI Assistant Flow)

1. Receive webhook POST `/chat` with patient message
2. Check for emergency keywords → if yes, immediately return emergency number + log case
3. Fetch relevant FAQs from Supabase
4. Build structured prompt → send to Claude API
5. Receive JSON response with `response_type`: `faq` | `lead_capture` | `escalation`
6. Based on type:
   - `faq` → return answer directly
   - `lead_capture` → ask for contact details
   - `escalation` → offer callback form
7. Store chat transcript in Supabase
8. Store lead if captured
9. Return final response to frontend

---

## Admin Dashboard — Requirements (What Needs to Be Built)

This is the **primary focus** of the next development phase.

### Access
- Password-protected login (use Supabase `admins` table for auth)
- Each practice admin only sees their own practice's data

### Views & Features

**1. Conversations View**
- List of all chat sessions (date, time, visitor identifier, status)
- Click to expand and read full transcript
- Mark as "Followed Up" or "Needs Attention"
- Filter by status / date range

**2. Stats Overview (Dashboard Home)**
- Total chats today / this week / this month
- Questions answered (FAQ responses) vs leads captured
- Most common questions asked (ranked list)
- Busiest hours for chat activity (hour-by-hour bar chart)
- Emergency cases flagged

**3. Leads View**
- List of captured leads (name, phone, timestamp, question that triggered lead capture)
- Export to CSV

**4. Settings (nice to have / future)**
- Update practice hours (affects `isAfterHours()` logic)
- Update emergency phone number

### Tech Stack for Dashboard
- **Next.js** (App Router preferred)
- **Supabase JS client** for data fetching + auth
- **TailwindCSS** for styling
- Keep it clean and simple — this is an internal tool for practice staff, not a public-facing product

---

## FAQ Knowledge Base Summary

The `Dental_FAQ_Knowledge_Base_v1.docx` contains structured Q&A across 6 categories:

| Category | Key Topics |
|---|---|
| Insurance | Accepted plans (Delta Dental, Cigna, Aetna, MetLife, BCBS), uninsured patients, in-network verification |
| Hours & Location | Office hours (Mon–Fri 8–5), weekend availability, address/directions |
| Services | Whitening, broken tooth repair, Invisalign, implants, family/pediatric care |
| Pricing | Cleaning costs, X-ray costs, payment plans (CareCredit) |
| Emergency ⚠️ | Rule-based emergency detection — immediately surfaces emergency phone number |
| Appointments | Booking, wait times, cancellations/reschedules |

**Placeholders still to be replaced before go-live:**
- `[PRACTICE ADDRESS]`
- `[EMERGENCY PHONE NUMBER]`
- `[MAIN PHONE NUMBER]`
- Confirm actual insurance list, hours, and services per practice

---

## Success Metrics

- 80% FAQ accuracy
- 15%+ lead capture rate from after-hours visitors
- 100% emergency response accuracy (never miss an emergency)
- Dashboard data accuracy 100%
- Mobile-friendly chat widget + dashboard

---

## Repository & Environment

- **GitHub repo exists** (codebase in progress)
- **Pinecone**: Already set up and populated — FAQ chunks stored as vector embeddings
- **Supabase**: NOT set up yet — needs DB tables created (`practices`, `chats`, `messages`, `leads`, `admins`)
- **n8n**: Two workflows already live — "Update KB" (→ Pinecone) and "AI Assistant" (Pinecone → Claude → response). The AI Assistant workflow also needs a step added to write chat + lead data to Supabase.
- **Deployment target**: Vercel (for Next.js frontend), n8n cloud or self-hosted, Supabase cloud, Pinecone cloud

---

## What Claude Code Should Focus On

**Primary goal for this session:** Build the Admin Dashboard from scratch and connect it to the existing Supabase data that the n8n workflows are already writing to.

**Secondary:** Build the Chat Widget (patient-facing) with the `isAfterHours()` time gate and connect it to the n8n webhook endpoint.

Do NOT rebuild the n8n workflows — they are already implemented. Do NOT change the Supabase schema unless absolutely necessary.
