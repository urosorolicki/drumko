export default function TripCardSkeleton() {
  return (
    <div className="trip-card overflow-hidden animate-pulse">
      {/* Header */}
      <div className="h-[76px] bg-gradient-to-r from-stone-200 to-stone-100 relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Trip name */}
        <div className="h-4 bg-stone-200 rounded-lg w-3/4" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-stone-100 rounded-xl p-2.5 flex flex-col items-center gap-1.5">
              <div className="h-5 w-8 bg-stone-200 rounded" />
              <div className="h-2.5 w-10 bg-stone-200 rounded" />
            </div>
          ))}
        </div>

        {/* Date row */}
        <div className="h-3 bg-stone-200 rounded w-2/5" />
      </div>
    </div>
  )
}
