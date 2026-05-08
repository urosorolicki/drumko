import { Fragment } from 'react'
import { formatDistance, formatDuration } from '../../utils/geoUtils'

export default function TripStatsBar({ stops = [], totalDistance = 0, totalDuration = 0, loading = false }) {
  const items = [
    { label: 'Stanice', value: stops.length },
    { label: 'Distanca', value: formatDistance(totalDistance) },
    { label: 'Vožnja', value: formatDuration(totalDuration) },
  ]

  const isLoading = loading && totalDistance === 0

  return (
    <div className="bg-surface border-t border-border px-4 py-3 flex items-center justify-around">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <div className="w-px h-8 bg-border shrink-0" />}
          <div className="text-center flex-1">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">{item.label}</p>
            {isLoading ? (
              <div className="h-[26px] w-12 bg-border/60 rounded-md animate-pulse mx-auto mt-0.5" />
            ) : (
              <p className="text-lg font-bold text-text">{item.value}</p>
            )}
          </div>
        </Fragment>
      ))}
    </div>
  )
}
