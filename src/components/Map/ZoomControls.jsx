import { useMap } from 'react-leaflet'

/**
 * Custom zoom controls positioned at bottom-right of the map.
 * White rounded buttons with + and - icons.
 */
export default function ZoomControls() {
  const map = useMap()

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-surface rounded-lg border border-border shadow-md flex items-center justify-center text-text hover:bg-background transition-colors"
        aria-label="Zoom in"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-surface rounded-lg border border-border shadow-md flex items-center justify-center text-text hover:bg-background transition-colors"
        aria-label="Zoom out"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14"/>
        </svg>
      </button>
    </div>
  )
}
