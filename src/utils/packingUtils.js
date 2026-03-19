/**
 * Create a single packing-list item.
 * @param {string} category
 * @param {string} name
 * @returns {{ id: string, category: string, name: string, checked: boolean }}
 */
function createItem(category, name) {
  return {
    id: crypto.randomUUID(),
    category,
    name,
    checked: false,
  };
}

/**
 * Generate a full packing list tailored to the trip parameters.
 *
 * @param {number} [tripDays=3] - Number of days the trip will last
 * @param {number} [adults=2] - Number of adults travelling
 * @param {number} [children=0] - Number of children travelling (0 omits the Kids category)
 * @returns {Array<{ id: string, category: string, name: string, checked: boolean }>}
 */
export function generatePackingList(tripDays = 3, adults = 2, children = 0) {
  const totalPeople = adults + children;
  const items = [];

  // ── Dokumenti ──────────────────────────────────────────────────────────
  const documents = [
    'Lične karte / pasoši',
    'Putno osiguranje',
    'Saobraćajna dozvola',
    'Vozačka dozvola',
    'Zdravstvene knjižice',
  ];
  documents.forEach((name) => items.push(createItem('Dokumenti', name)));

  // ── Deca (only when children > 0) ─────────────────────────────────────
  if (children > 0) {
    const kidsItems = [
      `Auto sedište (\u00d7${children})`,
      'Igračke',
      'Grickalice za decu',
      'Bojanka i bojice',
      `Odeća za decu (\u00d7${children * 2})`,
      'Pelene (ako treba)',
      'Hrana za bebe (ako treba)',
      'Kolica (ako treba)',
    ];
    kidsItems.forEach((name) => items.push(createItem('Deca', name)));
  }

  // ── Garderoba ────────────────────────────────────────────────────────────
  const tShirts = tripDays * totalPeople;
  const underwear = tripDays * totalPeople;
  const pants = Math.ceil(tripDays / 2) * totalPeople;

  const clothes = [
    `Majice (\u00d7${tShirts})`,
    `Veš (\u00d7${underwear})`,
    `Pantalone / šorc (\u00d7${pants})`,
    `Laka jakna (\u00d7${totalPeople})`,
    `Kupaći kostim (\u00d7${totalPeople})`,
    `Pidžama (\u00d7${totalPeople})`,
    `Udobna obuća (\u00d7${totalPeople})`,
    `Sandale / japanke (\u00d7${totalPeople})`,
  ];
  clothes.forEach((name) => items.push(createItem('Garderoba', name)));

  // ── Auto ────────────────────────────────────────────────────────────────
  const car = [
    'Prva pomoć',
    'Kablovi za startovanje',
    'Rezervna guma (proveri stanje)',
    'Trougao za opasnost',
    'Baterijska lampa',
    'Punjač za telefon (auto)',
    'Mirisni osveživač',
  ];
  car.forEach((name) => items.push(createItem('Auto', name)));

  // ── Hrana i piće ─────────────────────────────────────────────────────
  const foodDrinks = [
    'Frižider torba',
    `Flašice vode (\u00d7${totalPeople})`,
    'Grickalice za put',
    'Termos',
  ];
  foodDrinks.forEach((name) => items.push(createItem('Hrana i piće', name)));

  // ── Zabava ─────────────────────────────────────────────────────────────
  const entertainment = [
    'Tablet / iPad',
    `Slušalice (\u00d7${totalPeople})`,
    'Putne igre',
    'Knjige',
    'Preuzeti filmovi / muzika',
  ];
  entertainment.forEach((name) => items.push(createItem('Zabava', name)));

  // ── Toaletne potrepštine ────────────────────────────────────────────────
  const toiletries = [
    'Krema za sunčanje',
    `Četkica i pasta za zube (\u00d7${totalPeople})`,
    'Šampon',
    'Lekovi',
    'Sredstvo protiv insekata',
    'Vlažne maramice',
  ];
  toiletries.forEach((name) => items.push(createItem('Toaletne potrepštine', name)));

  return items;
}
