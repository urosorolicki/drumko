import { useState } from 'react'
import { Popup, useMap } from 'react-leaflet'
import poiCategories from '../../data/poiCategories'

export default function StopPopup({ stop, index, onRemove, onNoteChange }) {
  return (
    <Popup>
      <div className="p-3 min-w-[220px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
            {index < 0 ? '🏠' : index === 999 ? '🏁' : index + 1}
          </span>
          <h3 className="font-semibold text-text text-sm leading-tight">{stop.name?.split(',')[0]}</h3>
        </div>

        {onNoteChange && (
          <textarea
            value={stop.note || ''}
            onChange={(e) => onNoteChange(stop.id, e.target.value)}
            placeholder="Beleška za ovu stanicu..."
            rows={2}
            className="w-full text-xs p-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 bg-background mb-2"
          />
        )}

        {onRemove && (
          <button
            onClick={() => onRemove(stop.id)}
            className="w-full text-xs text-danger hover:bg-danger/10 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            Ukloni stanicu
          </button>
        )}
      </div>
    </Popup>
  )
}

export function POIPopup({ poi, onAddAsStop }) {
  const map = useMap()
  const [added, setAdded] = useState(false)

  const cat = poiCategories[poi.category]
  const emoji = cat?.icon || '📍'
  const label = cat?.label || poi.category

  function handleAdd(e) {
    e.stopPropagation()
    if (added) return
    onAddAsStop(poi)
    setAdded(true)
    setTimeout(() => map.closePopup(), 700)
  }

  return (
    <Popup>
      <div className="p-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-bold text-text text-sm leading-tight">{poi.name}</h3>
            <p className="text-xs text-muted mt-0.5">{label}</p>
          </div>
        </div>

        {onAddAsStop && (
          <button
            onClick={handleAdd}
            className={`w-full text-xs py-2 rounded-xl transition-all font-bold cursor-pointer ${
              added
                ? 'bg-success text-white'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {added ? '✓ Dodato u rutu!' : '+ Dodaj kao stanicu'}
          </button>
        )}
      </div>
    </Popup>
  )
}
