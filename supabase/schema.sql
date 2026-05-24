-- Run in Supabase Dashboard > SQL Editor
-- After-Hours Chatbot — Complete schema for all 5 tables, RLS enable statements, and all RLS policies
-- Run this file FIRST, then run seed.sql

-- ============================================================
-- SECTION 1: Create Tables
-- ============================================================

CREATE TABLE practices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  address         text,
  phone           text,
  emergency_phone text,
  hours_json      jsonb,
  insurance_list  text[],
  services        text[],
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE chats (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id   uuid REFERENCES practices(id),
  started_at    timestamptz DEFAULT now(),
  ended_at      timestamptz,
  status        text DEFAULT 'open',
  is_emergency  boolean DEFAULT false,
  lead_captured boolean DEFAULT false
);

CREATE TABLE messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id       uuid REFERENCES chats(id),
  role          text,
  content       text,
  response_type text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id          uuid REFERENCES chats(id),
  practice_id      uuid REFERENCES practices(id),
  name             text,
  phone            text,
  email            text,
  trigger_question text,
  captured_at      timestamptz DEFAULT now(),
  exported         boolean DEFAULT false
);

CREATE TABLE admins (
  id          uuid PRIMARY KEY,  -- Must match auth.users.id — no default, set manually
  practice_id uuid REFERENCES practices(id),
  email       text UNIQUE,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- SECTION 2: Enable Row Level Security on All Tables
-- ============================================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 3: Create RLS Policies (SELECT only, TO authenticated)
-- ============================================================
-- Each policy filters by practice_id via a subquery against the admins table.
-- auth.uid() is wrapped in (SELECT auth.uid()) to cache per statement (performance).
-- TO authenticated ensures the anon role never executes these policies.

-- practices: admin can read their own practice row
CREATE POLICY "admins_read_own_practice" ON practices
FOR SELECT TO authenticated
USING (
  id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
);

-- chats: admin can read chats belonging to their practice
CREATE POLICY "admins_read_own_chats" ON chats
FOR SELECT TO authenticated
USING (
  practice_id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
);

-- messages: admin can read messages in chats belonging to their practice
CREATE POLICY "admins_read_own_messages" ON messages
FOR SELECT TO authenticated
USING (
  chat_id IN (
    SELECT id FROM chats
    WHERE practice_id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
  )
);

-- leads: admin can read leads captured for their practice
CREATE POLICY "admins_read_own_leads" ON leads
FOR SELECT TO authenticated
USING (
  practice_id = (SELECT practice_id FROM admins WHERE id = (SELECT auth.uid()))
);

-- admins: admin can only read their own row
CREATE POLICY "admins_read_own_row" ON admins
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));
