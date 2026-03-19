import { useState, useEffect, useCallback, useMemo } from 'react'
import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet'
import CustomMarker from './CustomMarker'
import RoutePolyline from './RoutePolyline'
import SearchBar from './SearchBar'
import StopPopup, { POIPopup } from './StopPopup'
import POILayer, { POICategoryToggles } from './POILayer'
import ZoomControls from './ZoomControls'
import TripStatsBar from './TripStatsBar'
import poiCategories from '../../data/poiCategories'

// Balkan region default center
const DEFAULT_CENTER = [44.8, 20.4]
const DEFAULT_ZOOM = 6

const TILE_URL = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'

/**
 * Helper component to fit map bounds when stops change
 */
function FitBounds({ points }) {
  const map = useMap()

  useEffect(() => {
    if (points && points.length >= 2) {
      const bounds = points.map(p => [p.lat, p.lng])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [points, map])

  return null
}

/**
 * Main map component used in Create Trip and Trip Detail pages.
 *
 * Props:
 * - startCity: { name, lat, lng }
 * - endCity: { name, lat, lng }
 * - stops: array of stop objects
 * - route: { geometry, totalDistance, totalDuration }
 * - pois: array of POI objects
 * - onAddStop: function(poi) - called when user adds a POI as stop
 * - onRemoveStop: function(stopId) - called when removing a stop
 * - onNoteChange: function(stopId, note) - called when editing a stop note
 * - onLocationSelect: function(location) - called from search bar
 * - showSearch: boolean
 * - showPOIs: boolean
 * - showStats: boolean
 * - interactive: boolean (default true)
 * - className: additional CSS classes
 * - height: CSS height (default '500px')
 */
export default function TripMap({
  startCity,
  endCity,
  stops = [],
  route = null,
  pois = [],
  onAddStop,
  onRemoveStop,
  onNoteChange,
  onLocationSelect,
  showSearch = true,
  showPOIs = true,
  showStats = true,
  interactive = true,
  className = '',
  height = '500px',
}) {
  const [visibleCategories, setVisibleCategories] = useState(
    poiCategories.map(c => c.key)
  )

  // All points for fitting bounds
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

  const center = startCity?.lat
    ? [startCity.lat, startCity.lng]
    : DEFAULT_CENTER

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

          {/* Fit bounds to show all points */}
          {allPoints.length >= 2 && <FitBounds points={allPoints} />}

          {/* Route polyline */}
          {route?.geometry && <RoutePolyline geometry={route.geometry} />}

          {/* Start marker */}
          {startCity?.lat && (
            <CustomMarker type="start" position={[startCity.lat, startCity.lng]}>
              <StopPopup
                stop={{ ...startCity, id: 'start', note: '' }}
                index={-1}
                totalStops={stops.length}
              />
            </CustomMarker>
          )}

          {/* Stop markers */}
          {stops.map((stop, i) => (
            <CustomMarker
              key={stop.id}
              type="stop"
              position={[stop.lat, stop.lng]}
              number={i + 1}
            >
              <StopPopup
                stop={stop}
                index={i}
                totalStops={stops.length}
                onRemove={onRemoveStop}
                onNoteChange={onNoteChange}
              />
            </CustomMarker>
          ))}

          {/* End marker */}
          {endCity?.lat && (
            <CustomMarker type="end" position={[endCity.lat, endCity.lng]}>
              <StopPopup
                stop={{ ...endCity, id: 'end', note: '' }}
                index={stops.length}
                totalStops={stops.length}
              />
            </CustomMarker>
          )}

          {/* POI markers */}
          {showPOIs && pois.length > 0 && (
            <POILayer
              pois={pois}
              visibleCategories={visibleCategories}
              onAddAsStop={onAddStop}
            />
          )}

          {/* Search bar */}
          {showSearch && <SearchBar onSelect={onLocationSelect} />}

          {/* Zoom controls */}
          <ZoomControls />
        </LeafletMap>

        {/* POI category toggles */}
        {showPOIs && pois.length > 0 && (
          <POICategoryToggles
            categories={poiCategories}
            visibleCategories={visibleCategories}
            onToggle={toggleCategory}
          />
        )}
      </div>

      {/* Trip stats bar */}
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
