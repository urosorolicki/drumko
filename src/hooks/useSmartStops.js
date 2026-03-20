import { useState, useCallback } from 'react'
import { haversineDistance } from '../utils/geoUtils'

/**
 * Find the route coordinate (lat, lng) closest to a given km mark from start.
 * coords = GeoJSON [lng, lat] pairs
 */
function getRoutePointAtKm(coords, targetKm) {
  let accumulated = 0
  for (let i = 1; i < coords.length; i++) {
    const seg = haversineDistance(
      coords[i - 1][1], coords[i - 1][0],
      coords[i][1],     coords[i][0]
    )
    accumulated += seg
    if (accumulated >= targetKm) {
      return { lat: coords[i][1], lng: coords[i][0] }
    }
  }
  const last = coords[coords.length - 1]
  return { lat: last[1], lng: last[0] }
}

/**
 * Reverse geocode a lat/lng to a short city name via Nominatim.
 */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'sr' } }
    )
    const data = await res.json()
    const addr = data.address || {}
    return addr.city || addr.town || addr.village || addr.county || data.display_name?.split(',')[0] || `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  }
}

/**
 * Priority categories to show per recommendation card, in display order.
 */
const PRIO_CATEGORIES = ['fuel', 'rest_area', 'services', 'restaurant', 'fast_food', 'cafe', 'hotel', 'motel', 'hostel', 'camp_site']

/**
 * Given route coordinates, total distance, and Overpass POIs, generate
 * N smart stop recommendations at evenly-spaced km intervals.
 *
 * Each recommendation contains:
 *   { km, lat, lng, cityName, byCategory: { fuel: [...], restaurant: [...], ... } }
 */
export default function useSmartStops() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  /**
   * @param {Array} routeCoords  - GeoJSON [lng, lat] pairs
   * @param {Array} pois         - POI objects from Geoapify
   * @param {number} totalDistanceKm
   * @param {number} [requestedCount=3] - how many stops the user wants
   */
  const buildSuggestions = useCallback(async (routeCoords, pois, totalDistanceKm, requestedCount = 3) => {
    if (!routeCoords?.length || !totalDistanceKm) return

    setLoading(true)
    setSuggestions([])

    // Generate a pool of (requestedCount * 2 + 1) evenly-spaced candidates,
    // capped at 8, so "Give me more" has fresh options to show.
    const poolSize = Math.min(requestedCount * 2 + 1, 8)

    // Evenly-spaced km marks across the full route
    const kmMarks = Array.from({ length: poolSize }, (_, i) =>
      Math.round(totalDistanceKm * (i + 1) / (poolSize + 1))
    )

    const results = await Promise.all(
      kmMarks.map(async (targetKm) => {
        const point = getRoutePointAtKm(routeCoords, targetKm)

        // Find POIs within 20km of this stop point
        const RADIUS_KM = 20
        const nearby = pois.filter(
          (p) => haversineDistance(p.lat, p.lng, point.lat, point.lng) < RADIUS_KM
        )

        // Group by category
        const byCategory = {}
        for (const poi of nearby) {
          if (!byCategory[poi.category]) byCategory[poi.category] = []
          byCategory[poi.category].push(poi)
        }

        // Only keep stops where we found at least one useful POI
        const hasUsefulPOIs = PRIO_CATEGORIES.some((cat) => byCategory[cat]?.length > 0)

        // Reverse geocode to get the nearest town name
        const cityName = await reverseGeocode(point.lat, point.lng)

        return {
          km: targetKm,
          lat: point.lat,
          lng: point.lng,
          cityName,
          byCategory,
          hasUsefulPOIs,
        }
      })
    )

    setSuggestions(results)
    setLoading(false)
  }, [])

  return { buildSuggestions, suggestions, loading }
}
