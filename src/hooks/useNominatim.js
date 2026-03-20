import { useState, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEOAPIFY_BASE = 'https://api.geoapify.com/v1/geocode';
const SEARCH_ENDPOINT = `${GEOAPIFY_BASE}/autocomplete`;
const REVERSE_ENDPOINT = `${GEOAPIFY_BASE}/reverse`;
const DEBOUNCE_MS = 300;

function getApiKey() {
  return import.meta.env.VITE_GEOAPIFY_API_KEY || '';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a raw Geoapify feature to the app's location shape.
 *
 * @param {object} feature - A single GeoJSON feature from the Geoapify response
 * @returns {{ name: string, city: string, sub: string, lat: number, lng: number, type: string }}
 */
function mapResult(feature) {
  const p = feature.properties || {};
  const resultType = p.result_type || p.type || '';
  const cityName = p.city || p.town || p.village || p.municipality || p.county || '';
  const country = p.country || '';

  // For streets/buildings, use address_line1 (e.g. "Negovana Ljubinkovića 5")
  // For cities/settlements, use the city name
  const isAddress = resultType === 'building' || resultType === 'street' || resultType === 'amenity';
  const primaryName = isAddress
    ? (p.address_line1 || p.street || p.formatted?.split(',')[0] || cityName)
    : (cityName || p.name || p.formatted?.split(',')[0] || '');

  // Subtitle: for addresses show city+country, for cities show state+country
  const subParts = isAddress
    ? [cityName, country].filter(Boolean)
    : [(p.state || p.region), country].filter(Boolean);
  const sub = subParts.slice(0, 2).join(', ');

  return {
    name: p.formatted || primaryName || '',
    city: primaryName || '',
    sub,
    lat: p.lat,
    lng: p.lon,
    type: resultType,
  };
}

// ---------------------------------------------------------------------------
// Standalone: reverseGeocode
// ---------------------------------------------------------------------------

/**
 * Perform a reverse-geocode lookup via the Geoapify API.
 *
 * @param {number} lat - Latitude (WGS-84)
 * @param {number} lng - Longitude (WGS-84)
 * @returns {Promise<{ name: string, lat: number, lng: number, type: string } | null>}
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    apiKey: getApiKey(),
  });

  const res = await fetch(`${REVERSE_ENDPOINT}?${params}`);

  if (!res.ok) {
    throw new Error(`Geoapify reverse-geocode failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const features = data?.features;
  if (!Array.isArray(features) || features.length === 0) return null;

  return mapResult(features[0]);
}

// ---------------------------------------------------------------------------
// Hook: useNominatim
// ---------------------------------------------------------------------------

/**
 * Custom React hook for Geoapify geocoding search (drop-in replacement for
 * the previous Nominatim-based hook — same interface, no CORS issues).
 *
 * @param {{ featuretype?: string | null }} options
 *   featuretype: 'settlement' → restrict to city/town results
 *                null         → search all location types
 *
 * @returns {{
 *   search: (query: string) => void,
 *   results: Array<{ name: string, city: string, sub: string, lat: number, lng: number, type: string }>,
 *   loading: boolean,
 *   error: string | null,
 *   clearResults: () => void
 * }}
 */
export default function useNominatim({ featuretype = null } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback((query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const trimmed = (query || '').trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({
          text: trimmed,
          limit: '7',
          apiKey: getApiKey(),
        });

        // featuretype='settlement' → restrict to city-level results
        if (featuretype === 'settlement') {
          params.set('type', 'city');
        }

        const res = await fetch(`${SEARCH_ENDPOINT}?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Geoapify search failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        setResults(features.map(mapResult));
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
  }, [featuretype]);

  const clearResults = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  return { search, results, loading, error, clearResults };
}
