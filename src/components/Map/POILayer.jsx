import { useState } from 'react'
import CustomMarker from './CustomMarker'
import { POIPopup } from './StopPopup'

export default function POILayer({ pois = [], onAddAsStop, visibleCategories = null }) {
  const filteredPois = visibleCategories
    ? pois.filter(poi => visibleCategories.includes(poi.category))
    : pois

  return (
    <>
      {filteredPois.map(poi => (
        <CustomMarker key={poi.id} type="poi" position={[poi.lat, poi.lng]} category={poi.category}>
          <POIPopup poi={poi} onAddAsStop={onAddAsStop} />
        </CustomMarker>
      ))}
    </>
  )
}

/**
 * Compact collapsible POI filter — single button, opens a small icon grid.
 */
export function POICategoryToggles({ categories, visibleCategories, onToggle }) {
  const [open, setOpen] = useState(false)
  const activeCount = visibleCategories.length
  const totalCount = Object.keys(categories).length

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      {/* Toggle button */}
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

      {/* Dropdown grid */}
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
