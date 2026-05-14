export default function ZoomControls({ map }) {
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={() => map?.zoomIn()}
        className="w-11 h-11 bg-surface rounded-xl border border-border shadow-md flex items-center justify-center text-text hover:bg-background active:scale-95 transition-all touch-manipulation"
        aria-label="Uvećaj"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <button
        onClick={() => map?.zoomOut()}
        className="w-11 h-11 bg-surface rounded-xl border border-border shadow-md flex items-center justify-center text-text hover:bg-background active:scale-95 transition-all touch-manipulation"
        aria-label="Umanji"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14"/>
        </svg>
      </button>
    </div>
  )
}
