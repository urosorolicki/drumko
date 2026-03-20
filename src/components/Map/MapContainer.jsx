import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { MapContainer as LeafletMap, TileLayer, useMap, useMapEvents, Popup } from 'react-leaflet'
import CustomMarker from './CustomMarker'
import RoutePolyline from './RoutePolyline'
import SearchBar from './SearchBar'
import StopPopup, { POIPopup } from './StopPopup'
import POILayer, { POICategoryToggles } from './POILayer'
import ZoomControls from './ZoomControls'
import TripStatsBar from './TripStatsBar'
import poiCategories from '../../data/poiCategories'

const DEFAULT_CENTER = [44.8, 20.4]
const DEFAULT_ZOOM = 6
const TILE_URL = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

/** Fit map to all points when they change */
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points && points.length >= 2) {
      map.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 12 })
    }
  }, [points, map])
  return null
}

/**
 * Handles map clicks → shows a "Dodaj stanicu ovde?" confirmation marker.
 * On confirm: reverse geocodes and calls onAddStop.
 */
function MapClickHandler({ onAddStop, enabled }) {
  const [pending, setPending] = useState(null) // { lat, lng }
  const [loading, setLoading] = useState(false)
  const markerRef = useRef(null)

  useMapEvents({
    click(e) {
      if (!enabled || !onAddStop) return
      setPending({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  // Auto-open popup when pending appears
  useEffect(() => {
    if (pending && markerRef.current) {
      markerRef.current.openPopup()
    }
  }, [pending])

  async function handleConfirm() {
    if (!pending) return
    setLoading(true)
    let name = `${pending.lat.toFixed(4)}, ${pending.lng.toFixed(4)}`
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${pending.lat}&lon=${pending.lng}&format=json`,
        { headers: { 'Accept-Language': 'sr' } }
      )
      const data = await res.json()
      name = data.display_name?.split(',').slice(0, 2).join(', ') || name
    } catch (_) { /* use coords as fallback */ }

    onAddStop({ lat: pending.lat, lng: pending.lng, name, category: 'stop' })
    setPending(null)
    setLoading(false)
  }

  if (!pending) return null

  return (
    <CustomMarker
      ref={markerRef}
      type="stop"
      position={[pending.lat, pending.lng]}
      number="+"
    >
      <Popup>
        <div className="p-3 min-w-[180px]">
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
              onClick={() => setPending(null)}
              className="flex-1 py-1.5 bg-stone-100 text-text text-xs font-bold rounded-lg cursor-pointer hover:bg-stone-200"
            >
              Otkaži
            </button>
          </div>
        </div>
      </Popup>
    </CustomMarker>
  )
}

export default function TripMap({
  startCity,
  endCity,
  stops = [],
  route = null,
  pois = [],
  onAddStop,
  onRemoveStop,
  onNoteChange,
  showSearch = true,
  showPOIs = true,
  showStats = true,
  interactive = true,
  className = '',
  height = '500px',
}) {
  const [visibleCategories, setVisibleCategories] = useState(Object.keys(poiCategories))

  const allPoints = useMemo(() => {
    const pts = []
    if (startCity?.lat) pts.push(startCity)
    if (endCity?.lat) pts.push(endCity)
    stops.forEach(s => { if (s.lat) pts.push(s) })
    return pts
  }, [startCity, endCity, stops])

  const toggleCategory = useCallback((key) => {
    setVisibleCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }, [])

  // SearchBar selection → add as stop (if onAddStop provided)
  const handleSearchSelect = useCallback((result) => {
    if (onAddStop) {
      onAddStop({ lat: result.lat, lng: result.lng, name: result.name.split(',')[0], category: 'stop' })
    }
  }, [onAddStop])

  const center = startCity?.lat ? [startCity.lat, startCity.lng] : DEFAULT_CENTER

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative" style={{ height }}>
        <LeafletMap
          center={center}
          zoom={startCity?.lat ? 8 : DEFAULT_ZOOM}
          className="w-full h-full rounded-xl z-0"
          zoomControl={false}
          scrollWheelZoom={interactive}
          dragging={interactive}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

          {allPoints.length >= 2 && <FitBounds points={allPoints} />}

          {route?.geometry && <RoutePolyline geometry={route.geometry} />}

          {/* Click to add stop — only when we have a route */}
          {interactive && onAddStop && route?.geometry && (
            <MapClickHandler onAddStop={onAddStop} enabled={true} />
          )}

          {startCity?.lat && (
            <CustomMarker type="start" position={[startCity.lat, startCity.lng]}>
              <StopPopup stop={{ ...startCity, id: 'start', note: '' }} index={-1} totalStops={stops.length} />
            </CustomMarker>
          )}

          {stops.map((stop, i) => (
            <CustomMarker key={stop.id} type="stop" position={[stop.lat, stop.lng]} number={i + 1}>
              <StopPopup
                stop={stop}
                index={i}
                totalStops={stops.length}
                onRemove={onRemoveStop}
                onNoteChange={onNoteChange}
              />
            </CustomMarker>
          ))}

          {endCity?.lat && (
            <CustomMarker type="end" position={[endCity.lat, endCity.lng]}>
              <StopPopup stop={{ ...endCity, id: 'end', note: '' }} index={stops.length} totalStops={stops.length} />
            </CustomMarker>
          )}

          {showPOIs && pois.length > 0 && (
            <POILayer pois={pois} visibleCategories={visibleCategories} onAddAsStop={onAddStop} />
          )}

          {showSearch && <SearchBar onSelect={handleSearchSelect} placeholder="Pretraži lokaciju..." />}

          <ZoomControls />
        </LeafletMap>

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
        />
      )}
    </div>
  )
}
