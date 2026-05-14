-- ============================================================
-- EPIC B: curated_stops seed v2
-- Run AFTER curated_stops_v2.sql.
--
-- This script:
--   1) UPDATE-uje postojećih 9 redova (iz curated_stops.sql) sa novim poljima
--   2) INSERT-uje ~22 nove stanice raspoređene po 3 koridora:
--      - BG-BU  (Beograd → Crna Gora obala)
--      - BG-GR  (Beograd → Grčka / Halkidiki / Solun, preko Niša)
--      - NS-ZL  (Novi Sad → Zlatibor / Tara)
--
-- TODO oznake:
--   "-- TODO: verify lat/lng" — koordinate su približne, verifikuj pre produkcije
--   "-- TODO: verify copy"    — copy je predlog, prepravi ako ne zvuči autentično
-- ============================================================

-- ============================================================
-- (1) UPDATE postojećih redova — popuni nova polja
-- ============================================================

UPDATE public.curated_stops SET
  copy_sr = 'Centar grada na Moravi — dobra pauza za kafu ili ručak na pola puta.',
  copy_en = 'Town center on the Morava — solid coffee or lunch stop halfway down.',
  kid_friendly_score = 3,
  has_toilet  = true,
  has_parking = true,
  has_food    = true,
  has_shade   = true,
  best_time_of_day = ARRAY['morning','lunch','afternoon'],
  best_season      = ARRAY['all'],
  road_corridors   = ARRAY['BG-BU','NS-ZL'],
  slot_types       = ARRAY['meal','rest'],
  detour_minutes   = 5,
  price_tier       = 1
WHERE name = 'Čačak';

UPDATE public.curated_stops SET
  copy_sr = 'Mirna dolina između Ovčara i Kablara — kratka šetnja uz reku, lep za fotke.',
  copy_en = 'Quiet valley between Ovcar and Kablar — short riverside walk, great photos.',
  kid_friendly_score = 4,
  has_toilet  = false,
  has_parking = true,
  has_food    = false,
  has_shade   = true,
  best_time_of_day = ARRAY['morning','afternoon'],
  best_season      = ARRAY['spring','summer','fall'],
  road_corridors   = ARRAY['BG-BU','NS-ZL'],
  slot_types       = ARRAY['scenic'],
  detour_minutes   = 8,
  price_tier       = 1
WHERE name = 'Požeška Kotlina';

UPDATE public.curated_stops SET
  copy_sr = 'Planinski resort sa parkovima i restoranima — idealno za dužu pauzu sa decom.',
  copy_en = 'Mountain resort with parks and restaurants — ideal for a longer family break.',
  kid_friendly_score = 5,
  has_playground = true,
  has_toilet     = true,
  has_parking    = true,
  has_food       = true,
  has_shade      = true,
  best_time_of_day = ARRAY['morning','lunch','afternoon'],
  best_season      = ARRAY['all'],
  road_corridors   = ARRAY['BG-BU','NS-ZL'],
  slot_types       = ARRAY['playground','meal','rest','scenic'],
  detour_minutes   = 5,
  price_tier       = 2
WHERE name = 'Zlatibor';

UPDATE public.curated_stops SET
  copy_sr = 'Manastir iz 13. veka, freska Beli Anđeo — kratka stanka od magistrale.',
  copy_en = 'Thirteenth-century monastery, famous White Angel fresco — short detour off the main road.',
  kid_friendly_score = 3,
  has_toilet  = true,
  has_parking = true,
  has_food    = false,
  has_shade   = true,
  best_time_of_day = ARRAY['morning','afternoon'],
  best_season      = ARRAY['all'],
  road_corridors   = ARRAY['BG-BU'],
  slot_types       = ARRAY['scenic'],
  detour_minutes   = 10,
  price_tier       = 1
WHERE name = 'Prijepolje — Manastir Mileševa';

UPDATE public.curated_stops SET
  copy_sr = 'Prva veća crnogorska varoš posle granice — dobro mesto za gorivo i osveženje.',
  copy_en = 'First Montenegrin town past the border — good spot for fuel and a quick break.',
  kid_friendly_score = 2,
  has_toilet  = true,
  has_parking = true,
  has_food    = true,
  has_shade   = false,
  best_time_of_day = ARRAY['morning','lunch','afternoon','evening'],
  best_season      = ARRAY['all'],
  road_corridors   = ARRAY['BG-BU'],
  slot_types       = ARRAY['fuel','rest'],
  detour_minutes   = 2,
  price_tier       = 1
WHERE name = 'Bijelo Polje';

UPDATE public.curated_stops SET
  copy_sr = 'Planinsko mesto pored Tare — odlično za osveženje i ručak u hladu.',
  copy_en = 'Mountain town near the Tara — refreshing stop, lunch in the shade.',
  kid_friendly_score = 4,
  has_toilet  = true,
  has_parking = true,
  has_food    = true,
  has_shade   = true,
  best_time_of_day = ARRAY['lunch','afternoon'],
  best_season      = ARRAY['summer','spring','fall'],
  road_corridors   = ARRAY['BG-BU'],
  slot_types       = ARRAY['meal','scenic','rest'],
  detour_minutes   = 5,
  price_tier       = 2
WHERE name = 'Kolašin';

UPDATE public.curated_stops SET
  copy_sr = 'Manastir iz 13. veka u klisuri Morače — obavezna stanka, ima parking.',
  copy_en = 'Thirteenth-century monastery in the Moraca canyon — must-stop, parking on-site.',
  kid_friendly_score = 3,
  has_toilet  = true,
  has_parking = true,
  has_food    = false,
  has_shade   = true,
  best_time_of_day = ARRAY['morning','lunch','afternoon'],
  best_season      = ARRAY['all'],
  road_corridors   = ARRAY['BG-BU'],
  slot_types       = ARRAY['scenic'],
  detour_minutes   = 0,
  price_tier       = 1
WHERE name = 'Manastir Morača';

UPDATE public.curated_stops SET
  copy_sr = 'Selo na Skadarskom jezeru — degustacija vina i krstarenje brodom.',
  copy_en = 'Lakeside village on Skadar — wine tasting and boat tours.',
  kid_friendly_score = 4,
  has_toilet  = true,
  has_parking = true,
  has_food    = true,
  has_shade   = true,
  best_time_of_day = ARRAY['lunch','afternoon'],
  best_season      = ARRAY['spring','summer','fall'],
  road_corridors   = ARRAY['BG-BU'],
  slot_types       = ARRAY['scenic','meal'],
  detour_minutes   = 10,
  price_tier       = 2
WHERE name = 'Virpazar';

UPDATE public.curated_stops SET
  copy_sr = 'Mala plaža i venecijanska tvrđava — savršena stanka 20 min pre Budve.',
  copy_en = 'Small beach and Venetian fort — perfect stop 20 minutes before Budva.',
  kid_friendly_score = 5,
  has_toilet  = true,
  has_parking = true,
  has_food    = true,
  has_shade   = true,
  best_time_of_day = ARRAY['lunch','afternoon','evening'],
  best_season      = ARRAY['spring','summer','fall'],
  road_corridors   = ARRAY['BG-BU'],
  slot_types       = ARRAY['scenic','meal','rest'],
  detour_minutes   = 3,
  price_tier       = 2
WHERE name = 'Petrovac na Moru';


-- ============================================================
-- (2) INSERT — nove stanice po koridorima
-- ============================================================

-- ── KORIDOR BG-BU (Beograd → Crna Gora obala) ──────────────

INSERT INTO public.curated_stops
  (name, description, copy_sr, copy_en, lat, lng, category, image_url, tags,
   kid_friendly_score, has_playground, has_toilet, has_parking, has_food, has_shade,
   best_time_of_day, best_season, road_corridors, slot_types, detour_minutes, price_tier, rating)
VALUES
-- TODO: verify lat/lng (Lazarevac centar)
('Lazarevac — Park kod fontane',
 'Centralni gradski park sa igralištem i kafe-baštom u senci.',
 'Posle prvog sata vožnje — deca mogu da istrče energiju, kafa za roditelje.',
 'After the first hour — kids can run off some energy while parents grab a coffee.',
 44.3856, 20.2589, 'rest_area', NULL,
 ARRAY['park','igraliste','kafa'],
 5, true, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['spring','summer','fall','all'],
 ARRAY['BG-BU','BG-GR'], ARRAY['playground','rest'], 3, 1, 4.3),

-- TODO: verify lat/lng (Užice centar / Mali Park)
('Užice — Gradski centar',
 'Pešačka zona sa kafićima i restoranima, parking u blizini.',
 'Pred Zlatibor — ručak u centru ili samo brzo razgibavanje uz reku.',
 'Just before Zlatibor — lunch in the centre or a quick stretch along the river.',
 43.8556, 19.8425, 'restaurant', NULL,
 ARRAY['grad','hrana','reka'],
 4, false, true, true, true, true,
 ARRAY['lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-BU'], ARRAY['meal','rest'], 8, 2, 4.0),

-- TODO: verify lat/lng (Podgorica izlaz ka Budvi)
('Podgorica — Pauza pre tunela Sozina',
 'Poslednji veći grad pre tunela ka primorju — gorivo, klimatizovan ručak.',
 'Pre tunela Sozina — natankaj i pojedi nešto pre poslednjeg dela puta.',
 'Before the Sozina tunnel — fuel up and grab a bite for the home stretch.',
 42.4304, 19.2594, 'fuel', NULL,
 ARRAY['grad','gorivo','hrana'],
 3, false, true, true, true, false,
 ARRAY['lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-BU'], ARRAY['fuel','meal'], 5, 2, 3.8),

-- TODO: verify lat/lng (Sveti Stefan vidikovac)
('Sveti Stefan — Vidikovac',
 'Pogled na čuveno ostrvo-hotel sa magistralnog puta.',
 'Sveti Stefan se vidi sa parkinga — 5 minuta, jedna fotografija za uspomenu.',
 'Sveti Stefan visible from the lay-by — 5 minutes for the iconic photo.',
 42.2570, 18.8920, 'viewpoint', NULL,
 ARRAY['vidikovac','more','fotografija'],
 3, false, false, true, false, false,
 ARRAY['morning','lunch','afternoon','evening'], ARRAY['spring','summer','fall'],
 ARRAY['BG-BU'], ARRAY['scenic'], 0, 1, 4.5),


-- ── KORIDOR BG-GR (Beograd → Grčka / Solun) ────────────────

-- TODO: verify lat/lng (Pojate — popularan rest stop na E-75)
('Pojate — Stari Han',
 'Klasičan restoran na auto-putu BG-Niš, poznat po roštilju.',
 'Klasična pauza na putu za jug — roštilj i parking u hladu.',
 'Classic southbound stop — grill food and shaded parking.',
 43.6420, 21.3850, 'restaurant', NULL,
 ARRAY['restoran','rostilj','autoput'],
 4, true, true, true, true, true,
 ARRAY['lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['meal','playground','rest'], 1, 2, 4.1),

-- TODO: verify lat/lng (Niš tvrđava parking)
('Niš — Tvrđava',
 'Velika gradska tvrđava sa parkom i kafićima unutar zidina.',
 'Niška Tvrđava — šetnja u senci, deca trče po travi, kafa na izlazu.',
 'Nis Fortress — shaded walk, kids on the grass, coffee on the way out.',
 43.3253, 21.8950, 'attraction', NULL,
 ARRAY['tvrdjava','park','grad'],
 5, true, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['scenic','playground','meal'], 7, 1, 4.6),

-- TODO: verify lat/lng (Predejane motel/restorani)
('Predejane — Roštilj kuće',
 'Niz tradicionalnih restorana južno od Leskovca, poznat po pljeskavici.',
 'Klasika — pljeskavica, parking pored puta, ne treba skretati.',
 'Classic — Serbian burger, roadside parking, no detour required.',
 42.8540, 22.1480, 'restaurant', NULL,
 ARRAY['restoran','rostilj','pljeskavica'],
 3, false, true, true, true, true,
 ARRAY['lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['meal'], 0, 1, 4.3),

-- TODO: verify lat/lng (Vranje benzinska)
('Vranje — Pauza pre granice',
 'Poslednja veća stanica u Srbiji pre prelaza Preševo — gorivo i toalet.',
 'Pre Preševa — natankaj i toalet, redovi na granici znaju biti dugi.',
 'Before the Presevo border — fuel and toilets, queues can be long.',
 42.5544, 21.9000, 'fuel', NULL,
 ARRAY['gorivo','granica','toalet'],
 2, false, true, true, true, false,
 ARRAY['morning','lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['fuel','rest'], 3, 1, 3.5),

-- TODO: verify lat/lng (Kumanovo izlaz u SMK)
('Kumanovo — Prva pauza u SMK',
 'Prvi grad u Severnoj Makedoniji posle granice Tabanovce.',
 'Posle granice — kafa i razgibavanje pre nego što kreneš ka Skopju.',
 'Past the border — coffee and a stretch before heading toward Skopje.',
 42.1322, 21.7144, 'cafe', NULL,
 ARRAY['grad','kafa','smk'],
 3, false, true, true, true, false,
 ARRAY['morning','lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['rest','meal'], 4, 1, 3.6),

-- TODO: verify lat/lng (Demir Kapija vinarije)
('Demir Kapija — Vinarije',
 'Vinski kraj u klisuri Vardara, mesto za degustaciju i pogled.',
 'Skreneš 5 minuta i probaš vino — odrasli uživaju, deca trče po dvorištu.',
 'Five-minute detour for wine tasting — adults sip, kids run around the yard.',
 41.4078, 22.2419, 'attraction', NULL,
 ARRAY['vino','klisura','vidikovac'],
 4, false, true, true, true, true,
 ARRAY['lunch','afternoon'], ARRAY['spring','summer','fall'],
 ARRAY['BG-GR'], ARRAY['scenic','meal'], 8, 2, 4.5),

-- TODO: verify lat/lng (Gevgelija granica + casino zone)
('Gevgelija — Pre granice sa Grčkom',
 'Poslednja stanica u Severnoj Makedoniji — gorivo, hrana, čekanje na granicu.',
 'Pre granice sa Grčkom — natankaj i pojedi nešto, gužve su nepredvidive.',
 'Before the Greek border — fuel up and eat; the queues are unpredictable.',
 41.1400, 22.5036, 'fuel', NULL,
 ARRAY['granica','gorivo','smk'],
 2, false, true, true, true, false,
 ARRAY['morning','lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['fuel','meal'], 3, 1, 3.7),

-- TODO: verify lat/lng (Paralia / Katerini ulaz)
('Paralia — Plaža i taverne',
 'Popularno odmaralište u severnoj Grčkoj, plitka plaža za decu.',
 'Krajnji odmor pre nego što stigneš — plitka plaža i taverne uz more.',
 'Final break before arrival — shallow beach and seaside tavernas.',
 40.2700, 22.5972, 'rest_area', NULL,
 ARRAY['plaza','grcka','taverne'],
 5, true, true, true, true, true,
 ARRAY['lunch','afternoon','evening'], ARRAY['summer','spring','fall'],
 ARRAY['BG-GR'], ARRAY['playground','meal','scenic'], 5, 2, 4.4),

-- TODO: verify lat/lng (Veles centar)
('Veles — Centar',
 'Grad na Vardaru, dobar za kratku pauzu na pola Severne Makedonije.',
 'Polovina puta kroz SMK — brza kafa pored reke i nastavi.',
 'Halfway through North Macedonia — quick coffee by the river and keep going.',
 41.7167, 21.7750, 'cafe', NULL,
 ARRAY['grad','reka','kafa'],
 3, false, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['rest','meal'], 5, 1, 3.5),

-- TODO: verify lat/lng (Leskovac Hisar)
('Leskovac — Roštilj zona',
 'Leskovac je prestonica roštilja — desetine restorana, pljeskavica je obavezna.',
 'Ručak u Leskovcu — pljeskavica vredi skretanja, ima parking i u centru.',
 'Lunch in Leskovac — the burger is worth the detour, parking in town.',
 42.9981, 21.9461, 'restaurant', NULL,
 ARRAY['roštilj','grad','hrana'],
 4, false, true, true, true, true,
 ARRAY['lunch','afternoon','evening'], ARRAY['all'],
 ARRAY['BG-GR'], ARRAY['meal'], 6, 1, 4.4),


-- ── KORIDOR NS-ZL (Novi Sad → Zlatibor / Tara) ─────────────

-- TODO: verify lat/lng (Sremska Mitrovica centar)
('Sremska Mitrovica — Setalište uz Savu',
 'Stari rimski Sirmium, setalište uz Savu i kafane u centru.',
 'Lepa rana pauza — šetnja uz Savu i kafa u senci u centru.',
 'Nice early stop — Sava riverside walk and a shaded coffee downtown.',
 44.9694, 19.6122, 'rest_area', NULL,
 ARRAY['reka','grad','setaliste'],
 4, true, true, true, true, true,
 ARRAY['morning','lunch'], ARRAY['spring','summer','fall'],
 ARRAY['NS-ZL'], ARRAY['rest','playground'], 4, 1, 4.0),

-- TODO: verify lat/lng (Šabac centar / park kraj Save)
('Šabac — Park uz Savu',
 'Glavni gradski park sa igralištem i kafićima uz reku.',
 'Park uz Savu — igralište i osveženje pre nego što presečeš ka Valjevu.',
 'Riverside park — playground and refreshments before turning toward Valjevo.',
 44.7494, 19.6906, 'rest_area', NULL,
 ARRAY['park','reka','igraliste'],
 5, true, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['spring','summer','fall'],
 ARRAY['NS-ZL'], ARRAY['playground','rest'], 5, 1, 4.1),

-- TODO: verify lat/lng (Banja Koviljača parking)
('Banja Koviljača — Park i banja',
 'Stari banjski park sa setalištima i bistroima — prijatno čak i bez tretmana.',
 'Stari banjski park — šetnja kroz drveće, lakši ručak na otvorenom.',
 'Old spa park — stroll under the trees, lighter lunch outdoors.',
 44.5114, 19.2200, 'attraction', NULL,
 ARRAY['banja','park','priroda'],
 4, true, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['spring','summer','fall'],
 ARRAY['NS-ZL'], ARRAY['scenic','rest','playground'], 12, 2, 4.2),

-- TODO: verify lat/lng (Valjevo centar / Tešnjar)
('Valjevo — Tešnjar',
 'Stara čaršija sa kaldrmom, kafanama i pekarama.',
 'Tešnjar — stara čaršija, brza burek pauza pre planinskog dela puta.',
 'Tesnjar — old quarter, quick bakery break before the mountain leg.',
 44.2700, 19.8836, 'cafe', NULL,
 ARRAY['grad','carsija','pekara'],
 3, false, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['all'],
 ARRAY['NS-ZL'], ARRAY['rest','meal'], 4, 1, 4.0),

-- TODO: verify lat/lng (Mokra Gora stanica Šargan)
('Mokra Gora — Šarganska osmica',
 'Stara uskotračna pruga koja se penje uz planinu — vožnja vozićem.',
 'Šarganska osmica — vožnja starim vozićem, deca obožavaju.',
 'Sarganska Osmica — narrow-gauge train ride, kids love it.',
 43.7869, 19.5083, 'attraction', NULL,
 ARRAY['voz','planina','atrakcija'],
 5, true, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['spring','summer','fall'],
 ARRAY['NS-ZL'], ARRAY['scenic','playground'], 15, 2, 4.7),

-- TODO: verify lat/lng (Drvengrad / Mećavnik)
('Drvengrad — Mećavnik',
 'Etno-selo Emira Kusturice, drvene kuće na planini.',
 'Drvengrad — drveno selo na planini, lep za šetnju i ručak.',
 'Drvengrad — wooden village on the mountain, nice for a walk and lunch.',
 43.7986, 19.5078, 'attraction', NULL,
 ARRAY['etno','planina','kultura'],
 4, true, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['all'],
 ARRAY['NS-ZL'], ARRAY['scenic','meal','playground'], 15, 2, 4.5),

-- TODO: verify lat/lng (Tara NP vidikovac Banjska Stena)
('Tara — Vidikovac Banjska Stena',
 'Stena nad jezerom Perućac — jedan od najpoznatijih pogleda u Srbiji.',
 'Banjska Stena — pogled na Drinu, treba malo do skretanja ali vredi.',
 'Banjska Stena — Drina canyon view, a small detour that is worth it.',
 43.9389, 19.4011, 'viewpoint', NULL,
 ARRAY['vidikovac','planina','drina'],
 3, false, true, true, false, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['spring','summer','fall'],
 ARRAY['NS-ZL'], ARRAY['scenic'], 20, 1, 4.8),

-- TODO: verify lat/lng (Sirogojno muzej)
('Sirogojno — Muzej na otvorenom',
 'Etno selo sa starim kućama iz Zlatiborskog kraja, otvoreni muzej.',
 'Sirogojno — staro selo pretvoreno u muzej, kafa sa pogledom na livade.',
 'Sirogojno — old village turned open-air museum, coffee with meadow views.',
 43.7522, 19.8794, 'museum', NULL,
 ARRAY['muzej','etno','priroda'],
 4, false, true, true, true, true,
 ARRAY['morning','lunch','afternoon'], ARRAY['all'],
 ARRAY['NS-ZL'], ARRAY['scenic','meal'], 12, 2, 4.4);
