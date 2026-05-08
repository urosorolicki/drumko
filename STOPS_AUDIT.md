# STOPS_AUDIT.md — Drumko Route & Stops Refactor

**Datum:** 2026-05-08  
**Autor:** Claude Code (Faza 0 — pre implementacije)

---

## 0.1 Trenutna logika `useSmartStops`

### Kako radi

`useSmartStops` (`src/hooks/useSmartStops.js`) je čisto lokalni hook — ne zove
nikakav API. Ulazi su koordinate rute (OSRM polyline), lista POI-eva (Geoapify
Places), ukupna distanca i broj željenih stanica.

**Korak po korak:**

1. Izračuna `poolSize = min(requestedCount * 2, 6)` — pravi dvostruko više
   kandidata nego što je traženo, da "pokaži druge" dugme može da radi.
2. Raspoređuje `poolSize` km-marki ravnomerno po ruti:
   `km[i] = totalDistanceKm * (i+1) / (poolSize+1)`
3. Za svaku km-marku, ide kroz OSRM koordinate haversine akumulacijom i
   pronalazi tačku na ruti.
4. Za tu tačku radi dva poziva:
   - `nearestCityName` — naziv iz najbližeg POI-a u 40km radijusu
   - `findTopPicks` — pronalazi POI-eve u 15km radijusu i pika prvog po
     svakom od 3 slota: `fuel → food → sleep`
5. Procenjuje vreme vožnje kao `round(km * 60 / 90)` — fiksno 90 km/h, bez
   obzira da li je auto-put ili planinski put.

**Gde `SwipeStops` koristi ovo:**  
Razvlači sve `picks` iz svih predloga u jedan niz kartica (`flatMap`),
deduplira po `name+lat`, i prikazuje jedan po jedan za swipe.

---

### Identifikovani problemi

#### Problem 1 — Nema logike "pauza svakih 90 min"

Hook deli rutu na **jednake km intervale**, ne na jednake vremenske intervale.
Za 400km rutu sa `requestedCount=2`, poolSize=4, marke su na 80/160/240/320km.
Ako je prvih 160km auto-put (90 km/h) a ostatak planinska cesta (40 km/h),
druge dve marke su vremenski udvostručene u odnosu na prve. Korisnik koji vozi
"pauza svakih 90min" neće dobiti to od ovog hook-a jer hook ne koristi
`totalDuration` iz OSRM-a uopšte.

**Vreme vožnje se računa (`driveTimeMin`) ali samo kao display podatak** —
nigde se ne koristi kao filter ili kriterijum za odabir.

#### Problem 2 — Nema minimalnog razmaka između predloga

Ako su 2 km-marke blizu jedna drugoj (npr. pri kratkim rutama ili velikom
`poolSize`), 2 predloga mogu biti udaljeni 20-30 minuta vožnje. Nema ni
provere ni filtera koji bi ovo sprečio. `requestedCount` default je 2, dakle
poolSize=4, što na 150km ruti daje marke na ~30km razmaka (~20 min).

#### Problem 3 — `nearestCityName` vraća ime POI-a, ne grada

Funkcija uzima naziv najbližeg POI-a u 40km radijusu i cepa ga na `,/-/–`.
Rezultat može biti "McDonald's", "NIS petrol", "Hotel Panorama" umesto naziva
grada. Ovo se prikazuje korisniku kao naziv lokacije na swipe kartici (kao
`subName` kroz split na zarezu u `SwipeStops`). Nije kritično jer SwipeStops
koristi `poi.name` kao primarno ime, ali zbunjuje debug i log.

#### Problem 4 — Rigidni 3-slot sistem (fuel, food, sleep)

`PICK_SLOTS` ima samo tri kategorije. Nema:
- `attraction` / `viewpoint` / `museum` — za porodični road trip ovo je
  verovatno važnije od pumpe
- `rest_area` / `picnic_site` — stanke sa decom zahtevaju prostor
- `playground` — ne postoji ni u kategorijama (Geoapify ga vraća kao
  `leisure.playground` ali CATEGORY_MAP u useGeoapify.js ga nema)

Ako ruta prolazi kroz lepu prirodu a nema restorana u 15km, slot `food` ostaje
prazan — nema fallback na `picnic_site`.

#### Problem 5 — Isti POI može biti "picks" za 2 susedne marke

`findTopPicks` ne pamti koji su POI-evi već korišćeni u prethodnoj marki.
Popularni objekat (npr. veliki restoran na auto-putu) koji je 14km od dve
susedne marke pojaviće se u oba. `SwipeStops` deduplira po `name+lat` tek
na kraju, ali korisnik neće videti duplikat — samo će biti manje kartica nego
što se očekuje.

#### Problem 6 — Flat 90 km/h za sve rute

Beograd→Budva sa tunelom kroz Morsku Goru i Crnogorskim primorjem nije 90
km/h. OSRM vraća `totalDuration` koji je realističan, ali hook ga ignoriše i
sam računa po fiksnoj brzini. Procena kada da se napravi pauza biće pogrešna.

---

## 0.2 Vizuelni audit mape

### Tile provider

**Trenutno:** CartoDB Voyager
```
https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png
```

Voyager je solidna baza — znatno bolji od default OSM. Nije problem koji treba
hitno rešiti, ali ima alternativa sa boljim kontrastom za narandžasti polyline:

| Provider | Free tier | Izgled | Preporuka za Drumko |
|---|---|---|---|
| CartoDB Voyager (trenutno) | Neograničen (bez ključa) | Šareniji, čitljiv | OK |
| **Stadia Alidade Smooth** | 200k req/mo | Pastelni, visok kontrast, čist | **Preporučujem** |
| CartoDB Positron | Neograničen | Skoro monohrom, maximalno minimalan | Dobro za dense POI |
| MapTiler Streets | 100k req/mo | Detaljniji, profesionalan | Overkill za sad |

**Predlog:** Stadia Alidade Smooth. Pastelna pozadina daje bolji kontrast
narandžastom polyline-u i markerima nego Voyager koji ima sopstvene narandžaste
i zelene elemente koji se takmiče sa Drumko markerima.

---

### Stilizacija polyline-a

**Fajl:** `src/components/Map/RoutePolyline.jsx`

Trenutno stanje:
```js
// Background line
color: '#F97316', weight: 7, opacity: 0.2

// Main line
color: '#F97316', weight: 4, opacity: 0.85
dashArray: animated ? '12 8' : null
```

**Problemi:**

1. **"Animiran" polyline nije animiran.** `dashArray: '12 8'` kreira
   isprekidanu liniju, ne animiranu. Komentar u kodu kaže "animates drawing
   itself" — to ne postoji. Nema stroke-dashoffset animacije, nema CSS
   keyframeova. Isprekidana linija vizuelno sugeriše "predlog rute" ili
   "putovanje avionom" umesto potvrđene auto-rute.

2. **Debljina 4px** je minimalna za auto-put prikaz. Na mobilnom, na zumu 7-8,
   linija je jedva vidljiva. 5-6px je bolji kompromis.

3. **Nema senke ispod linije.** Background glow (opacity 0.2, ista boja) je
   fina ali senka bi dala više dubine, posebno na Voyager tile-u.

4. **Nema pulsing/animacije za loading state.** Dok OSRM učitava, mapa je
   prazna — nema skeleton polyline ili "crtanje rute" feedback.

---

### Markeri

**Fajl:** `src/components/Map/CustomMarker.jsx`

| Tip | Veličina | Opis | Problem |
|---|---|---|---|
| `start` | 36×44px | Zeleni pin, SVG kuća unutra | Ikona liči na kuću (dom), ne "polazište". Trebalo bi slovo "A" ili strelica. |
| `end` | 36×44px | Plavi pin, SVG "F" oblik unutra | SVG path crta nešto što liči na slovo F, ne destinaciju. Treba "B" ili zastava. |
| `stop` | 36×44px | Narandžasti pin, broj unutra | Ispravno i konzistentno sa brendom. |
| `poi` | 24×24px | Obojen krug sa belim centrom | **Kritično:** 24px je ispod 44px minimum touch targeta. Na mobilnom neprecizno. |

**Nedostaje tip `suggestion` (kurirana stanica koja još nije dodana).**
Trenutno ne postoji vizuelna razlika između:
- Dodatog waypointa (potvrđena stanica u ruti)
- Predloga iz Geoapify (POI koji korisnik razmatra)
- Buduće kuriran Drumko preporuke

Svi se prikazuju kroz `CustomMarker` sa istim pinovima — korisnik nema
vizuelni signal koji je "zvanična Drumko preporuka".

---

### Clustering

**Nema klasteringa.** `POILayer` renderuje sve POI-eve direktno kao
`CustomMarker`. `useGeoapify` uzorkuje rutu na svakih 80km i šalje paralelne
upite sa `limit: 100` po tački. Za 400km rutu → 5 tačaka → do 500 markera
simultano. Leaflet ne klasteruje ovo automatski. Rezultat: browser lag,
vizuelni haos, nemoguće kliknuti tačnu lokaciju.

---

### Popup i interakcija

**`StopPopup`** (`src/components/Map/StopPopup.jsx`): Tekstualni popup sa
textarea za beleške. Funkcionalan ali bez ikakve vizuelne hijerarhije — ime
stanice i textarea su iste veličine.

**`POIPopup`**: Ime + kategorija + "Dodaj" dugme. Sadrži `map.closePopup()`
poziv posle 700ms pri dodavanju — efekat je OK ali magic number.

**Popup na mobilnom:** Popup se otvara prema gore (`popupAnchor: [0, -44]`).
Na niskim zumovima ili kad je marker blizu vrha ekrana, popup izlazi van
vidnog polja. Leaflet pokušava automatski da repozicionira ali ne uvek uspešno.

---

### Loading i empty states

- **Nema loading state na mapi** dok OSRM ruta učitava. Mapa prikazuje markere
  bez rute, što je zbunjujuće.
- **Nema empty state poruke** na mapi samoj (samo u `SwipeStops`).
- **`TripStatsBar`** prikazuje 0km/0min dok ruta nije učitana — nema skeleton
  ni placeholder.
- **`ZoomControls`** uvek vidljivi, čak i pre nego što ima sadržaj.

---

## 0.3 Predlog data modela — Supabase šema

### PostGIS i geography kolona

```sql
-- Omogući PostGIS (ako nije već aktivan u projektu)
create extension if not exists postgis;

create table public.curated_stops (
  -- Identifikacija
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  verified_at   timestamptz,

  -- Lokacija
  lat           double precision not null,
  lng           double precision not null,
  location      geography(POINT, 4326) generated always as (
                  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
                ) stored,

  -- Naziv i opis
  name          text not null,
  description_sr text,
  description_en text,

  -- Kategorija
  -- Enum vrednosti mogu se proširiti ALTER TYPE
  category      text not null check (category in (
                  'playground', 'restaurant', 'landmark', 'gas_food',
                  'toilet', 'beach', 'rest_area', 'viewpoint', 'museum',
                  'picnic', 'fuel', 'hotel'
                )),

  -- Mediji
  primary_image_url     text,
  additional_images     text[] default '{}',
  external_link         text,  -- Google Maps URL ili zvanični sajt

  -- Porodični faktori
  child_friendly_score  smallint check (child_friendly_score between 1 and 5),
  has_toilet            boolean default false,
  has_parking           boolean default false,
  has_food              boolean default false,
  has_changing_table    boolean default false,

  -- Preporuka za pauzu
  -- Npr. 90 = "dobro za pauzu posle 90 min vožnje"
  best_after_minutes    smallint,

  -- Putni koridor (opcionalno — fallback ako ne koristimo geo radius)
  road_corridor         text,  -- npr. 'E75-S', 'M22', 'A1'

  -- Kvalitet podataka
  is_active             boolean default true,
  last_visited_at       timestamptz
);

-- Indeks za brzo geo pretraživanje
create index curated_stops_location_idx
  on public.curated_stops using gist(location);

-- Indeks na aktivnost (uvek filtriramo is_active=true)
create index curated_stops_active_idx
  on public.curated_stops(is_active)
  where is_active = true;
```

### RLS politike

```sql
alter table public.curated_stops enable row level security;

-- Svi mogu čitati aktivne stanice
create policy "Public read active stops"
  on public.curated_stops for select
  using (is_active = true);

-- Samo autentifikovani admin može pisati
-- (za sada: svaki prijavljen user je "admin" — zaključati kad bude više korisnika)
create policy "Auth users can insert"
  on public.curated_stops for insert
  with check (auth.role() = 'authenticated');

create policy "Auth users can update own stops"
  on public.curated_stops for update
  using (auth.uid() = created_by);
```

### RPC funkcija za query po koridoru rute

```sql
-- Vraća sve aktivne kuriran stanice unutar `buffer_meters` od bilo koje
-- tačke na GeoJSON LineString geometriji rute.
create or replace function get_stops_along_route(
  route_geometry  jsonb,        -- GeoJSON LineString iz OSRM
  buffer_meters   float default 5000
)
returns setof public.curated_stops
language sql stable
as $$
  select s.*
  from public.curated_stops s
  where s.is_active = true
    and ST_DWithin(
      s.location,
      ST_GeomFromGeoJSON(route_geometry::text)::geography,
      buffer_meters
    )
  order by
    -- Primarno: redosled duž rute (projekcija tačke na liniju)
    ST_LineLocatePoint(
      ST_GeomFromGeoJSON(route_geometry::text),
      ST_Transform(s.location::geometry, 4326)
    );
$$;
```

**Zašto `ST_DWithin` na `geography`?**  
`geography` tip automatski koristi sferne distance (metre, ne stepeni),
pa `buffer_meters=5000` zaista znači 5km bez konverzije. PostGIS GIST indeks
na geography koloni čini ovaj query **O(log n)** umesto sekvencijalnog skena.
Na 1000 stanica, query < 5ms. Na 100 000 stanica, query < 50ms.

---

## 0.4 Plan hibridne logike

### Varijanta A — "Supabase-first, Geoapify kao fallback"

```
1. OSRM → izračunaj rutu (polyline + duration)
2. Supabase RPC get_stops_along_route(polyline, 5000m)
   → vrati listu kuriranih stanica, sortirano po poziciji na ruti
3. Ako kuriranih >= THRESHOLD (predlog: 3):
     → koristi samo kuriran, ignoriši Geoapify za predloge
4. Ako kuriranih < THRESHOLD:
     → dodaj Geoapify POI-eve da popuniš do potrebnog broja
     → svaki result dobija { source: 'curated' | 'geoapify' }
5. useSmartStops prima mešani pool i primenjuje vremensku logiku:
     → na osnovu OSRM duration (ne fiksnog 90km/h)
     → pauza svakih ~90min (konfigurabilno)
     → min 30min razmak između predloga
     → max 1 predlog iste kategorije u nizu
```

**Trade-offs:**
- `+` Jednostavna logika prioriteta, jasno šta "pobedi"
- `+` Kuriran uvek vidan korisniku, gradi poverenje u brend
- `-` Ako kurirani ne pokrivaju deo rute (npr. nova deonica), korisnik
  vidi Geoapify bez upozorenja da je to "slabije"
- `-` `THRESHOLD=3` je arbitraran — 3 stanice za 600km rutu je malo

---

### Varijanta B — "Score-based merge sa vidljivim izvorom"

```
1. OSRM → izračunaj rutu
2. Paralelno:
   a) Supabase RPC → kuriran stanice u koridoru
   b) Geoapify Places → POI-evi duž rute (vec se izvrsava)
3. Dodeli score svakome:
   curated:  base_score = 100
   geoapify: base_score = 40
   + proximity_bonus = max(0, 20 - distanceFromRouteLine_km * 4)
   + category_bonus:  attraction=10, restaurant=5, fuel=0
4. Za svaki vremenski slot (90min intervali):
   → uzmi top-scored kandidata iz poola koji NIJE iste kategorije
     kao prethodni predlog
5. Svaki predlog nosi { source, score, distanceFromRoute }
   UI prikazuje jasno: "Drumko preporuka" vs "Iz javne baze"
```

**Trade-offs:**
- `+` Graceful degradation — ni jedan slot nije prazan
- `+` Kuriran i Geoapify mogu koegzistirati u istoj ruti bez hard cutoff
- `+` Score je transparentan, može se tuniti
- `-` Složenija logika, teže testirati
- `-` Korisnik može videti Geoapify POI sa score 60 iznad kurirane sa score 50
  ako je Geoapify bliži ruti — može izgledati kontratuitivno
- `-` Dva paralelna API poziva uvek, čak i kad ima dosta kurirani stanica

---

### Moja preporuka

**Varijanta A za Fazu 1 i 2**, uz jedan amandman:

Umesto hard `THRESHOLD`, uvedi **slot-level fallback**:
- Za svaki vremenski slot, prvo pokušaj kurirani u 10km radijusu od slot tačke
- Ako nema kurirani, uzmi Geoapify
- Označi svaki rezultat sa `source`

Ovako korisnik uvek dobija predlog za svaki slot, kuriran dobijaju prioritet
lokalno (ne globalno), i logika ostaje čitljiva. Varijanta B se može uvesti
u Fazi 3 kada bude dovoljno kurirani podataka da se testira score tuning.

---

## Sledeći koraci (čeka potvrdu)

- [ ] **0.1** Prihvaćen / komentar na useSmartStops analizu
- [ ] **0.2** Potvrda tile provajdera (Stadia?) i šta od mape da se radi u Fazi 3
- [ ] **0.3** Potvrda šeme (dodati kolone? izmeniti kategorije?)
- [ ] **0.4** Varijanta A sa slot-level fallback — da li je to plan?

Posle potvrde, krenem sa **Fazom 1** — Supabase migracija i admin form.
