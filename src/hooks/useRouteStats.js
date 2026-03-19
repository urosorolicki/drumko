import { useMemo } from 'react';
import { haversineDistance, formatDistance, formatDuration } from '../utils/geoUtils';

// ---------------------------------------------------------------------------
// Hook: useRouteStats
// ---------------------------------------------------------------------------

/**
 * Compute human-readable statistics for a route and its intermediate stops.
 *
 * All heavy computation is memoised so it only re-runs when `route` or
 * `stops` actually change.
 *
 * @param {{ totalDistance: number, totalDuration: number } | null} route
 *   The route object returned by `useOSRM`.
 *   - `totalDistance` — total driving distance in **kilometres**.
 *   - `totalDuration` — total driving time in **seconds**.
 *
 * @param {Array<{ lat: number, lng: number }>} stops
 *   Ordered list of waypoints (including start and end cities).
 *   At minimum the array should contain the start and end point.
 *
 * @returns {{
 *   totalDistance: string,
 *   totalDuration: string,
 *   stopDistances: string[],
 *   stopDurations: string[]
 * }}
 *
 * @example
 *   const stats = useRouteStats(route, [startCity, ...stops, endCity]);
 *   // stats.totalDistance  → "586.2 km"
 *   // stats.totalDuration  → "6h 12m"
 *   // stats.stopDistances  → ["94.3 km", "185.7 km", "306.2 km"]
 *   // stats.stopDurations  → ["1h 5m", "2h 20m", "2h 47m"]
 */
export default function useRouteStats(route, stops) {
  return useMemo(() => {
    // ── Defaults for missing / empty inputs ─────────────────────────────
    const empty = {
      totalDistance: formatDistance(0),
      totalDuration: formatDuration(0),
      stopDistances: [],
      stopDurations: [],
    };

    if (!route) return empty;

    // ── Total stats from the route object ───────────────────────────────
    const totalDistanceStr = formatDistance(route.totalDistance ?? 0);
    const totalDurationStr = formatDuration(route.totalDuration ?? 0);

    // ── Per-leg stats ───────────────────────────────────────────────────
    // We need at least two points to compute legs.
    if (!stops || stops.length < 2) {
      return {
        totalDistance: totalDistanceStr,
        totalDuration: totalDurationStr,
        stopDistances: [],
        stopDurations: [],
      };
    }

    const stopDistances = [];
    const stopDurations = [];

    // Total straight-line distance across all legs (used to proportion the
    // route's driving duration across legs).
    let totalStraightLine = 0;
    const legStraightLines = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];

      if (
        a.lat == null || a.lng == null ||
        b.lat == null || b.lng == null
      ) {
        legStraightLines.push(0);
        continue;
      }

      const d = haversineDistance(a.lat, a.lng, b.lat, b.lng);
      legStraightLines.push(d);
      totalStraightLine += d;
    }

    for (let i = 0; i < legStraightLines.length; i++) {
      const legDist = legStraightLines[i];

      // Distance: proportionally distribute the total driving distance.
      const distRatio = totalStraightLine > 0 ? legDist / totalStraightLine : 0;
      const legKm = (route.totalDistance ?? 0) * distRatio;
      stopDistances.push(formatDistance(legKm));

      // Duration: proportionally distribute the total driving time.
      const legSec = (route.totalDuration ?? 0) * distRatio;
      stopDurations.push(formatDuration(legSec));
    }

    return {
      totalDistance: totalDistanceStr,
      totalDuration: totalDurationStr,
      stopDistances,
      stopDurations,
    };
  }, [route, stops]);
}
