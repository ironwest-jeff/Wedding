-- ═══════════════════════════════════════════════════════════════════
-- Phase 2: Guest Portal
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── Step 1: Allow public reads of weddings (for /[slug] pages) ──────
-- Guests visiting your wedding page don't have accounts.
-- This policy lets the public page load wedding info by slug.
CREATE POLICY "public_wedding_read" ON public.weddings
  FOR SELECT
  USING (true);

-- ── Step 2: Create rsvp_submissions table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.rsvp_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  first_name    text NOT NULL,
  last_name     text    DEFAULT '',
  email         text    DEFAULT '',
  rsvp          text    NOT NULL DEFAULT 'Confirmed',  -- 'Confirmed' | 'Declined'
  dietary       text    DEFAULT 'None',
  dietary_notes text    DEFAULT '',
  notes         text    DEFAULT '',
  submitted_at  timestamptz DEFAULT now(),
  imported      boolean DEFAULT false  -- true once couple adds them to guest list
);

ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;

-- ── Step 3: RLS — anyone can submit, only couple can read/update ─────

-- Any visitor can submit an RSVP (no login required)
CREATE POLICY "public_rsvp_insert" ON public.rsvp_submissions
  FOR INSERT
  WITH CHECK (true);

-- Only the wedding owner + members can view submissions
CREATE POLICY "members_read_rsvps" ON public.rsvp_submissions
  FOR SELECT
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
         OR auth.email() = ANY(member_emails)
    )
  );

-- Only the wedding owner + members can mark submissions as imported
CREATE POLICY "members_update_rsvps" ON public.rsvp_submissions
  FOR UPDATE
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings
      WHERE owner_id = auth.uid()
         OR auth.email() = ANY(member_emails)
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- After running this:
-- • Your wedding page is live at: your-app.vercel.app/[your-slug]
-- • RSVP form is at: your-app.vercel.app/[your-slug]/rsvp
-- • New RSVPs appear in the Guest List tab → "RSVP Inbox" section
-- ═══════════════════════════════════════════════════════════════════
