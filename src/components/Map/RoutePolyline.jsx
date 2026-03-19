import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

/**
 * Draws an animated route polyline on the map from OSRM GeoJSON geometry.
 * The line animates drawing itself using stroke-dasharray/dashoffset.
 */
export default function RoutePolyline({ geometry, color = '#F97316', weight = 4, animated = true }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) return

    // Remove previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
    const latLngs = geometry.coordinates.map(([lng, lat]) => [lat, lng])

    // Create background line (lighter, wider)
    const bgLine = L.polyline(latLngs, {
      color: color,
      weight: weight + 3,
      opacity: 0.2,
      lineCap: 'round',
      lineJoin: 'round',
    })

    // Create main route line
    const mainLine = L.polyline(latLngs, {
      color: color,
      weight: weight,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: animated ? '12 8' : null,
    })

    const group = L.layerGroup([bgLine, mainLine])
    group.addTo(map)
    layerRef.current = group

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [geometry, color, weight, animated, map])

  return null
}
