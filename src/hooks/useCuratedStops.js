import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const ROUTE_BUFFER = 0.15 // ~15 km buffer around route bbox

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
