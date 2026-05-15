import { haversineDistance } from './geoUtils'

/**
 * Return the lat/lng point on a route where approximately `targetMin` minutes
 * of driving have elapsed. Assumes uniform speed across the route — accurate
 * enough for slot placement (5–10% error is invisible to the user).
 *
 * @param {Array<[number,number]>} coords - GeoJSON [lng, lat] pairs
 * @param {number} totalDurationSec - OSRM route.duration
 * @param {number} totalDistanceKm - OSRM route.distance / 1000
 * @param {number} targetMin - minutes into the trip
 * @returns {{ lat: number, lng: number }}
 */
export function pointAtDurationMin(coords, totalDurationSec, totalDistanceKm, targetMin) {
  if (!coords?.length || !totalDurationSec || !totalDistanceKm) {
    return { lat: 0, lng: 0 }
  }
  const fraction = Math.max(0, Math.min(1, (targetMin * 60) / totalDurationSec))
  const targetKm = fraction * totalDistanceKm

  let acc = 0
  for (let i = 1; i < coords.length; i++) {
    const seg = haversineDistance(
      coords[i - 1][1], coords[i - 1][0],
      coords[i][1],     coords[i][0]
    )
    acc += seg
    if (acc >= targetKm) return { lat: coords[i][1], lng: coords[i][0] }
  }
  const last = coords[coords.length - 1]
  return { lat: last[1], lng: last[0] }
}

/**
 * Cumulative km from start of route to a given coordinate index.
 */
export function kmAtIndex(coords, idx) {
  let acc = 0
  for (let i = 1; i <= idx && i < coords.length; i++) {
    acc += haversineDistance(
      coords[i - 1][1], coords[i - 1][0],
      coords[i][1],     coords[i][0]
    )
  }
  return acc
}

/**
 * Km along the route at which `targetMin` of driving have elapsed
 * (under the uniform-speed assumption).
 */
export function kmAtDurationMin(totalDurationSec, totalDistanceKm, targetMin) {
  if (!totalDurationSec || !totalDistanceKm) return 0
  const fraction = Math.max(0, Math.min(1, (targetMin * 60) / totalDurationSec))
  return fraction * totalDistanceKm
}

/**
 * Approximate bounding box ±radiusKm around a point.
 */
export function bboxAround({ lat, lng }, radiusKm = 20) {
  const dLat = radiusKm / 111
  const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180))
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  }
}
