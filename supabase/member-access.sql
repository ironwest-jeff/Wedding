-- ═══════════════════════════════════════════════════════════════════
-- Member Access Migration: let multiple users access one wedding
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── Step 1: Add member_emails column to weddings ─────────────────────
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS member_emails text[] DEFAULT '{}';

-- ── Step 2: Drop old RLS policies ───────────────────────────────────
DROP POLICY IF EXISTS "owner_all"         ON public.weddings;
DROP POLICY IF EXISTS "wedding_owner_all" ON public.app_data;

-- ── Step 3: New weddings policies ───────────────────────────────────
-- Owners and members can read the wedding record
CREATE POLICY "wedding_read" ON public.weddings
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR auth.email() = ANY(member_emails)
  );

-- Only owner can insert / update / delete their wedding
CREATE POLICY "wedding_owner_write" ON public.weddings
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "wedding_owner_update" ON public.weddings
  FOR UPDATE
  USING     (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "wedding_owner_delete" ON public.weddings
  FOR DELETE
  USING (owner_id = auth.uid());

-- ── Step 4: New app_data policy — owners and members ────────────────
CREATE POLICY "wedding_members_all" ON public.app_data
  FOR ALL
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
         OR auth.email() = ANY(member_emails)
    )
  )
  WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
         OR auth.email() = ANY(member_emails)
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- After running this script:
-- • Go to your app and open the "Members" panel (gear icon in header)
-- • Add Nat's email and any planner emails to give them access
-- • Those users sign up at /signup and get routed to the same wedding
-- ═══════════════════════════════════════════════════════════════════
