/**
 * POI category definitions.
 * Format: object keyed by category ID.
 * Each entry has `tag` + `value` for Overpass QL queries,
 * plus display metadata (label, icon, color).
 */
const poiCategories = {
  // ── Gorivo & Servis ─────────────────────────────────────────────────────
  fuel: {
    tag: 'amenity', value: 'fuel',
    label: 'Pumpe', icon: '⛽', color: '#78716C',
  },
  car_wash: {
    tag: 'amenity', value: 'car_wash',
    label: 'Auto-praonice', icon: '🚿', color: '#0EA5E9',
  },

  // ── Odmor & Odmarališta ──────────────────────────────────────────────────
  rest_area: {
    tag: 'highway', value: 'rest_area',
    label: 'Odmarališta', icon: '🌿', color: '#22C55E',
  },
  services: {
    tag: 'highway', value: 'services',
    label: 'Auto-servis stanice', icon: '🏪', color: '#6366F1',
  },
  picnic_site: {
    tag: 'tourism', value: 'picnic_site',
    label: 'Piknik mesta', icon: '🧺', color: '#84CC16',
  },

  // ── Hrana & Piće ────────────────────────────────────────────────────────
  restaurant: {
    tag: 'amenity', value: 'restaurant',
    label: 'Restorani', icon: '🍽️', color: '#F59E0B',
  },
  fast_food: {
    tag: 'amenity', value: 'fast_food',
    label: 'Fast food', icon: '🍔', color: '#EF4444',
  },
  cafe: {
    tag: 'amenity', value: 'cafe',
    label: 'Kafići', icon: '☕', color: '#D97706',
  },

  // ── Smeštaj ─────────────────────────────────────────────────────────────
  hotel: {
    tag: 'tourism', value: 'hotel',
    label: 'Hoteli', icon: '🏨', color: '#3B82F6',
  },
  motel: {
    tag: 'tourism', value: 'motel',
    label: 'Moteli', icon: '🛏️', color: '#60A5FA',
  },
  hostel: {
    tag: 'tourism', value: 'hostel',
    label: 'Hosteli', icon: '🏠', color: '#93C5FD',
  },
  camp_site: {
    tag: 'tourism', value: 'camp_site',
    label: 'Kampovi', icon: '⛺', color: '#16A34A',
  },

  // ── Atrakcije ───────────────────────────────────────────────────────────
  attraction: {
    tag: 'tourism', value: 'attraction',
    label: 'Atrakcije', icon: '🏛️', color: '#8B5CF6',
  },
  viewpoint: {
    tag: 'tourism', value: 'viewpoint',
    label: 'Vidikovci', icon: '🔭', color: '#A78BFA',
  },
  museum: {
    tag: 'tourism', value: 'museum',
    label: 'Muzeji', icon: '🏺', color: '#7C3AED',
  },

  // ── Kupovina & Zdravlje ──────────────────────────────────────────────────
  supermarket: {
    tag: 'shop', value: 'supermarket',
    label: 'Supermarketi', icon: '🛒', color: '#10B981',
  },
  pharmacy: {
    tag: 'amenity', value: 'pharmacy',
    label: 'Apoteke', icon: '💊', color: '#DC2626',
  },
}

/**
 * Look up a POI category by its key.
 */
export function getCategoryByKey(key) {
  return poiCategories[key]
}

/**
 * Get the colour for a category key.
 */
export function getCategoryColor(key) {
  return poiCategories[key]?.color ?? '#9CA3AF'
}

export default poiCategories
