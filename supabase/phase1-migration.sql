-- ═══════════════════════════════════════════════════════════════════
-- Phase 1 Migration: Multi-tenant wedding platform
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── Step 1: Create the weddings table ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.weddings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug             text UNIQUE,
  partner1_name    text NOT NULL DEFAULT '',
  partner2_name    text NOT NULL DEFAULT '',
  wedding_date     date,
  wedding_end_date date,
  venue_name       text DEFAULT '',
  venue_location   text DEFAULT '',
  welcome_message  text DEFAULT '',
  is_public        boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── Step 2: Add wedding_id column to app_data ───────────────────────
ALTER TABLE public.app_data
  ADD COLUMN IF NOT EXISTS wedding_id uuid
  REFERENCES public.weddings(id) ON DELETE CASCADE;

-- ── Step 3: Drop old unique constraint on key alone ─────────────────
-- (The existing table probably has UNIQUE(key); we need UNIQUE(wedding_id, key) instead.)
-- If you get an error on this line, find the real constraint name with:
--   SELECT constraint_name FROM information_schema.table_constraints
--   WHERE table_name = 'app_data' AND constraint_type = 'UNIQUE';
ALTER TABLE public.app_data DROP CONSTRAINT IF EXISTS app_data_key_key;
ALTER TABLE public.app_data DROP CONSTRAINT IF EXISTS app_data_pkey;  -- if key was the PK

-- ── Step 4: Add composite unique constraint ──────────────────────────
ALTER TABLE public.app_data
  DROP CONSTRAINT IF EXISTS app_data_wedding_id_key_key;
ALTER TABLE public.app_data
  ADD CONSTRAINT app_data_wedding_id_key_key UNIQUE (wedding_id, key);

-- ── Step 5: Enable Row-Level Security ───────────────────────────────
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data  ENABLE ROW LEVEL SECURITY;

-- ── Step 6: RLS policy — weddings ───────────────────────────────────
DROP POLICY IF EXISTS "owner_all" ON public.weddings;
CREATE POLICY "owner_all" ON public.weddings
  FOR ALL
  USING     (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── Step 7: RLS policy — app_data ───────────────────────────────────
DROP POLICY IF EXISTS "wedding_owner_all" ON public.app_data;
CREATE POLICY "wedding_owner_all" ON public.app_data
  FOR ALL
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- AFTER RUNNING THIS SCRIPT — do these 3 things:
--
-- 1. Turn off email confirmation (so signup works immediately):
--    Supabase Dashboard → Authentication → Settings
--    → "Enable email confirmations" → OFF
--
-- 2. Go to https://your-app.vercel.app/signup
--    Fill in your partner names, dates, and venue and create your
--    account. A row will appear in the weddings table.
--
-- 3. Migrate your existing data — run this after signup:
--    (replace the UUID with your actual wedding id from the table)
--
--    UPDATE public.app_data
--    SET wedding_id = '<your-wedding-uuid-here>'
--    WHERE wedding_id IS NULL;
-- ═══════════════════════════════════════════════════════════════════
