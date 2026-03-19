import { formatDistance, formatDuration } from '../../utils/geoUtils'

/**
 * Stats bar shown below the map. Displays total stops, distance, and drive time.
 */
export default function TripStatsBar({ stops = [], totalDistance = 0, totalDuration = 0 }) {
  return (
    <div className="bg-surface border-t border-border px-4 py-3 flex items-center justify-around gap-4">
      <div className="text-center">
        <p className="text-xs text-muted uppercase tracking-wider">Stops</p>
        <p className="text-lg font-bold text-text">{stops.length}</p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div className="text-center">
        <p className="text-xs text-muted uppercase tracking-wider">Distance</p>
        <p className="text-lg font-bold text-text">{formatDistance(totalDistance)}</p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div className="text-center">
        <p className="text-xs text-muted uppercase tracking-wider">Drive Time</p>
        <p className="text-lg font-bold text-text">{formatDuration(totalDuration)}</p>
      </div>
    </div>
  )
}
