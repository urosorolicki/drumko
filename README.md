<div align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Drumko logo" />
  <h1>Drumko</h1>
  <p><strong>Planer porodičnih putovanja</strong></p>
  <p>
    <a href="https://drumko.app">drumko.app</a> ·
    <a href="https://drumko.app/support">Podrška</a> ·
    <a href="https://drumko.app/privacy">Privatnost</a>
  </p>
  <img src="public/og-image.png" alt="Drumko preview" width="600" />
</div>

---

## O projektu

Drumko je web aplikacija za planiranje porodičnih i grupnih putovanja. Korisnici mogu da kreiraju rutu, dodaju stanice, prate budžet i pripreme listu za pakovanje — sve na jednom mestu.

**Živi na:** [https://drumko.app](https://drumko.app)

## Funkcionalnosti

- **Planiranje rute** — izbor grada polaska, odredišta i međustanica
- **Interaktivna mapa** — prikaz rute, dodavanje stanica klikom na mapu
- **Budžet** — praćenje troškova po kategorijama, statistike po osobi i danu
- **Lista za pakovanje** — personalizovana checklista
- **Autentifikacija** — prijava emailom ili Google nalogom
- **Višejezičnost** — srpski i engleski
- **Mobilni dizajn** — optimizovano za telefone

## Tech stack

| Kategorija | Tehnologija |
|---|---|
| Frontend | React 19 + Vite |
| Stilizovanje | Tailwind CSS 4 |
| Animacije | Framer Motion |
| Baza / Auth | Supabase |
| Mape | Leaflet + React Leaflet |
| Rutiranje | OSRM |
| Geokodiranje | Geoapify |
| State management | Zustand |
| Forma za kontakt | Formspree |
| Deploy | Vercel |

## Pokretanje lokalno

```bash
# Kloniraj repo
git clone https://github.com/urosorolicki/drumko.git
cd drumko

# Instaliraj zavisnosti
npm install

# Kopiraj env varijable
cp .env.example .env
# Popuni VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEOAPIFY_API_KEY

# Pokreni dev server
npm run dev
```

## Environment varijable

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEOAPIFY_API_KEY=
```

## Kontakt

Za pitanja i podršku: [drumko@drumko.app](mailto:drumko@drumko.app)
