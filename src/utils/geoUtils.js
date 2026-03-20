const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lng1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lng2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Compute a bounding box that encloses every point in the array, expanded by
 * the given padding (in km).
 * @param {{ lat: number, lng: number }[]} points
 * @param {number} [paddingKm=10] - Extra padding around the bounding box in km
 * @returns {[[number, number], [number, number]]} [[south, west], [north, east]]
 */
export function getBoundingBox(points, paddingKm = 10) {
  if (!points || points.length === 0) {
    return [
      [0, 0],
      [0, 0],
    ];
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const { lat, lng } of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  // 1 degree of latitude ~ 111 km
  const latPadding = paddingKm / 111;
  // 1 degree of longitude varies with latitude — use the midpoint
  const midLat = (minLat + maxLat) / 2;
  const lngPadding = paddingKm / (111 * Math.cos(toRad(midLat)));

  return [
    [minLat - latPadding, minLng - lngPadding],
    [maxLat + latPadding, maxLng + lngPadding],
  ];
}

/**
 * Calculate the shortest distance from a point to a line segment (in km).
 * All coordinates are { lat, lng } objects.
 * @param {{ lat: number, lng: number }} point
 * @param {{ lat: number, lng: number }} lineStart
 * @param {{ lat: number, lng: number }} lineEnd
 * @returns {number} Distance in km
 */
export function pointToLineDistance(point, lineStart, lineEnd) {
  const A = point;
  const B = lineStart;
  const C = lineEnd;

  // Work in a flat approximation (good enough for short segments)
  const midLat = (B.lat + C.lat) / 2;
  const cosLat = Math.cos(toRad(midLat));

  // Convert to km-scale coordinates relative to B
  const bx = 0;
  const by = 0;
  const cx = (C.lng - B.lng) * cosLat * 111;
  const cy = (C.lat - B.lat) * 111;
  const ax = (A.lng - B.lng) * cosLat * 111;
  const ay = (A.lat - B.lat) * 111;

  const segLenSq = cx * cx + cy * cy;

  if (segLenSq === 0) {
    // lineStart and lineEnd are the same point
    return Math.sqrt(ax * ax + ay * ay);
  }

  // Parameter t projects A onto the line B->C, clamped to [0,1]
  let t = ((ax - bx) * cx + (ay - by) * cy) / segLenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = bx + t * cx;
  const projY = by + t * cy;

  const dx = ax - projX;
  const dy = ay - projY;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determine whether a point lies within maxDistanceKm of any segment in a route.
 * @param {{ lat: number, lng: number }} point
 * @param {{ lat: number, lng: number }[]} routeCoords - Ordered array of route vertices
 * @param {number} [maxDistanceKm=1] - Proximity threshold in km
 * @returns {boolean}
 */
export function isPointNearRoute(point, routeCoords, maxDistanceKm = 1) {
  if (!routeCoords || routeCoords.length < 2) return false;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const dist = pointToLineDistance(point, routeCoords[i], routeCoords[i + 1]);
    if (dist <= maxDistanceKm) return true;
  }

  return false;
}

/**
 * Decode a Google-style encoded polyline string into an array of [lat, lng] pairs.
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * @param {string} encoded - The encoded polyline string
 * @returns {[number, number][]} Array of [lat, lng] coordinate pairs
 */
export function decodePolyline(encoded) {
  if (!encoded || encoded.length === 0) return [];

  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    // Decode longitude
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

/**
 * Sample points along a GeoJSON LineString at approximately the given interval.
 *
 * The function walks the coordinate array and emits a point every time the
 * accumulated distance exceeds `intervalKm`.  The first and last coordinates
 * are always included.
 *
 * @param {Array<[number, number]>} coordinates - GeoJSON coordinates [lng, lat]
 * @param {number} [intervalKm=20] - Approximate spacing between samples (km)
 * @returns {Array<{lat: number, lng: number}>} Sampled points
 */
export function sampleRoutePoints(coordinates, intervalKm = 20) {
  if (!coordinates || coordinates.length === 0) return [];

  const points = [{ lat: coordinates[0][1], lng: coordinates[0][0] }];
  let accumulated = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const [prevLng, prevLat] = coordinates[i - 1];
    const [curLng, curLat] = coordinates[i];
    accumulated += haversineDistance(prevLat, prevLng, curLat, curLng);

    if (accumulated >= intervalKm) {
      points.push({ lat: curLat, lng: curLng });
      accumulated = 0;
    }
  }

  // Always include the last point (avoid duplicate if it was just added)
  const last = coordinates[coordinates.length - 1];
  const lastPoint = { lat: last[1], lng: last[0] };
  const prev = points[points.length - 1];
  if (prev.lat !== lastPoint.lat || prev.lng !== lastPoint.lng) {
    points.push(lastPoint);
  }

  return points;
}

/**
 * Format a distance value for display.
 * Distances under 1 km are shown in metres, otherwise in km with one decimal.
 * @param {number} km - Distance in kilometres
 * @returns {string} Human-readable distance string
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return '—';

  if (km < 1) {
    const metres = Math.round(km * 1000);
    return `${metres} m`;
  }

  return `${km.toFixed(1)} km`;
}

/**
 * Format a duration in seconds to a human-readable string.
 * Durations under 60 minutes are shown as "X min", otherwise as "Xh Ym".
 * @param {number} seconds - Duration in seconds
 * @returns {string} Human-readable duration string
 */
export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '—';

  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Given a POI (lat/lng) and GeoJSON route coordinates ([lng,lat] pairs),
 * returns the approximate km mark along the route where the POI is closest.
 * Used to sort POIs by their position along the route.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {Array<[number,number]>} coordinates - GeoJSON [lng, lat] pairs
 * @returns {number} km from start
 */
export function getRouteKm(lat, lng, coordinates) {
  if (!coordinates || coordinates.length === 0) return 0;

  let minDist = Infinity;
  let minIdx = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const dist = haversineDistance(lat, lng, coordinates[i][1], coordinates[i][0]);
    if (dist < minDist) { minDist = dist; minIdx = i; }
  }

  let km = 0;
  for (let i = 1; i <= minIdx; i++) {
    km += haversineDistance(
      coordinates[i - 1][1], coordinates[i - 1][0],
      coordinates[i][1],     coordinates[i][0]
    );
  }
  return Math.round(km);
}

