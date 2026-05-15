import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import TimelineStop from './TimelineStop'
import TimelineSegment from './TimelineSegment'
import NarrativeBubble from './NarrativeBubble'
import TimelineSkeleton from './TimelineSkeleton'
import { track } from '../../lib/analytics'

export default function TripTimeline({
  suggestions = [],
  confirmedStops = [],  // form.stops with km already injected
  startCity,
  endCity,
  narrative,
  loading = false,
  totalDurationSec = 0,
  totalKm = 0,
  onAcceptSuggestion,   // (suggestion) => void
  onRemoveConfirmed,    // (stopId) => void
  focusedStopId,
  onFocus,
}) {
  // Local state: which suggestions have been dismissed and alternate index per slot
  const [dismissed, setDismissed] = useState(new Set())
  const [altIndex, setAltIndex] = useState({})  // suggestionId → current alternate index

  const visibleSuggestions = useMemo(
    () => suggestions.filter(s => !dismissed.has(s.id)),
    [suggestions, dismissed]
  )

  // Get the effective stop for a suggestion (may have been swapped to an alternate)
  function getEffectiveStop(sug) {
    const idx = altIndex[sug.id] ?? 0
    if (idx === 0) return sug
    const alt = sug.alternates?.[idx - 1]
    return alt ? { ...alt, slot: sug.slot, km: sug.km, driveTimeMin: sug.driveTimeMin, arrivalHour: sug.arrivalHour, alternates: sug.alternates } : sug
  }

  function handleAccept(sug) {
    const effective = getEffectiveStop(sug)
    onAcceptSuggestion?.({
      id: `city-${effective.lat}-${effective.lng}`,
      name: effective.name,
      lat: effective.lat,
      lng: effective.lng,
      type: 'stop',
      category: effective.category || 'stop',
      note: '',
      arrivalTime: '',
    })
    track('suggestion_accepted', { stop_id: effective.id, source: effective.source, slot: sug.slot, position: sug.driveTimeMin })
    setDismissed(prev => new Set([...prev, sug.id]))
  }

  function handleReject(sug) {
    const effective = getEffectiveStop(sug)
    track('suggestion_rejected', { stop_id: effective.id, source: effective.source, slot: sug.slot, position: sug.driveTimeMin })
    setDismissed(prev => new Set([...prev, sug.id]))
  }

  function handleShowDifferent(sug) {
    const currentIdx = altIndex[sug.id] ?? 0
    const maxIdx = (sug.alternates?.length ?? 0)
    const nextIdx = currentIdx + 1 > maxIdx ? 0 : currentIdx + 1
    const effective = getEffectiveStop(sug)
    track('suggestion_rejected', { stop_id: effective.id, source: effective.source, slot: sug.slot, position: sug.driveTimeMin, reason: 'show_different' })
    setAltIndex(prev => ({ ...prev, [sug.id]: nextIdx }))
  }

  // Build a unified timeline: interleave confirmed stops + visible suggestions by km
  const nodes = useMemo(() => {
    const items = []
    for (const s of confirmedStops) {
      items.push({ type: 'confirmed', km: s.km ?? 0, driveTimeMin: (s.km / (totalKm || 1)) * (totalDurationSec / 60), stop: s })
    }
    for (const s of visibleSuggestions) {
      // Only show suggestion if it's not already covered by a confirmed stop nearby
      const alreadyConfirmed = confirmedStops.some(c => Math.abs((c.km ?? 0) - (s.km ?? 0)) < 15)
      if (!alreadyConfirmed) {
        items.push({ type: 'suggestion', km: s.km ?? 0, driveTimeMin: s.driveTimeMin ?? 0, stop: s })
      }
    }
    return items.sort((a, b) => a.km - b.km)
  }, [confirmedStops, visibleSuggestions, totalKm, totalDurationSec])

  const hasRoute = startCity?.lat && endCity?.lat

  if (!hasRoute) {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
            <path d="M3 7h18M3 12h18M3 17h18"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-text mb-1">Unesi polazak i odredište</p>
        <p className="text-xs text-muted">Ruta se prikazuje čim uneseš gradove</p>
      </div>
    )
  }

  return (
    <div>
      {/* Narrative bubble */}
      {narrative && !loading && <NarrativeBubble narrative={narrative} />}

      {/* Timeline body */}
      <div className="px-3 pb-3">
        {/* Start node */}
        <TimelineStop
          stop={{ name: startCity?.city || startCity?.name?.split(',')[0] || '...', _isStart: true }}
          type="endpoint"
        />

        {loading ? (
          <TimelineSkeleton count={3} />
        ) : (
          <AnimatePresence initial={false}>
            {nodes.map((node, idx) => {
              const prevKm = idx === 0 ? 0 : (nodes[idx - 1].km ?? 0)
              const prevMin = idx === 0 ? 0 : (nodes[idx - 1].driveTimeMin ?? 0)

              if (node.type === 'suggestion') {
                const effective = getEffectiveStop(node.stop)
                return (
                  <motion.div
                    key={`sug-${node.stop.id}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ delay: idx * 0.1, type: 'spring', stiffness: 240, damping: 26 }}
                  >
                    <TimelineSegment fromMin={prevMin} toMin={node.driveTimeMin} segKm={node.km - prevKm} />
                    <TimelineStop
                      stop={effective}
                      type="suggestion"
                      isFocused={focusedStopId === effective.id}
                      alternateCount={node.stop.alternates?.length ?? 0}
                      onAccept={() => handleAccept(node.stop)}
                      onReject={() => handleReject(node.stop)}
                      onShowDifferent={() => handleShowDifferent(node.stop)}
                      onFocus={() => onFocus?.(effective)}
                      isLast={idx === nodes.length - 1}
                    />
                  </motion.div>
                )
              }

              return (
                <motion.div
                  key={`conf-${node.stop.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 26 }}
                >
                  <TimelineSegment fromMin={prevMin} toMin={node.driveTimeMin} segKm={node.km - prevKm} />
                  <TimelineStop
                    stop={{ ...node.stop, arrivalHour: node.driveTimeMin / 60 }}
                    type="confirmed"
                    isFocused={focusedStopId === node.stop.id}
                    onRemove={() => onRemoveConfirmed?.(node.stop.id)}
                    onFocus={() => onFocus?.(node.stop)}
                    isLast={idx === nodes.length - 1}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}

        {/* End-to-destination segment */}
        {!loading && (() => {
          const lastKm = nodes.length > 0 ? (nodes[nodes.length - 1].km ?? 0) : 0
          const lastMin = nodes.length > 0 ? (nodes[nodes.length - 1].driveTimeMin ?? 0) : 0
          const endMin = totalDurationSec / 60
          return (
            <TimelineSegment
              fromMin={lastMin}
              toMin={endMin > 0 ? endMin : null}
              segKm={totalKm > 0 ? totalKm - lastKm : null}
            />
          )
        })()}

        {/* End node */}
        <TimelineStop
          stop={{ name: endCity?.city || endCity?.name?.split(',')[0] || '...', _isStart: false }}
          type="endpoint"
        />
      </div>
    </div>
  )
}
