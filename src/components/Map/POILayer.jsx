import { useState } from 'react'
import CustomMarker from './CustomMarker'
import { POIPopup } from './StopPopup'

/**
 * Renders POI markers on the map with category toggles.
 * POIs are grouped by category and can be toggled on/off.
 */
export default function POILayer({ pois = [], onAddAsStop, visibleCategories = null }) {
  // Filter POIs by visible categories
  const filteredPois = visibleCategories
    ? pois.filter(poi => visibleCategories.includes(poi.category))
    : pois

  return (
    <>
      {filteredPois.map(poi => (
        <CustomMarker
          key={poi.id}
          type="poi"
          position={[poi.lat, poi.lng]}
          category={poi.category}
        >
          <POIPopup poi={poi} onAddAsStop={onAddAsStop} />
        </CustomMarker>
      ))}
    </>
  )
}

/**
 * Toggle buttons for POI categories. Shown as a floating panel on the map.
 */
export function POICategoryToggles({ categories, visibleCategories, onToggle }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-surface rounded-xl border border-border shadow-lg p-2 flex flex-col gap-1">
      {Object.entries(categories).map(([key, cat]) => {
        const isActive = visibleCategories.includes(key)
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-background'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
