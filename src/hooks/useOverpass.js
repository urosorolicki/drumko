import { useState, useRef, useCallback } from 'react';
import { sampleRoutePoints } from '../utils/geoUtils';
import poiCategories from '../data/poiCategories';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/**
 * Radius (metres) around each sampled route point used in the Overpass
 * `around` filter.
 */
const SEARCH_RADIUS_M = 5000;

/**
 * Approximate spacing (km) between sampled points along the route.
 */
const SAMPLE_INTERVAL_KM = 20;

/**
 * Overpass query timeout in seconds.
 */
const QUERY_TIMEOUT_S = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a category key to the matching entry in poiCategories.
 * Returns `undefined` when the key is unknown.
 *
 * @param {string} key
 * @returns {{ tag: string, value: string, label: string, icon: string } | undefined}
 */
function resolveCategory(key) {
  const cat = poiCategories[key];
  if (!cat) return undefined;
  // Normalize: poiCategories uses { tag, value } directly
  return cat;
}

/**
 * Determine the app-level category key for an Overpass element based on its
 * OSM tags.  Returns the first matching key from `poiCategories`, or
 * `'other'` when nothing matches.
 *
 * @param {Record<string, string>} tags - OSM tags on the element
 * @returns {string} Category key (e.g. `'fuel'`, `'restaurant'`, …)
 */
function categoryFromTags(tags) {
  if (!tags) return 'other';

  for (const [key, cat] of Object.entries(poiCategories)) {
    if (cat.tag && cat.value && tags[cat.tag] === cat.value) return key;
  }

  return 'other';
}

/**
 * Build an Overpass QL query that fetches nodes matching the requested
 * categories within `SEARCH_RADIUS_M` of the sampled route points.
 *
 * The `around` filter accepts a comma-separated list of lat,lng pairs so we
 * pass every sampled point to a single `around` clause per category.
 *
 * @param {Array<{lat: number, lng: number}>} samplePoints
 * @param {Array<{ tag: string, value: string }>} categories
 * @returns {string} Overpass QL query string
 */
function buildQuery(samplePoints, categories) {
  // Build the coordinate string for the around filter: lat1,lng1,lat2,lng2,…
  const coordStr = samplePoints
    .map((p) => `${p.lat},${p.lng}`)
    .join(',');

  const unions = categories
    .map(
      (cat) =>
        `  nwr["${cat.tag}"="${cat.value}"]["name"](around:${SEARCH_RADIUS_M},${coordStr});`
    )
    .join('\n');

  return `[out:json][timeout:${QUERY_TIMEOUT_S}];\n(\n${unions}\n);\nout center body;`;
}

/**
 * Map a raw Overpass element to the app's POI shape.
 *
 * @param {object} el - An element from `response.elements`
 * @returns {{ id: number, name: string, lat: number, lng: number, category: string, type: string }}
 */
function mapElement(el) {
  // Some elements are ways/relations with a `center` property instead of
  // top-level lat/lon.
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;

  return {
    id: el.id,
    name: el.tags?.name || '',
    lat,
    lng,
    category: categoryFromTags(el.tags),
    type: el.type,
  };
}

// ---------------------------------------------------------------------------
// Hook: useOverpass
// ---------------------------------------------------------------------------

/**
 * Custom React hook for fetching Points of Interest near a route via the
 * Overpass API (OpenStreetMap).
 *
 * **Strategy** — The route geometry (a GeoJSON LineString) is down-sampled to
 * one point every ~20 km.  An Overpass `around` query is built from those
 * points so the server handles the spatial filtering.
 *
 * @returns {{
 *   fetchPOIs: (routeGeometry: Array<[number,number]>, categories: string[]) => Promise<Array | null>,
 *   pois: Array<{ id: number, name: string, lat: number, lng: number, category: string, type: string }>,
 *   loading: boolean,
 *   error: string | null
 * }}
 *
 * @example
 *   const { fetchPOIs, pois, loading, error } = useOverpass();
 *
 *   // routeGeometry comes from the OSRM hook's route.geometry.coordinates
 *   await fetchPOIs(routeGeometry, ['fuel', 'restaurant']);
 */
export default function useOverpass() {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  /**
   * Fetch POIs near a route for the specified categories.
   *
   * @param {Array<[number, number]>} routeGeometry
   *   GeoJSON LineString coordinates array (`[lng, lat]` pairs).
   * @param {string[]} categories
   *   Array of category keys defined in `poiCategories.js`
   *   (e.g. `['fuel', 'restaurant']`).
   * @returns {Promise<Array<{ id: number, name: string, lat: number, lng: number, category: string, type: string }> | null>}
   *   Resolved POI list, or `null` when the request is cancelled / fails.
   */
  const fetchPOIs = useCallback(async (routeGeometry, categories) => {
    // ── Validate inputs ───────────────────────────────────────────────────
    if (
      !routeGeometry ||
      routeGeometry.length === 0 ||
      !categories ||
      categories.length === 0
    ) {
      setPois([]);
      setError(null);
      setLoading(false);
      return null;
    }

    // Resolve category keys to their Overpass tag definitions.
    const resolved = categories
      .map(resolveCategory)
      .filter(Boolean);

    if (resolved.length === 0) {
      setError('No valid POI categories provided');
      setPois([]);
      setLoading(false);
      return null;
    }

    // ── Cancel previous in-flight request ─────────────────────────────────
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // 1. Sample points along the route.
      const samplePoints = sampleRoutePoints(routeGeometry, SAMPLE_INTERVAL_KM);

      if (samplePoints.length === 0) {
        throw new Error('Could not sample any points from the route geometry');
      }

      // 2. Build the Overpass QL query.
      const query = buildQuery(samplePoints, resolved);

      // 3. Execute the query.
      const res = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new Error(
          'Overpass API rate limit reached. Please wait a moment and try again.'
        );
      }

      if (!res.ok) {
        throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const elements = data.elements || [];

      // 4. Map and filter (drop POIs without a name).
      const mapped = elements
        .map(mapElement)
        .filter((poi) => poi.name && poi.lat != null && poi.lng != null);

      setPois(mapped);
      return mapped;
    } catch (err) {
      if (err.name === 'AbortError') return null;

      const message = err.message || 'Failed to fetch POIs';
      setError(message);
      setPois([]);
      return null;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  return { fetchPOIs, pois, loading, error };
}
