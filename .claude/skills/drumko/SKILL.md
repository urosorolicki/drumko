---
name: drumko
description: >
  Sveobuhvatan kontekstualni skill za razvoj drumko.app — besplatnog porodičnog
  road trip planera. Koristi ovaj skill uvek kada radiš na drumko projektu:
  novi feature, refaktor, UI promena, logika stanica, Supabase šema, mapa,
  ili bilo šta vezano za drumko codebase. Sadrži arhitekturu, konvencije,
  poznate probleme i planiranu evoluciju projekta.
---

# Drumko — Claude Code Skill

## 1. Projekat u jednoj rečenici

**Drumko** je React 19 + Supabase web app za planiranje porodičnih putovanja:
korisnik bira start/end, app crta rutu (OSRM), predlaže pauze (Geoapify POI),
prati budžet i listu za pakovanje. Živi na [drumko.app](https://drumko.app),
deploy Vercel.

---

## 2. Tech stack

| Sloj | Tehnologija | Napomene |
|---|---|---|
| Framework | React 19 + Vite | Ne Next.js — čisti SPA |
| Stil | Tailwind CSS 4 | Novo API (nema `@apply` za custom klase) |
| Animacije | Framer Motion | Za swipe kartice, tranzicije |
| State | Zustand | Ne Redux, ne Context za globalni state |
| Backend/Auth | Supabase | Postgres + RLS + Auth |
| Mapa | Leaflet + React Leaflet | Ne Mapbox, ne Google Maps |
| Rutiranje | OSRM (public API) | `router.project-osrm.org` |
| Geokodiranje | Geoapify | API key u `.env` |
| POI pretraga | Geoapify Places API | Kategorije: fuel, food, sleep, leisure... |
| Deploy | Vercel | `vercel.json` u repou |
| i18n | Ručna implementacija | `sr` i `en`, bez i18next |

---

## 3. Struktura projekta

```
drumko/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── RoutePolyline.jsx      # Crtanje rute na mapi
│   │   │   ├── CustomMarker.jsx       # Start/end/stop/poi markeri
│   │   │   ├── StopPopup.jsx          # Popup za waypointe
│   │   │   └── POIPopup.jsx           # Popup za Geoapify POI
│   │   ├── Stops/
│   │   │   └── SwipeStops.jsx         # Swipe UI za predloge pauza
│   │   └── ...
│   ├── hooks/
│   │   ├── useSmartStops.js           # KLJUČNI HOOK — logika predloga pauza
│   │   ├── useGeoapify.js             # POI fetch + CATEGORY_MAP
│   │   └── ...
│   ├── stores/                        # Zustand store-ovi
│   └── ...
├── supabase/                          # Migracije i RLS politike
├── STOPS_AUDIT.md                     # Detaljan audit postojeće logike
└── .claude/                           # Claude Code konfiguracija
```

---

## 4. Ključna logika — `useSmartStops` (trenutno stanje)

> ⚠️ Ovaj hook ima poznate probleme. Čitaj Section 5 pre bilo kakve izmene.

**Šta radi:**
1. Prima OSRM polyline koordinate, listu POI-eva, ukupnu distancu i `requestedCount`
2. Računa `poolSize = min(requestedCount * 2, 6)` — više kandidata za "pokaži druge" dugme
3. Raspoređuje `poolSize` tačaka **ravnomerno po kilometraži** (ne po vremenu!)
4. Za svaku tačku: pronalazi najbliži grad + top POI po 3 slota: `fuel → food → sleep`
5. `SwipeStops` uzima sve predloge, flatten-uje u kartice, deduplira po `name+lat`

**Poznata ograničenja (ne popravljaj bez čitanja Section 5):**
- Koristi fiksno 90 km/h umesto OSRM `totalDuration`
- Nema minimalnog vremenskog razmaka između predloga
- Samo 3 kategorije (fuel/food/sleep) — nema playground, viewpoint, rest_area
- Isti POI može biti predlog za 2 susedne tačke
- `nearestCityName` često vraća ime biznisa umesto grada

---

## 5. Poznati problemi i planirana rešenja

### Problem 1 — Km-interval umesto vremenskog intervala
**Problem:** Hook deli rutu na jednake km, ne na jednake intervale vožnje.  
**Plan:** Koristiti OSRM `legs[].duration` za kumulativno vreme, i postavljati
marke na ~90-minutne intervale (konfigurabilno). Minimalni razmak između 2
predloga: 30 min.

### Problem 2 — Rigidne kategorije
**Problem:** Samo `fuel/food/sleep`. Porodice traže playground, picnic, viewpoint.  
**Plan:** Proširiti `PICK_SLOTS` u `useGeoapify.js` sa:
- `attraction` / `viewpoint` / `museum`
- `rest_area` / `picnic_site`
- `playground` (Geoapify: `leisure.playground`)  
Dodati fallback: ako `food` slot prazan → pokušaj `picnic_site`.

### Problem 3 — Mapa: polyline stilizacija
**Trenutno:** `dashArray: '12 8'` je isprekidana linija, ne animacija (misleading komentar u kodu).  
**Plan:** Ukloniti dashArray za potvrđenu rutu. Dodati CSS stroke-dashoffset animaciju samo za loading state. Povećati debljinu na 5-6px.

### Problem 4 — Markeri na mobilnom
**Problem:** POI markeri su 24×24px — ispod 44px touch target minimuma.  
**Plan:** Povećati na min 36×36px. Dodati `suggestion` tip markera (vizuelno različit od confirmed waypoint-a).

### Problem 5 — Clustering
**Problem:** Do 500 markera simultano na mapi, browser lag.  
**Plan:** Uvesti `react-leaflet-cluster` za POI layer. Threshold: >10 markera u vidnom polju → klaster.

### Problem 6 — Loading states
**Problem:** Nema skeleton/loading dok OSRM učitava, `TripStatsBar` prikazuje 0/0.  
**Plan:** Dodati skeleton polyline (siva isprekidana linija) + loading state u `TripStatsBar`.

---

## 6. Planirana arhitektura — hibridni predlozi pauza

### Faza 1 — Supabase kurirane stanice (prioritet)

Dodati tabelu `curated_stops` sa PostGIS:

```sql
create table public.curated_stops (
  id            uuid primary key default gen_random_uuid(),
  lat           double precision not null,
  lng           double precision not null,
  location      geography(POINT, 4326) generated always as (
                  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
                ) stored,
  name          text not null,
  description_sr text,
  description_en text,
  category      text not null check (category in (
                  'playground','restaurant','landmark','gas_food',
                  'toilet','beach','rest_area','viewpoint','museum',
                  'picnic','fuel','hotel'
                )),
  primary_image_url     text,
  child_friendly_score  smallint check (child_friendly_score between 1 and 5),
  has_toilet            boolean default false,
  has_parking           boolean default false,
  has_food              boolean default false,
  best_after_minutes    smallint,
  road_corridor         text,
  is_active             boolean default true
);

create index curated_stops_location_idx
  on public.curated_stops using gist(location);
```

RPC funkcija za query po ruti:
```sql
create or replace function get_stops_along_route(
  route_geometry  jsonb,
  buffer_meters   float default 5000
)
returns setof public.curated_stops ...
```
*(Pun SQL u STOPS_AUDIT.md, Section 0.3)*

### Faza 2 — Logika prioriteta (slot-level fallback)

Za svaki vremenski slot (~90 min):
1. Prvo traži kurirane stanice u 10km radijusu od slot tačke
2. Ako nema kurirani → uzmi Geoapify POI
3. Svaki rezultat nosi `{ source: 'curated' | 'geoapify' }`
4. UI označava "Drumko preporuka" vs "Javna baza"

**Ne koristiti score-based merge (Varijanta B) dok nema ≥50 kuriranih stanica.**

### Faza 3 — UI refaktor mape (odloženo)
- Promena tile providera: CartoDB Voyager → **Stadia Alidade Smooth**
  (URL: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png`)
- Pastelna pozadina → bolji kontrast narandžastom polyline-u i markerima
- Potreban API ključ (besplatno do 200k req/mesec)

---

## 7. Konvencije koda

### Komponente
- Funkcionalne komponente, hooks, ne class components
- Props destructuring u potpisu: `function StopPopup({ stop, onClose })`
- Tailwind klase direktno u JSX — ne CSS moduli, ne styled-components
- Framer Motion samo za animirani UI (swipe, fade tranzicije) — ne za sve

### State management
- **Lokalni state** (`useState`): UI state jedne komponente
- **Zustand store**: ruta, waypointi, budžet, pakovanje — sve što deli više komponenti
- **Ne koristiti** React Context za globalni state — već je Zustand

### Supabase
- Sve DB operacije kroz Supabase JS client
- RLS uvek uključen — nikad `service_role` key na frontendu
- Migracije u `supabase/migrations/` — ne ručne izmene u dashboardu

### i18n
- Tekstovi u objektima po jeziku (`sr`/`en`)
- Ne koristiti i18next — postoji custom implementacija
- Srpski je primarni jezik, engleski sekundarni

### API pozivi
- Geoapify key: `VITE_GEOAPIFY_API_KEY` iz `.env`
- Supabase: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- OSRM: public API, bez ključa, bez rate limita (ali throttle na UI)

---

## 8. UI/UX principi

- **Mobilno-prvo** — sve komponente dizajnirane za telefon, tablet sekundarno
- **Touch targeti minimum 44×44px** — posebno markeri i dugmad
- **Swipe interakcija** za predloge pauza (Framer Motion `drag`)
- **Ne prikazivati tehničke greške korisniku** — friendly fallback poruke na srpskom
- **Boja brenda:** narandžasta `#F97316` (Tailwind `orange-500`)
- **Font:** sistemski sans-serif stack (ne Google Fonts, performance razlog)

---

## 9. Česte greške / zamke

| Zamka | Ispravno |
|---|---|
| Menjati `useSmartStops` bez razumevanja `SwipeStops` toka | Uvek pratiti ceo tok: hook → SwipeStops → mapa |
| Dodavati Geoapify kategorije samo u `useSmartStops` | Kategorije se definišu u `CATEGORY_MAP` u `useGeoapify.js` |
| Koristiti `map.closePopup()` sa magic number timeout | Konstanta ili prop za delay |
| Direktan DB update u Supabase dashboardu | Uvek migracija u `supabase/migrations/` |
| Pisati CSS van Tailwinda | Tailwind utility klase first; custom CSS samo za Leaflet overrides |
| Pretpostavljati da je korisnik prijavljen | Drumko radi i bez naloga — proveri auth state |

---

## 10. Reference

- **`STOPS_AUDIT.md`** u root repoa — detaljan audit `useSmartStops`, mape, i data modela (PostGIS šema, RPC funkcije, varijante logike). Čitati pre bilo kakve izmene logike stanica.
- **`supabase/`** — SQL migracije i RLS politike
- **`src/hooks/useSmartStops.js`** — trenutna logika (sa poznatim problemima)
- **`src/hooks/useGeoapify.js`** — POI fetch i `CATEGORY_MAP`
- **`src/components/Map/`** — sve mapa komponente
