-- ═══════════════════════════════════════════════════════════════════
-- Phase 2c: Personalized Guest Invite Links
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── Invites table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,   -- 8-char random code in the URL
  guest_id    text NOT NULL,          -- matches Guest.id in app_data JSON
  first_name  text DEFAULT '',
  last_name   text DEFAULT '',
  max_guests  int  DEFAULT 1,         -- how many people this invite covers
  used        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Public can read an invite by code (needed to load personalized RSVP page)
CREATE POLICY "public_read_invites" ON public.invites
  FOR SELECT USING (true);

-- Only owner/members can create and manage invites
CREATE POLICY "members_manage_invites" ON public.invites
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

-- ── Add invite tracking to rsvp_submissions ────────────────────────────
ALTER TABLE public.rsvp_submissions
  ADD COLUMN IF NOT EXISTS invite_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS guest_id    text DEFAULT '';
