/**
 * Point-of-Interest category definitions used throughout the app for map
 * markers, filters, and search queries against OpenStreetMap / Overpass API.
 *
 * Each entry carries display metadata (label, icon, colour) and an osmTag
 * string that can be split on "=" to get the Overpass tag/value pair.
 */
const poiCategories = [
  {
    key: 'fuel',
    label: 'Gas Stations',
    icon: '\u26FD',
    color: '#78716C',
    osmTag: 'amenity=fuel',
  },
  {
    key: 'restaurant',
    label: 'Restaurants',
    icon: '\uD83C\uDF7D\uFE0F',
    color: '#F59E0B',
    osmTag: 'amenity=restaurant',
  },
  {
    key: 'cafe',
    label: 'Cafes',
    icon: '\u2615',
    color: '#D97706',
    osmTag: 'amenity=cafe',
  },
  {
    key: 'attraction',
    label: 'Attractions',
    icon: '\uD83C\uDFDB\uFE0F',
    color: '#8B5CF6',
    osmTag: 'tourism=attraction',
  },
  {
    key: 'park',
    label: 'Parks & Rest Areas',
    icon: '\uD83C\uDF33',
    color: '#22C55E',
    osmTag: 'leisure=park',
  },
  {
    key: 'hotel',
    label: 'Hotels',
    icon: '\uD83C\uDFE8',
    color: '#3B82F6',
    osmTag: 'tourism=hotel',
  },
];

/**
 * Look up a POI category by its key.
 * @param {string} key
 * @returns {object|undefined} The matching category object, or undefined
 */
export function getCategoryByKey(key) {
  return poiCategories.find((cat) => cat.key === key);
}

/**
 * Get the colour associated with a POI category key.
 * Falls back to a neutral grey when the key is not found.
 * @param {string} key
 * @returns {string} CSS colour value
 */
export function getCategoryColor(key) {
  const category = getCategoryByKey(key);
  return category ? category.color : '#9CA3AF';
}

export default poiCategories;
