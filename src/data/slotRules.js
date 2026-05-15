// Declarative fallback rules — used when curated_stops has no match for a slot.
// Maps a slot type to preferred + fallback Geoapify category keys (those that
// already exist in useGeoapify.js CATEGORY_MAP).

export const SLOT_RULES = {
  meal: {
    prefer:   ['restaurant'],
    fallback: ['cafe', 'fast_food'],
    copyTemplate: (poi) => `Vreme za jelo — ${poi.name}, pauza ~45 min.`,
  },
  playground: {
    prefer:   ['rest_area'],
    fallback: ['picnic_site', 'attraction'],
    copyTemplate: (poi) => `Deca mogu da istrče energiju — ${poi.name}.`,
  },
  rest: {
    prefer:   ['cafe'],
    fallback: ['fuel', 'rest_area'],
    copyTemplate: (poi) => `Kratka pauza za kafu i toalet — ${poi.name}.`,
  },
  scenic: {
    prefer:   ['viewpoint'],
    fallback: ['attraction', 'museum'],
    copyTemplate: (poi) => `Stani na 15 minuta — ${poi.name}, pogled vredi.`,
  },
  fuel: {
    prefer:   ['fuel'],
    fallback: [],
    copyTemplate: (poi) => `Dopuni gorivo — ${poi.name}.`,
  },
}

/**
 * Pick the best Geoapify POI from a candidate pool for a given slot.
 * @param {string} slot - one of: 'meal' | 'playground' | 'rest' | 'scenic' | 'fuel'
 * @param {Array} candidates - geoapify POIs sorted by distance to slot center
 * @returns {object|null}
 */
export function pickFromGeoapify(slot, candidates) {
  const rules = SLOT_RULES[slot]
  if (!rules || !candidates?.length) return null
  for (const cat of rules.prefer) {
    const hit = candidates.find(p => p.category === cat)
    if (hit) return hit
  }
  for (const cat of rules.fallback) {
    const hit = candidates.find(p => p.category === cat)
    if (hit) return hit
  }
  return null
}
