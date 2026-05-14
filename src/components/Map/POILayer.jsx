import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { createRoot } from 'react-dom/client'
import { POIPopup } from './StopPopup'
import poiCategories from '../../data/poiCategories'

const SOURCE_ID = 'drumko-pois'

function poiColor(category) {
  return poiCategories[category]?.color || '#F97316'
}

function buildGeoJSON(pois, visibleCategories) {
  const filtered = visibleCategories
    ? pois.filter(p => visibleCategories.includes(p.category))
    : pois
  return {
    type: 'FeatureCollection',
    features: filtered.map(p => ({
      type: 'Feature',
      properties: { id: p.id, name: p.name, category: p.category, color: poiColor(p.category) },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
}

export default function POILayer({ map, pois = [], visibleCategories, onAddAsStop }) {
  const onAddRef = useRef(onAddAsStop)
  useEffect(() => { onAddRef.current = onAddAsStop }, [onAddAsStop])

  const geojson = useMemo(
    () => buildGeoJSON(pois, visibleCategories),
    [pois, visibleCategories]
  )

  // Create layers once
  useEffect(() => {
    if (!map) return

    function setup() {
      if (map.getSource(SOURCE_ID)) return

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 42,
      })

      // Cluster circles
      map.addLayer({
        id: 'poi-clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#F97316',
          'circle-radius': ['step', ['get', 'point_count'], 18, 20, 24, 100, 30],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'white',
          'circle-opacity': 0.88,
        },
      })

      // Cluster count labels
      map.addLayer({
        id: 'poi-cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 13,
        },
        paint: { 'text-color': 'white' },
      })

      // Individual POI dots (unclustered)
      map.addLayer({
        id: 'poi-points',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 9,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': 'white',
          'circle-opacity': 0.9,
        },
      })

      // Cluster click → zoom in
      map.on('click', 'poi-clusters', (e) => {
        const [feature] = map.queryRenderedFeatures(e.point, { layers: ['poi-clusters'] })
        if (!feature) return
        const clusterId = feature.properties.cluster_id
        map.getSource(SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (!err) map.easeTo({ center: feature.geometry.coordinates, zoom: zoom + 0.5 })
        })
      })

      // Individual POI click → React popup
      map.on('click', 'poi-points', (e) => {
        const [feature] = map.queryRenderedFeatures(e.point, { layers: ['poi-points'] })
        if (!feature) return

        const coords = feature.geometry.coordinates.slice()
        const poi = {
          id: feature.properties.id,
          name: feature.properties.name,
          category: feature.properties.category,
          lat: coords[1],
          lng: coords[0],
        }

        const popupNode = document.createElement('div')
        const root = createRoot(popupNode)
        const popup = new maplibregl.Popup({
          closeButton: true,
          offset: [0, -12],
          className: 'drumko-popup',
          maxWidth: 'none',
        })

        root.render(
          <POIPopup
            poi={poi}
            onAddAsStop={(p) => onAddRef.current?.(p)}
            onClose={() => { popup.remove(); root.unmount() }}
          />
        )

        popup.setDOMContent(popupNode).setLngLat(coords).addTo(map)
        popup.on('close', () => root.unmount())
      })

      // Cursor styles
      for (const layer of ['poi-points', 'poi-clusters']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }
    }

    if (map.isStyleLoaded()) {
      setup()
    } else {
      map.once('styledata', setup)
    }

    return () => {
      for (const id of ['poi-cluster-count', 'poi-clusters', 'poi-points']) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update data whenever pois or filters change
  useEffect(() => {
    if (!map || !map.getSource(SOURCE_ID)) return
    map.getSource(SOURCE_ID).setData(geojson)
  }, [map, geojson])

  return null
}

/**
 * Compact collapsible POI filter — unchanged from Leaflet version (pure UI, no map API).
 */
export function POICategoryToggles({ categories, visibleCategories, onToggle }) {
  const [open, setOpen] = useState(false)
  const activeCount = visibleCategories.length
  const totalCount = Object.keys(categories).length

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl shadow-md text-xs font-bold text-text hover:bg-stone-50 transition-colors cursor-pointer"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
        </svg>
        Filteri
        {activeCount < totalCount && (
          <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {activeCount}/{totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-border rounded-xl shadow-xl p-2 w-52">
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(categories).map(([key, cat]) => {
              const isActive = visibleCategories.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => onToggle(key)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-stone-50'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-1 mt-2 pt-2 border-t border-border">
            <button
              onClick={() => Object.keys(categories).forEach(k => !visibleCategories.includes(k) && onToggle(k))}
              className="flex-1 py-1 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg cursor-pointer transition-colors"
            >
              Sve
            </button>
            <button
              onClick={() => visibleCategories.forEach(k => onToggle(k))}
              className="flex-1 py-1 text-[10px] font-bold text-muted hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
            >
              Ništa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
