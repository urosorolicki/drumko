import { useEffect } from 'react'

const SOURCE_ID = 'drumko-route'
const LAYERS = ['route-shadow', 'route-glow', 'route-main']

export default function RoutePolyline({ map, geometry, color = '#F97316' }) {
  useEffect(() => {
    if (!map || !geometry?.coordinates?.length) return

    function addLayers() {
      if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData(geometry)
        return
      }

      map.addSource(SOURCE_ID, { type: 'geojson', data: geometry })

      // Shadow — dark wide blur for depth
      map.addLayer({
        id: 'route-shadow',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000', 'line-width': 12, 'line-opacity': 0.07 },
      })

      // Glow halo — brand color, wide, semi-transparent
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': 11, 'line-opacity': 0.18 },
      })

      // Main route line
      map.addLayer({
        id: 'route-main',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': 5, 'line-opacity': 0.92 },
      })
    }

    if (map.isStyleLoaded()) {
      addLayers()
    } else {
      map.once('styledata', addLayers)
    }

    return () => {
      LAYERS.forEach(id => { if (map.getLayer(id)) map.removeLayer(id) })
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map, geometry])

  // Update color on change without recreating layers
  useEffect(() => {
    if (!map || !map.getLayer('route-glow')) return
    map.setPaintProperty('route-glow', 'line-color', color)
    map.setPaintProperty('route-main', 'line-color', color)
  }, [map, color])

  return null
}
