-- Run AFTER schema.sql in Supabase Dashboard > SQL Editor
-- After-Hours Chatbot — Seed data for the Ekwa dental practice
--
-- BEFORE RUNNING:
-- 1. Run schema.sql first (creates all 5 tables and RLS policies)
-- 2. Replace the placeholder tokens below with real Ekwa data:
--    [PRACTICE ADDRESS]       — e.g. '123 Main St, City, ST 12345'
--    [MAIN PHONE NUMBER]      — e.g. '555-000-0000'
--    [EMERGENCY PHONE NUMBER] — e.g. '555-999-9999'
-- 3. Update hours_json, insurance_list, and services with real values if needed

-- ============================================================
-- INSERT 1: Ekwa practice row
-- ============================================================
-- Note the RETURNING id at the end — copy this UUID for the admins INSERT below

INSERT INTO practices (id, name, address, phone, emergency_phone, hours_json, insurance_list, services)
VALUES (
  gen_random_uuid(),
  'Ekwa Dental',
  '[PRACTICE ADDRESS]',
  '[MAIN PHONE NUMBER]',
  '[EMERGENCY PHONE NUMBER]',
  '{
    "mon": {"open": "08:00", "close": "17:00"},
    "tue": {"open": "08:00", "close": "17:00"},
    "wed": {"open": "08:00", "close": "17:00"},
    "thu": {"open": "08:00", "close": "17:00"},
    "fri": {"open": "08:00", "close": "17:00"},
    "sat": null,
    "sun": null
  }'::jsonb,
  ARRAY['Delta Dental', 'Cigna', 'Aetna', 'MetLife', 'BCBS'],
  ARRAY['Cleaning', 'Whitening', 'Invisalign', 'Implants', 'X-rays']
)
RETURNING id;

-- ============================================================
-- INSERT 2: Admin row template
-- ============================================================
-- Run this AFTER creating the admin user in Supabase Auth
--
-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Click "Add user" and create the admin (email + password)
-- Step 3: Copy the user's UUID shown in the dashboard
-- Step 4: Copy the practice UUID from the RETURNING id result above
-- Step 5: Paste both UUIDs into this INSERT and run it

INSERT INTO admins (id, practice_id, email)
VALUES (
  '<paste-auth-user-uuid-here>',
  '<paste-practice-uuid-here>',
  'admin@ekwa.com'
);
