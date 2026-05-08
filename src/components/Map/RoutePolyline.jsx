import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

/**
 * Draws an animated route polyline on the map from OSRM GeoJSON geometry.
 * The line animates drawing itself using stroke-dasharray/dashoffset.
 */
export default function RoutePolyline({ geometry, color = '#F97316', weight = 5 }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) return

    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const latLngs = geometry.coordinates.map(([lng, lat]) => [lat, lng])

    // Shadow layer — dark, wide, low opacity for depth
    const shadowLine = L.polyline(latLngs, {
      color: '#000000',
      weight: weight + 5,
      opacity: 0.07,
      lineCap: 'round',
      lineJoin: 'round',
    })

    // Glow halo — brand color, wide, semi-transparent
    const glowLine = L.polyline(latLngs, {
      color: color,
      weight: weight + 4,
      opacity: 0.18,
      lineCap: 'round',
      lineJoin: 'round',
    })

    // Main route line — solid, opaque
    const mainLine = L.polyline(latLngs, {
      color: color,
      weight: weight,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    })

    const group = L.layerGroup([shadowLine, glowLine, mainLine])
    group.addTo(map)
    layerRef.current = group

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [geometry, color, weight, map])

  return null
}
