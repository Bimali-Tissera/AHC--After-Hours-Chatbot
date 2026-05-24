# Supabase Schema Reference
> ⚠️ Supabase is NOT yet set up. These tables need to be CREATED.
> Run these as SQL migrations in Supabase dashboard or via the Supabase CLI.
> Once created, the n8n AI Assistant workflow will also need a step added to write chat + lead data here.

## Tables

### `practices`
Stores each dental practice's configuration.
```sql
practices (
  id          uuid PRIMARY KEY,
  name        text,           -- Practice display name
  address     text,           -- [PRACTICE ADDRESS] placeholder
  phone       text,           -- [MAIN PHONE NUMBER]
  emergency_phone text,       -- [EMERGENCY PHONE NUMBER]
  hours_json  jsonb,          -- Business hours per day { mon: {open: "08:00", close: "17:00"}, ... }
  insurance_list text[],      -- Array of accepted insurance plans
  services    text[],         -- Array of offered services
  created_at  timestamptz
)
```

### `chats`
One row per chat session (a visitor's full conversation).
```sql
chats (
  id            uuid PRIMARY KEY,
  practice_id   uuid REFERENCES practices(id),
  started_at    timestamptz,
  ended_at      timestamptz,
  status        text,         -- 'open' | 'followed_up' | 'needs_attention'
  is_emergency  boolean,
  lead_captured boolean
)
```

### `messages`
Individual messages within a chat session.
```sql
messages (
  id          uuid PRIMARY KEY,
  chat_id     uuid REFERENCES chats(id),
  role        text,           -- 'user' | 'assistant'
  content     text,
  response_type text,         -- 'faq' | 'lead_capture' | 'escalation' | 'emergency'
  created_at  timestamptz
)
```

### `leads`
Contact details captured during chat.
```sql
leads (
  id            uuid PRIMARY KEY,
  chat_id       uuid REFERENCES chats(id),
  practice_id   uuid REFERENCES practices(id),
  name          text,
  phone         text,
  email         text,
  trigger_question text,      -- The question that prompted lead capture
  captured_at   timestamptz,
  exported      boolean DEFAULT false
)
```

### `admins`
Practice admin login credentials (used for dashboard auth).
```sql
admins (
  id            uuid PRIMARY KEY,
  practice_id   uuid REFERENCES practices(id),
  email         text UNIQUE,
  created_at    timestamptz
  -- Password managed by Supabase Auth
)
```

---

## Notes for Dashboard Queries

- Always filter by `practice_id` — each admin only sees their own practice
- Chat stats: group `chats` by `date_trunc('hour', started_at)` for busiest hours
- Lead capture rate: `COUNT(chats WHERE lead_captured = true) / COUNT(chats) * 100`
- Most common questions: aggregate `messages WHERE role = 'user'` — may need basic text clustering or just raw listing
- Emergency count: `COUNT(chats WHERE is_emergency = true)`
- Status management: UPDATE `chats.status` from dashboard UI
