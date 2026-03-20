import { useState, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const SEARCH_ENDPOINT = `${NOMINATIM_BASE}/search`;
const REVERSE_ENDPOINT = `${NOMINATIM_BASE}/reverse`;
const USER_AGENT = 'Drumko/1.0 (trip-planner)';
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a raw Nominatim result to the app's location shape.
 *
 * @param {object} raw - A single element from the Nominatim JSON response
 * @returns {{ name: string, lat: number, lng: number, type: string }}
 */
function mapResult(raw) {
  const addr = raw.address || {}
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || raw.name
  const country = addr.country || ''
  const state = addr.state || addr.region || ''
  const sub = [state, country].filter(Boolean).join(', ')

  return {
    name: raw.display_name,       // full name kept for reference
    city,                          // short primary label
    sub,                           // "State, Country" secondary label
    lat: parseFloat(raw.lat),
    lng: parseFloat(raw.lon),
    type: raw.type,
  };
}

// ---------------------------------------------------------------------------
// Standalone: reverseGeocode
// ---------------------------------------------------------------------------

/**
 * Perform a reverse-geocode lookup via the Nominatim API.
 *
 * This is a standalone async function (not a hook) so it can be called from
 * event handlers, store actions, or other non-component code.
 *
 * @param {number} lat - Latitude (WGS-84)
 * @param {number} lng - Longitude (WGS-84)
 * @returns {Promise<{ name: string, lat: number, lng: number, type: string } | null>}
 *   The resolved location, or `null` when the API returns no result.
 *
 * @example
 *   const place = await reverseGeocode(44.7866, 20.4489);
 *   console.log(place.name); // "Belgrade, ..."
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
  });

  const res = await fetch(`${REVERSE_ENDPOINT}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Nominatim reverse-geocode failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // Nominatim returns an object (not an array) for reverse lookups.
  // If there was no match it returns { error: "..." }.
  if (!data || data.error) return null;

  return mapResult(data);
}

// ---------------------------------------------------------------------------
// Hook: useNominatim
// ---------------------------------------------------------------------------

/**
 * Custom React hook for Nominatim (OpenStreetMap) geocoding search.
 *
 * Features:
 *   - Built-in 400 ms debounce so rapid keystrokes don't flood the API.
 *   - AbortController cancellation — each new search cancels the previous
 *     in-flight request.
 *   - Graceful error handling with an `error` state.
 *
 * @returns {{
 *   search: (query: string) => void,
 *   results: Array<{ name: string, lat: number, lng: number, type: string }>,
 *   loading: boolean,
 *   error: string | null,
 *   clearResults: () => void
 * }}
 *
 * @example
 *   const { search, results, loading, error, clearResults } = useNominatim();
 *
 *   // Trigger a debounced search
 *   search('Belgrade');
 *
 *   // Clear the result list (e.g. when the input is emptied)
 *   clearResults();
 */
export default function useNominatim() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs survive across renders without triggering re-renders.
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  /**
   * Initiate a debounced geocoding search.
   *
   * Calls to `search` that arrive within the debounce window replace the
   * previously scheduled request.  Any in-flight fetch is aborted before a
   * new one is dispatched.
   *
   * @param {string} query - Free-text location query
   */
  const search = useCallback((query) => {
    // Clear any pending debounce timer.
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Abort any in-flight request immediately.
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Ignore empty / whitespace-only queries.
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
          format: 'json',
          q: trimmed,
          limit: '7',
          addressdetails: '1',
          featuretype: 'settlement',
        });

        const res = await fetch(`${SEARCH_ENDPOINT}?${params}`, {
          headers: { 'User-Agent': USER_AGENT },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Nominatim search failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setResults(Array.isArray(data) ? data.map(mapResult) : []);
      } catch (err) {
        // AbortError is expected when we cancel a request — don't surface it.
        if (err.name === 'AbortError') return;
        setError(err.message || 'Search failed');
        setResults([]);
      } finally {
        // Only clear loading if this controller was NOT aborted (i.e. it is
        // still the "current" request).
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Clear the current results and reset error state.
   */
  const clearResults = useCallback(() => {
    // Cancel anything in progress.
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
