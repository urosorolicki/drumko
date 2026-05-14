// Maps well-known start↔end pairs to corridor codes used by curated_stops.road_corridors.
// Add new corridors here as the curated stops base grows.

const CORRIDORS = [
  { code: 'BG-BU', startMatch: /beograd|belgrade/i,  endMatch: /(budva|bar|tivat|kotor|herceg|petrovac|sutomore|ulcinj)/i },
  { code: 'BG-GR', startMatch: /beograd|belgrade/i,  endMatch: /(thessalon|halkid|solun|paralia|katerini|grcka|greece|peloponez)/i },
  { code: 'NS-ZL', startMatch: /novi sad/i,          endMatch: /(zlatibor|tara|mokra gora|cajetina|sirogojno)/i },
]

export function detectCorridor(startName = '', endName = '') {
  if (!startName || !endName) return null
  for (const c of CORRIDORS) {
    if (c.startMatch.test(startName) && c.endMatch.test(endName)) return c.code
  }
  return null
}

export const KNOWN_CORRIDORS = CORRIDORS.map(c => c.code)
