-- ============================================================
-- EPIC B: curated_stops schema v2 (additive)
-- Run AFTER curated_stops.sql. Does not touch existing rows.
-- ============================================================

-- 1. Additive columns
ALTER TABLE public.curated_stops
  ADD COLUMN IF NOT EXISTS description_en      TEXT,
  ADD COLUMN IF NOT EXISTS copy_sr             TEXT,
  ADD COLUMN IF NOT EXISTS copy_en             TEXT,
  ADD COLUMN IF NOT EXISTS kid_friendly_score  SMALLINT CHECK (kid_friendly_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS has_playground      BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_toilet          BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_parking         BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_food            BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_shade           BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS best_time_of_day    TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS best_season         TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS road_corridors      TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slot_types          TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detour_minutes      SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_tier          SMALLINT CHECK (price_tier BETWEEN 1 AND 3);

CREATE INDEX IF NOT EXISTS curated_stops_corridors_idx ON public.curated_stops USING gin (road_corridors);
CREATE INDEX IF NOT EXISTS curated_stops_slots_idx     ON public.curated_stops USING gin (slot_types);

-- 2. Scored RPC for trip-aware ranking
CREATE OR REPLACE FUNCTION get_stops_for_trip(
  min_lat       FLOAT,
  max_lat       FLOAT,
  min_lng       FLOAT,
  max_lng       FLOAT,
  has_kids      BOOLEAN  DEFAULT false,
  min_kid_age   SMALLINT DEFAULT 99,
  time_of_day   TEXT     DEFAULT 'lunch',
  season        TEXT     DEFAULT 'summer',
  corridor      TEXT     DEFAULT NULL
)
RETURNS TABLE (
  id                  UUID,
  name                TEXT,
  description         TEXT,
  copy_sr             TEXT,
  copy_en             TEXT,
  lat                 FLOAT,
  lng                 FLOAT,
  category            TEXT,
  image_url           TEXT,
  tags                TEXT[],
  slot_types          TEXT[],
  kid_friendly_score  SMALLINT,
  detour_minutes      SMALLINT,
  score               FLOAT
)
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT
    cs.id, cs.name, cs.description, cs.copy_sr, cs.copy_en,
    cs.lat, cs.lng, cs.category, cs.image_url, cs.tags, cs.slot_types,
    cs.kid_friendly_score, cs.detour_minutes,
    (
      COALESCE(cs.kid_friendly_score, 3)
        * (CASE WHEN has_kids AND min_kid_age <= 12 THEN 2.0 ELSE 1.0 END)
      + (CASE WHEN time_of_day = ANY(cs.best_time_of_day) THEN 3.0 ELSE 0 END)
      + (CASE WHEN season = ANY(cs.best_season) OR 'all' = ANY(cs.best_season) THEN 2.0 ELSE 0 END)
      + (CASE WHEN corridor IS NOT NULL AND corridor = ANY(cs.road_corridors) THEN 4.0 ELSE 0 END)
      - (cs.detour_minutes * 0.15)
      + COALESCE(cs.rating, 0)
    )::float AS score
  FROM public.curated_stops cs
  WHERE cs.is_active = true
    AND cs.lat BETWEEN min_lat AND max_lat
    AND cs.lng BETWEEN min_lng AND max_lng
  ORDER BY score DESC;
$$;

GRANT EXECUTE ON FUNCTION get_stops_for_trip TO anon, authenticated;
