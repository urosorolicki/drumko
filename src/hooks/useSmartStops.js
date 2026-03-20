import { useState, useCallback } from 'react'
import { haversineDistance } from '../utils/geoUtils'

function getRoutePointAtKm(coords, targetKm) {
  let accumulated = 0
  for (let i = 1; i < coords.length; i++) {
    const seg = haversineDistance(
      coords[i - 1][1], coords[i - 1][0],
      coords[i][1],     coords[i][0]
    )
    accumulated += seg
    if (accumulated >= targetKm) return { lat: coords[i][1], lng: coords[i][0] }
  }
  const last = coords[coords.length - 1]
  return { lat: last[1], lng: last[0] }
}

async function reverseGeocode(lat, lng) {
  try {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || ''
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`
    )
    const data = await res.json()
    const p = data?.features?.[0]?.properties || {}
    return p.city || p.town || p.village || p.municipality || p.name || p.formatted?.split(',')[0] || '—'
  } catch {
    return '—'
  }
}

// Ordered by priority — first match per slot wins
const PICK_SLOTS = [
  { slot: 'fuel',       categories: ['fuel'] },
  { slot: 'food',       categories: ['restaurant', 'fast_food', 'cafe'] },
  { slot: 'sleep',      categories: ['hotel', 'motel', 'hostel'] },
]

function findTopPicks(pois, center, radiusKm = 15) {
  const nearby = pois
    .map(p => ({ ...p, _d: haversineDistance(p.lat, p.lng, center.lat, center.lng) }))
    .filter(p => p._d <= radiusKm)
    .sort((a, b) => a._d - b._d)

  return PICK_SLOTS.map(({ slot, categories }) => {
    const poi = nearby.find(p => categories.includes(p.category))
    return poi ? { slot, poi } : null
  }).filter(Boolean)
}

export default function useSmartStops() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const buildSuggestions = useCallback(async (routeCoords, pois, totalDistanceKm, requestedCount = 2) => {
    if (!routeCoords?.length || !totalDistanceKm) return

    setLoading(true)
    setSuggestions([])

    // Build a pool 2× bigger than requested so "show different" works
    const poolSize = Math.min(requestedCount * 2, 6)
    const kmMarks = Array.from({ length: poolSize }, (_, i) =>
      Math.round(totalDistanceKm * (i + 1) / (poolSize + 1))
    )

    const results = await Promise.all(
      kmMarks.map(async (km) => {
        const point = getRoutePointAtKm(routeCoords, km)
        const [cityName, picks] = await Promise.all([
          reverseGeocode(point.lat, point.lng),
          Promise.resolve(findTopPicks(pois, point)),
        ])
        const driveTimeMin = Math.round(km * 60 / 90) // ~90 km/h avg
        return { km, driveTimeMin, cityName, lat: point.lat, lng: point.lng, picks }
      })
    )

    setSuggestions(results)
    setLoading(false)
  }, [])

  return { buildSuggestions, suggestions, loading }
}
