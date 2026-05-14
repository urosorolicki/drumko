import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ROUTE_BUFFER = 0.15 // ~15 km buffer around route bbox

export async function fetchScoredStops({ bbox, hasKids = false, minKidAge = 99, timeOfDay = 'lunch', season = 'summer', corridor = null }) {
  if (!bbox) return []
  const { data, error } = await supabase.rpc('get_stops_for_trip', {
    min_lat: bbox.minLat,
    max_lat: bbox.maxLat,
    min_lng: bbox.minLng,
    max_lng: bbox.maxLng,
    has_kids: hasKids,
    min_kid_age: minKidAge ?? 99,
    time_of_day: timeOfDay,
    season,
    corridor,
  })
  if (error) {
    console.warn('[fetchScoredStops]', error.message)
    return []
  }
  return data ?? []
}

export default function useCuratedStops() {
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(false)

  // routeCoords: array of [lng, lat] from OSRM GeoJSON geometry
  const fetchAlongRoute = useCallback(async (routeCoords) => {
    if (!routeCoords || routeCoords.length === 0) return
    setLoading(true)
    try {
      const lats = routeCoords.map(c => c[1])
      const lngs = routeCoords.map(c => c[0])

      const { data, error } = await supabase.rpc('get_stops_along_route', {
        min_lat: Math.min(...lats) - ROUTE_BUFFER,
        max_lat: Math.max(...lats) + ROUTE_BUFFER,
        min_lng: Math.min(...lngs) - ROUTE_BUFFER,
        max_lng: Math.max(...lngs) + ROUTE_BUFFER,
      })
      if (error) throw error
      setStops(data || [])
    } catch (e) {
      console.warn('[useCuratedStops]', e.message)
      setStops([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => setStops([]), [])

  return { stops, loading, fetchAlongRoute, clear }
}
