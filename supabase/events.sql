-- ============================================================
-- EPIC D: Analytics events
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.events (
  id           BIGSERIAL    PRIMARY KEY,
  session_id   TEXT         NOT NULL,
  user_id      UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type   TEXT         NOT NULL,
  payload      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS events_type_created_idx ON public.events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS events_session_idx      ON public.events (session_id);
CREATE INDEX IF NOT EXISTS events_payload_gin_idx  ON public.events USING gin (payload);

-- 3. RLS — anon can INSERT only; admin can SELECT
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_anon_insert" ON public.events;
CREATE POLICY "events_anon_insert" ON public.events
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "events_admin_read" ON public.events;
CREATE POLICY "events_admin_read" ON public.events
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'uros.orolicki@themercury.ai');

-- 4. Aggregate views (admin-readable only via RLS on the underlying table)

CREATE OR REPLACE VIEW public.v_top_routes AS
  SELECT
    payload->>'origin_city'      AS origin,
    payload->>'destination_city' AS destination,
    COUNT(*)                     AS plan_count,
    AVG((payload->>'total_km')::float)  AS avg_km,
    AVG((payload->>'total_min')::float) AS avg_min
  FROM public.events
  WHERE event_type = 'route_planned'
  GROUP BY 1, 2
  ORDER BY plan_count DESC;

CREATE OR REPLACE VIEW public.v_suggestion_performance AS
  SELECT
    payload->>'stop_id' AS stop_id,
    payload->>'source'  AS source,
    payload->>'slot'    AS slot,
    COUNT(*) FILTER (WHERE event_type = 'suggestion_shown')    AS shown,
    COUNT(*) FILTER (WHERE event_type = 'suggestion_accepted') AS accepted,
    COUNT(*) FILTER (WHERE event_type = 'suggestion_rejected') AS rejected
  FROM public.events
  WHERE event_type IN ('suggestion_shown','suggestion_accepted','suggestion_rejected')
  GROUP BY 1, 2, 3;
