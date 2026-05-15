-- ============================================================
-- EPIC C: trips table schema extension
-- Run this in Supabase SQL Editor.
-- Adds 3 optional columns used by the new useSmartStops algorithm.
-- ============================================================

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS travel_style    TEXT      CHECK (travel_style IN ('fast','easy','explore')),
  ADD COLUMN IF NOT EXISTS kids_min_age    SMALLINT  CHECK (kids_min_age BETWEEN 0 AND 18),
  ADD COLUMN IF NOT EXISTS departure_time  TEXT;
