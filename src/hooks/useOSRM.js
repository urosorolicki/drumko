import { useState, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ---------------------------------------------------------------------------
// Hook: useOSRM
// ---------------------------------------------------------------------------

/**
 * Custom React hook for fetching driving routes from the OSRM demo server.
 *
 * The hook manages loading / error state and uses AbortController so that
 * only the most recent request is honoured when `fetchRoute` is called
 * multiple times in quick succession.
 *
 * **OSRM coordinate order is `lng,lat`** (the opposite of Leaflet's default).
 *
 * @returns {{
 *   fetchRoute: (waypoints: Array<{lat: number, lng: number}>) => Promise<{
 *     geometry: object,
 *     totalDistance: number,
 *     totalDuration: number
 *   } | null>,
 *   route: { geometry: object, totalDistance: number, totalDuration: number } | null,
 *   loading: boolean,
 *   error: string | null
 * }}
 *
 * @example
 *   const { fetchRoute, route, loading, error } = useOSRM();
 *
 *   await fetchRoute([
 *     { lat: 44.7866, lng: 20.4489 }, // Belgrade
 *     { lat: 45.2671, lng: 19.8335 }, // Novi Sad
 *   ]);
 *
 *   console.log(route.totalDistance); // e.g. 94.3  (km)
 *   console.log(route.totalDuration); // e.g. 4320 (seconds)
 */
export default function useOSRM() {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  /**
   * Fetch a driving route through the given waypoints.
   *
   * @param {Array<{lat: number, lng: number}>} waypoints
   *   Ordered list of waypoints.  At least two points are required.
   * @returns {Promise<{ geometry: object, totalDistance: number, totalDuration: number } | null>}
   *   The route data, or `null` when the request is cancelled / fails.
   */
  const fetchRoute = useCallback(async (waypoints) => {
    // ── Validate input ────────────────────────────────────────────────────
    if (!waypoints || waypoints.length < 2) {
      setRoute(null);
      setError(null);
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
      // OSRM expects coordinates as  lng,lat;lng,lat;…
      const coords = waypoints
        .map((wp) => `${wp.lng},${wp.lat}`)
        .join(';');

      const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=false`;

      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(`OSRM request failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(
          data.message || 'OSRM returned no routes. Check that waypoints are routable.'
        );
      }

      const primary = data.routes[0];

      const routeData = {
        /** GeoJSON LineString geometry of the full route. */
        geometry: primary.geometry,
        /** Total route distance in kilometres. */
        totalDistance: primary.distance / 1000,
        /** Total route duration in seconds. */
        totalDuration: primary.duration,
      };

      setRoute(routeData);
      return routeData;
    } catch (err) {
      if (err.name === 'AbortError') return null;

      const message = err.message || 'Failed to fetch route';
      setError(message);
      setRoute(null);
      return null;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  return { fetchRoute, route, loading, error };
}
