-- ============================================================
-- FAZA 2: Curated Stops
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.curated_stops (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  lat         FLOAT       NOT NULL,
  lng         FLOAT       NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'rest_area',
  image_url   TEXT,
  website     TEXT,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  rating      FLOAT       CHECK (rating >= 0 AND rating <= 5),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.curated_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curated_stops_public_read" ON public.curated_stops;
CREATE POLICY "curated_stops_public_read" ON public.curated_stops
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "curated_stops_admin_write" ON public.curated_stops;
CREATE POLICY "curated_stops_admin_write" ON public.curated_stops
  FOR ALL
  USING      ((auth.jwt() ->> 'email') = 'uros.orolicki@themercury.ai')
  WITH CHECK ((auth.jwt() ->> 'email') = 'uros.orolicki@themercury.ai');

-- 3. Bbox RPC (no PostGIS needed)
CREATE OR REPLACE FUNCTION get_stops_along_route(
  min_lat FLOAT,
  max_lat FLOAT,
  min_lng FLOAT,
  max_lng FLOAT
)
RETURNS SETOF public.curated_stops
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM public.curated_stops
  WHERE is_active = true
    AND lat BETWEEN min_lat AND max_lat
    AND lng BETWEEN min_lng AND max_lng
  ORDER BY lat DESC;
$$;

-- Grant execute to anon + authenticated
GRANT EXECUTE ON FUNCTION get_stops_along_route TO anon, authenticated;

-- 4. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS curated_stops_updated_at ON public.curated_stops;
CREATE TRIGGER curated_stops_updated_at
  BEFORE UPDATE ON public.curated_stops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Seed data — Beograd → Budva corridor
INSERT INTO public.curated_stops (name, description, lat, lng, category, image_url, tags, rating) VALUES
(
  'Čačak',
  'Grad na Moravi — dobra stanka za kafu ili ručak na pola puta do Zlatibora.',
  43.8914, 20.3497, 'restaurant',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop',
  ARRAY['grad','hrana','kafa'], 3.8
),
(
  'Požeška Kotlina',
  'Mirna dolina između Ovčara i Kablar planine, prelepo za kratku šetnju uz reku.',
  43.8903, 20.0364, 'viewpoint',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop',
  ARRAY['planina','priroda','šetnja'], 4.2
),
(
  'Zlatibor',
  'Planinski resort sa brojnim restoranima i panoramskim pogledom. Idealno za dužu pauzu.',
  43.7279, 19.6935, 'rest_area',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop',
  ARRAY['planina','resort','panorama','odmor'], 4.7
),
(
  'Prijepolje — Manastir Mileševa',
  'Manastir iz 13. veka sa čuvenom freskom Beli Anđeo. Kratka stanka od magistrale.',
  43.3883, 19.6481, 'attraction',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop',
  ARRAY['manastir','istorija','kultura','freska'], 4.6
),
(
  'Bijelo Polje',
  'Prva veća crnogorska varoš posle granice — dobro mesto za gorivo i osveženje.',
  43.0366, 19.7486, 'rest_area',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
  ARRAY['crna gora','gorivo','pauza'], 3.5
),
(
  'Kolašin',
  'Planinsko letovalište i zimski resort. Prelepa reka Tara u blizini — odlično za osveženje.',
  42.8234, 19.5196, 'rest_area',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&auto=format&fit=crop',
  ARRAY['planina','reka','resort','ski'], 4.5
),
(
  'Manastir Morača',
  'Jedan od najlepših manastira iz 13. veka, usred klisure reke Morače. Obavezna stanka.',
  42.6831, 19.4747, 'attraction',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop',
  ARRAY['manastir','istorija','kultura','klisura'], 4.8
),
(
  'Virpazar',
  'Malebno selo na obali Skadarskog jezera (UNESCO). Obilazak lagonom i degustacija vina.',
  42.2453, 19.0947, 'attraction',
  'https://images.unsplash.com/photo-1559521783-1d1599583485?w=600&auto=format&fit=crop',
  ARRAY['jezero','priroda','vino','brod'], 4.9
),
(
  'Petrovac na Moru',
  'Mala plaža i stara venecijanska tvrđava — savršena stanka 20 min pre Budve.',
  42.2046, 18.9486, 'viewpoint',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop',
  ARRAY['plaža','more','tvrđava','istorija'], 4.6
);
