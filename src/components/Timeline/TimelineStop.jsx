import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const SLOT_META = {
  meal:       { label: 'Obrok',   dotColor: '#F59E0B', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
  playground: { label: 'Dečija', dotColor: '#22C55E', bg: 'bg-green-50',   border: 'border-green-200',   text: 'text-green-700' },
  rest:       { label: 'Odmor',  dotColor: '#6366F1', bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700' },
  scenic:     { label: 'Pejzaž',dotColor: '#8B5CF6', bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700' },
  fuel:       { label: 'Gorivo', dotColor: '#78716C', bg: 'bg-stone-50',   border: 'border-stone-200',   text: 'text-stone-600' },
}

const SLOT_DOT_FILL = {
  meal: 'bg-amber-400', playground: 'bg-green-400', rest: 'bg-indigo-400',
  scenic: 'bg-violet-400', fuel: 'bg-stone-400',
}

const AMENITY_ICONS = [
  { key: 'hasToilet',    label: 'Toalet',   icon: '🚽' },
  { key: 'hasParking',   label: 'Parking',  icon: '🅿️' },
  { key: 'hasFood',      label: 'Hrana',    icon: '🍽️' },
  { key: 'hasShade',     label: 'Hlad',     icon: '🌳' },
  { key: 'hasPlayground',label: 'Deč. park',icon: '🛝' },
]

const PRICE_LABEL = { 1: 'Besplatno', 2: 'Pristupačno', 3: 'Skuplje' }

function formatArrival(arrivalHour) {
  if (arrivalHour == null) return null
  const h = Math.floor(arrivalHour) % 24
  const m = Math.round((arrivalHour - Math.floor(arrivalHour)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export default function TimelineStop({
  stop,
  type = 'suggestion',  // 'suggestion' | 'confirmed' | 'endpoint'
  isFocused = false,
  onAccept,
  onReject,
  onShowDifferent,
  onRemove,
  onFocus,
  alternateCount = 0,
  isLast = false,
}) {
  const [expanded, setExpanded] = useState(false)
  const isSuggestion = type === 'suggestion'
  const isEndpoint = type === 'endpoint'
  const slotMeta = SLOT_META[stop.slot] || SLOT_META.rest
  const arrivalTime = formatArrival(stop.arrivalHour)
  const amenities = AMENITY_ICONS.filter(a => stop[a.key])

  if (isEndpoint) {
    const isStart = stop._isStart
    return (
      <div className="flex items-center gap-3 mb-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-[0_3px_0_rgba(0,0,0,0.12)] ${
          isStart ? 'bg-success' : 'bg-primary'
        }`}>
          {isStart ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15" stroke="white" strokeWidth="2"/>
            </svg>
          )}
        </div>
        <div className={`flex-1 rounded-xl px-3 py-2 border ${
          isStart ? 'bg-success/8 border-success/20' : 'bg-primary/8 border-primary/20'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isStart ? 'text-success' : 'text-primary'}`}>
            {isStart ? 'Polazak' : 'Odredište'}
          </p>
          <p className="text-sm font-bold text-text">{stop.name || '...'}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      layout
      className="flex gap-3"
      onClick={() => onFocus?.()}
    >
      {/* Left rail dot */}
      <div className="flex flex-col items-center w-9 shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
          isSuggestion
            ? 'border-dashed border-primary/40 bg-primary/5'
            : 'border-primary bg-primary/10'
        } ${isFocused ? 'ring-2 ring-primary/30' : ''}`}>
          <div className={`w-3 h-3 rounded-full ${
            isSuggestion
              ? (SLOT_DOT_FILL[stop.slot] || 'bg-primary/40')
              : 'bg-primary'
          }`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 border-l-2 border-dashed border-stone-200 min-h-[8px] mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-2 rounded-2xl border-2 overflow-hidden ${
        isFocused ? 'shadow-lg' : 'shadow-[0_2px_8px_rgba(0,0,0,0.07)]'
      } ${
        isSuggestion
          ? 'border-dashed border-primary/30 bg-orange-50/60'
          : 'border-primary/30 bg-surface'
      }`}>

        {/* Image */}
        {stop.imageUrl && (
          <img
            src={stop.imageUrl}
            alt={stop.name}
            className="w-full h-28 object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

        <div className="p-3 pb-2">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1.5">
            {stop.slot && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${slotMeta.bg} ${slotMeta.border} border ${slotMeta.text}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: slotMeta.dotColor }} />
                {slotMeta.label.toUpperCase()}
              </span>
            )}
            {arrivalTime && (
              <span className="text-[10px] font-bold text-muted ml-auto shrink-0">
                ~{arrivalTime}
              </span>
            )}
          </div>

          {/* Name */}
          <p className="text-sm font-bold text-text leading-snug mb-1">{stop.name}</p>

          {/* Copy text */}
          {stop.copy && (
            <p className="text-xs text-muted leading-snug italic mb-2">"{stop.copy}"</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {stop.source === 'curated' && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                Drumko preporuka
              </span>
            )}
            {stop.kidScore >= 4 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                👶 Za decu
              </span>
            )}
            {stop.detourMinutes > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                +{stop.detourMinutes}min skretanje
              </span>
            )}
          </div>

          {/* Expandable detail */}
          <AnimatePresence>
            {expanded && amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mb-2 pt-1 border-t border-border/40">
                  {amenities.map(a => (
                    <span key={a.key} className="flex items-center gap-1 text-[11px] text-muted font-semibold">
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </span>
                  ))}
                  {stop.priceTier && (
                    <span className="flex items-center gap-1 text-[11px] text-muted font-semibold ml-auto">
                      💰 {PRICE_LABEL[stop.priceTier] || ''}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand toggle (only if amenities available) */}
          {amenities.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
              className="text-[10px] font-bold text-muted/70 hover:text-primary transition-colors cursor-pointer mb-1.5"
            >
              {expanded ? 'Manje ▲' : 'Više detalja ▼'}
            </button>
          )}
        </div>

        {/* Action row */}
        {isSuggestion ? (
          <div className="flex gap-1.5 px-3 pb-3">
            <button
              onClick={(e) => { e.stopPropagation(); onAccept?.() }}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/90 active:scale-95 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Dodaj stanicu
            </button>
            {alternateCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowDifferent?.() }}
                title="Pokaži drugu opciju"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border-2 border-border bg-surface text-muted hover:border-primary/40 hover:text-primary cursor-pointer transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                </svg>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onReject?.() }}
              title="Odbaci predlog"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border-2 border-border bg-surface text-muted hover:border-red-300 hover:text-red-400 cursor-pointer transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex justify-end px-3 pb-3">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.() }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-red-400 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-red-50"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Ukloni
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
