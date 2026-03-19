/**
 * UI translations — English (primary) + Serbian (secondary).
 * Used as bilingual labels throughout the app.
 */
export const t = {
  // Navigation
  myTrips:        { en: 'My Trips',       sr: 'Moja putovanja' },
  newTrip:        { en: 'New Trip',       sr: 'Nova ruta' },
  editTrip:       { en: 'Edit Trip',      sr: 'Uredi putovanje' },
  back:           { en: 'Back',           sr: 'Nazad' },

  // Welcome
  tagline:        { en: 'Your family road trip, perfectly planned.', sr: 'Porodično putovanje, savršeno isplanirano.' },
  appName:        { en: 'Drumko', sr: 'Drumko' },
  planNewTrip:    { en: 'Plan New Trip',  sr: 'Planiraj putovanje' },

  // Wizard steps
  stepBasics:     { en: 'Trip Basics',    sr: 'Osnove' },
  stepRoute:      { en: 'Route & Stops',  sr: 'Ruta i stanice' },
  stepPacking:    { en: 'Packing List',   sr: 'Lista pakovanja' },
  stepBudget:     { en: 'Budget',         sr: 'Budžet' },

  // Trip detail tabs
  overview:       { en: 'Overview',       sr: 'Pregled' },
  map:            { en: 'Map',            sr: 'Mapa' },
  stops:          { en: 'Stops',          sr: 'Stanice' },
  packing:        { en: 'Packing',        sr: 'Pakovanje' },
  budget:         { en: 'Budget',         sr: 'Budžet' },

  // Trip basics form
  tripName:       { en: 'Trip Name',      sr: 'Naziv putovanja' },
  startDate:      { en: 'Start Date',     sr: 'Datum polaska' },
  endDate:        { en: 'End Date',       sr: 'Datum povratka' },
  adults:         { en: 'Adults',         sr: 'Odrasli' },
  children:       { en: 'Children',       sr: 'Deca' },
  startCity:      { en: 'Starting City',  sr: 'Grad polaska' },
  destination:    { en: 'Destination',    sr: 'Odredište' },

  // Stops
  stopsTitle:     { en: 'Stops',          sr: 'Stanice na putu' },
  addNotes:       { en: 'Add notes for this stop...', sr: 'Dodaj beleške za ovu stanicu...' },
  noStops:        { en: 'No stops yet',   sr: 'Nema stanica' },
  driveFrom:      { en: 'from previous',  sr: 'od prethodne' },

  // Packing
  packingTitle:   { en: 'Packing List',   sr: 'Lista pakovanja' },
  addItem:        { en: 'Add something to pack...', sr: 'Dodaj stavku za pakovanje...' },
  resetAll:       { en: 'Reset all',      sr: 'Resetuj sve' },
  allPacked:      { en: "All packed! You're ready to hit the road!", sr: 'Sve spakovano! Krenimo na put!' },
  filterAll:      { en: 'All',            sr: 'Sve' },
  filterTodo:     { en: 'Todo',           sr: 'Za pakovanje' },
  filterDone:     { en: 'Done',           sr: 'Spakovano' },

  // Budget
  budgetTitle:    { en: 'Budget',         sr: 'Budžet putovanja' },
  totalBudget:    { en: 'Total Budget',   sr: 'Ukupan budžet' },
  budgetHint:     { en: 'Categories are auto-allocated. Adjust freely.', sr: 'Kategorije su automatski raspoređene. Slobodno prilagodi.' },
  currency:       { en: 'Currency',       sr: 'Valuta' },
  spent:          { en: 'Spent',          sr: 'Potrošeno' },
  remaining:      { en: 'Remaining',      sr: 'Preostalo' },
  logExpense:     { en: 'Log Expense',    sr: 'Dodaj trošak' },
  expenses:       { en: 'Expenses',       sr: 'Troškovi' },
  addExpense:     { en: 'Add Expense',    sr: 'Dodaj' },
  description:    { en: 'Description',    sr: 'Opis' },

  // Overview
  days:           { en: 'Days',           sr: 'Dana' },
  distance:       { en: 'Distance',       sr: 'Rastojanje' },
  driveTime:      { en: 'Drive Time',     sr: 'Vreme vožnje' },
  travelers:      { en: 'Travelers',      sr: 'Putnici' },
  tripInfo:       { en: 'Trip Info',      sr: 'Info o putovanju' },
  dates:          { en: 'Dates',          sr: 'Datumi' },
  shareTrip:      { en: 'Share Trip',     sr: 'Podeli putovanje' },
  deleteTrip:     { en: 'Delete Trip',    sr: 'Obriši putovanje' },

  // Empty states
  noTripsYet:     { en: 'No trips yet',   sr: 'Nema putovanja' },
  noTripsDesc:    { en: 'Start planning your family road trip adventure!', sr: 'Počnite da planirate vaše porodično putovanje!' },
  planFirst:      { en: 'Plan Your First Trip', sr: 'Planiraj prvo putovanje' },

  // Budget categories
  catFuel:        { en: 'Fuel',           sr: 'Gorivo' },
  catAccomm:      { en: 'Accommodation',  sr: 'Smeštaj' },
  catFood:        { en: 'Food & Drinks',  sr: 'Hrana i piće' },
  catActivities:  { en: 'Activities',     sr: 'Aktivnosti' },
  catOther:       { en: 'Other',          sr: 'Ostalo' },

  // Common
  save:           { en: 'Save Trip',      sr: 'Sačuvaj' },
  saveChanges:    { en: 'Save Changes',   sr: 'Sačuvaj izmene' },
  next:           { en: 'Next',           sr: 'Dalje' },
  start:          { en: 'Start',          sr: 'Polazak' },
}

/** Just return the English string (for placeholders/aria labels) */
export function tr(k) {
  return t[k]?.en ?? k
}
