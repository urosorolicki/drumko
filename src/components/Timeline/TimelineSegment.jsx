function formatDrive(fromMin, toMin) {
  const diff = Math.round(toMin - fromMin)
  if (diff <= 0) return null
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

export default function TimelineSegment({ fromMin = 0, toMin, segKm }) {
  const driveLabel = toMin != null ? formatDrive(fromMin, toMin) : null

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center w-9 shrink-0">
        <div className="w-0.5 flex-1 border-l-2 border-dashed border-stone-200 min-h-[24px]" />
      </div>
      <div className="flex items-center gap-2 py-1 pb-2">
        {driveLabel && (
          <span className="text-[10px] font-bold text-muted bg-stone-50 border border-border/60 rounded-full px-2 py-0.5">
            {driveLabel} vožnje
          </span>
        )}
        {segKm != null && segKm > 0 && (
          <span className="text-[10px] text-muted font-semibold">{Math.round(segKm)} km</span>
        )}
      </div>
    </div>
  )
}
