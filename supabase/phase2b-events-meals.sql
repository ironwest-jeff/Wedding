-- ═══════════════════════════════════════════════════════════════════
-- Phase 2b: Events & Meal Choices
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- Add events and meal choices to the weddings table
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS events       jsonb   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS meal_choices text[]  DEFAULT '{}';

-- Add meal_choice to RSVP submissions
ALTER TABLE public.rsvp_submissions
  ADD COLUMN IF NOT EXISTS meal_choice text DEFAULT '';
