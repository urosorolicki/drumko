import { useState } from 'react'
import { Popup, useMap } from 'react-leaflet'

/**
 * Styled popup for route stops. Shows stop details with editable notes.
 */
export default function StopPopup({ stop, index, onRemove, onNoteChange, totalStops }) {
  return (
    <Popup>
      <div className="p-3 min-w-[220px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <h3 className="font-semibold text-text text-sm">{stop.name}</h3>
          </div>
        </div>

        {stop.arrivalTime && (
          <p className="text-xs text-muted mb-2">
            Est. arrival: {stop.arrivalTime}
          </p>
        )}

        <textarea
          value={stop.note || ''}
          onChange={(e) => onNoteChange?.(stop.id, e.target.value)}
          placeholder="Add notes..."
          rows={2}
          className="w-full text-xs p-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 bg-background"
        />

        {onRemove && (
          <button
            onClick={() => onRemove(stop.id)}
            className="mt-2 w-full text-xs text-danger hover:bg-danger/10 py-1.5 rounded-lg transition-colors font-medium"
          >
            Remove Stop
          </button>
        )}
      </div>
    </Popup>
  )
}

/**
 * Popup for POI markers. Shows name and "Add as Stop" button.
 */
export function POIPopup({ poi, onAddAsStop }) {
  const map = useMap()
  const [added, setAdded] = useState(false)

  const categoryEmojis = {
    fuel: '⛽',
    restaurant: '🍽️',
    cafe: '☕',
    attraction: '🏛️',
    park: '🌳',
    hotel: '🏨',
  }

  function handleAdd(e) {
    e.stopPropagation()
    if (added) return
    onAddAsStop(poi)
    setAdded(true)
    setTimeout(() => map.closePopup(), 800)
  }

  return (
    <Popup>
      <div className="p-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{categoryEmojis[poi.category] || '📍'}</span>
          <div>
            <h3 className="font-semibold text-text text-sm">{poi.name}</h3>
            <p className="text-xs text-muted capitalize">{poi.category}</p>
          </div>
        </div>

        {onAddAsStop && (
          <button
            onClick={handleAdd}
            className={`w-full text-xs py-1.5 rounded-lg transition-colors font-medium ${
              added
                ? 'bg-success text-white cursor-default'
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {added ? '✓ Dodato!' : '+ Dodaj kao stanicu'}
          </button>
        )}
      </div>
    </Popup>
  )
}
