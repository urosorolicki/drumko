import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { createRoot } from 'react-dom/client'
import StopMarker from './CustomMarker'
import RoutePolyline from './RoutePolyline'
import SearchBar from './SearchBar'
import POILayer, { POICategoryToggles } from './POILayer'
import CuratedStopLayer from './CuratedStopLayer'
import ZoomControls from './ZoomControls'
import TripStatsBar from './TripStatsBar'
import poiCategories from '../../data/poiCategories'
import { track } from '../../lib/analytics'

const DEFAULT_CENTER = [20.4, 44.8] // [lng, lat]
const DEFAULT_ZOOM = 6
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

/** Confirmation popup rendered inside a MapLibre popup DOM node */
function AddStopConfirm({ lat, lng, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    try {
      const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || ''
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&lang=sr&apiKey=${apiKey}`
      )
      const data = await res.json()
      const p = data?.features?.[0]?.properties || {}
      const locality = p.city || p.town || p.village || p.municipality || p.name
      name = [locality, p.country].filter(Boolean).join(', ') || p.formatted?.split(',').slice(0, 2).join(', ') || name
    } catch (_) {}
    track('custom_stop_added', {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      near_city: name,
      source: 'map_click',
    })
    onConfirm({ lat, lng, name, category: 'stop' })
  }

  return (
    <div className="p-3 w-[min(180px,60vw)]">
      <p className="text-sm font-bold text-text mb-3">Dodaj stanicu ovde?</p>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 py-1.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-60"
        >
          {loading ? '...' : 'Da, dodaj'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 bg-stone-100 text-text text-xs font-bold rounded-lg cursor-pointer hover:bg-stone-200"
        >
          Otkaži
        </button>
      </div>
    </div>
  )
}

export default function TripMap({
  startCity,
  endCity,
  stops = [],
  route = null,
  pois = [],
  curatedStops = [],
  onAddStop,
  onRemoveStop,
  onNoteChange,
  showSearch = true,
  showPOIs = true,
  showStats = true,
  routeLoading = false,
  interactive = true,
  className = '',
  height = '500px',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState(Object.keys(poiCategories))

  // Refs used inside map event handlers to avoid stale closures
  const onAddStopRef = useRef(onAddStop)
  const routeGeometryRef = useRef(route?.geometry)
  useEffect(() => { onAddStopRef.current = onAddStop }, [onAddStop])
  useEffect(() => { routeGeometryRef.current = route?.geometry }, [route?.geometry])

  // ── Initialize MapLibre ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const initialCenter = startCity?.lat
      ? [startCity.lng, startCity.lat]
      : DEFAULT_CENTER

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: startCity?.lat ? 8 : DEFAULT_ZOOM,
      interactive,
      attributionControl: false,
    })

    map.on('load', () => {
      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      mapRef.current = null
      setMapReady(false)
      map.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fit bounds when key points change ────────────────────────────────────
  const allPoints = useMemo(() => {
    const pts = []
    if (startCity?.lat) pts.push([startCity.lng, startCity.lat])
    if (endCity?.lat) pts.push([endCity.lng, endCity.lat])
    stops.forEach(s => { if (s.lat) pts.push([s.lng, s.lat]) })
    return pts
  }, [startCity, endCity, stops])

  useEffect(() => {
    const map = mapRef.current
    if (!map || allPoints.length < 2) return

    const bounds = allPoints.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(allPoints[0], allPoints[0])
    )

    const id = setTimeout(() => {
      map.resize()
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 })
    }, 200)

    return () => clearTimeout(id)
  }, [allPoints])

  // ── Map click → add stop confirmation popup ──────────────────────────────
  useEffect(() => {
    if (!mapReady || !interactive || !onAddStop) return
    const map = mapRef.current

    function handleClick(e) {
      // Ignore clicks that land on a POI or cluster layer
      const hit = map.queryRenderedFeatures(e.point, { layers: ['poi-points', 'poi-clusters'] })
      if (hit.length > 0) return

      // Only offer add-stop when a route exists
      if (!routeGeometryRef.current) return

      const { lat, lng } = e.lngLat

      const popupNode = document.createElement('div')
      const root = createRoot(popupNode)

      const popup = new maplibregl.Popup({
        closeButton: false,
        offset: [0, 0],
        className: 'drumko-popup',
        maxWidth: 'none',
      })

      function dismiss() {
        popup.remove()
        root.unmount()
      }

      root.render(
        <AddStopConfirm
          lat={lat}
          lng={lng}
          onConfirm={(stop) => { onAddStopRef.current?.(stop); dismiss() }}
          onCancel={dismiss}
        />
      )

      popup.setDOMContent(popupNode).setLngLat([lng, lat]).addTo(map)
      popup.on('close', () => root.unmount())
    }

    map.on('click', handleClick)
    return () => map.off('click', handleClick)
  }, [mapReady, interactive, onAddStop])

  const toggleCategory = useCallback((key) => {
    setVisibleCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }, [])

  const handleSearchSelect = useCallback((result) => {
    if (onAddStop) {
      onAddStop({ lat: result.lat, lng: result.lng, name: result.name.split(',')[0], category: 'stop' })
    }
  }, [onAddStop])

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative rounded-xl overflow-hidden" style={{ height }}>
        {/* MapLibre canvas container */}
        <div ref={containerRef} className="w-full h-full" />

        {mapReady && (
          <>
            <RoutePolyline map={mapRef.current} geometry={route?.geometry} />

            {startCity?.lat && (
              <StopMarker
                map={mapRef.current}
                type="start"
                position={{ lat: startCity.lat, lng: startCity.lng }}
                stop={{ ...startCity, id: 'start', note: '' }}
                index={-1}
                totalStops={stops.length}
              />
            )}

            {stops.map((stop, i) => (
              <StopMarker
                key={stop.id}
                map={mapRef.current}
                type="stop"
                position={{ lat: stop.lat, lng: stop.lng }}
                number={i + 1}
                stop={stop}
                index={i}
                totalStops={stops.length}
                onRemove={onRemoveStop}
                onNoteChange={onNoteChange}
              />
            ))}

            {endCity?.lat && (
              <StopMarker
                map={mapRef.current}
                type="end"
                position={{ lat: endCity.lat, lng: endCity.lng }}
                stop={{ ...endCity, id: 'end', note: '' }}
                index={stops.length}
                totalStops={stops.length}
              />
            )}

            {showPOIs && (
              <POILayer
                map={mapRef.current}
                pois={pois}
                visibleCategories={visibleCategories}
                onAddAsStop={onAddStop}
              />
            )}

            <CuratedStopLayer
              map={mapRef.current}
              stops={curatedStops}
              onAddAsStop={onAddStop}
            />

            {showSearch && (
              <SearchBar
                map={mapRef.current}
                onSelect={handleSearchSelect}
                placeholder="Pretraži lokaciju..."
              />
            )}

            <ZoomControls map={mapRef.current} />
          </>
        )}

        {/* POI category filter — outside map canvas so z-index works correctly */}
        {showPOIs && pois.length > 0 && (
          <POICategoryToggles
            categories={poiCategories}
            visibleCategories={visibleCategories}
            onToggle={toggleCategory}
          />
        )}
      </div>

      {showStats && (
        <TripStatsBar
          stops={stops}
          totalDistance={route?.totalDistance || 0}
          totalDuration={route?.totalDuration || 0}
          loading={routeLoading}
        />
      )}
    </div>
  )
}
