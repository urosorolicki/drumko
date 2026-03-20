import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DAYS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']
const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
]

function isSameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toISO(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromISO(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

function formatDisplay(date) {
  if (!date) return null
  return date.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const todayRaw = new Date()
  const today = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), todayRaw.getDate(), 12, 0, 0)

  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const [selecting, setSelecting] = useState('start')
  const [viewMonth, setViewMonth] = useState(() => {
    const d = fromISO(startDate)
    return d
      ? new Date(d.getFullYear(), d.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const ref = useRef(null)
  const start = fromISO(startDate)
  const end = fromISO(endDate)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setSelecting('start')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayRaw = new Date(year, month, 1).getDay()
  const firstDay = (firstDayRaw + 6) % 7 // Monday = 0

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d, 12, 0, 0))
  while (days.length % 7 !== 0) days.push(null)

  const rangeEndPreview = selecting === 'end' && hovered ? hovered : end
  const nights = start && end ? Math.round((end - start) / 86400000) : null

  function isInRange(date) {
    if (!start || !rangeEndPreview) return false
    const lo = start < rangeEndPreview ? start : rangeEndPreview
    const hi = start < rangeEndPreview ? rangeEndPreview : start
    return date > lo && date < hi
  }

  function handleDayClick(date) {
    if (selecting === 'start') {
      onStartChange(toISO(date))
      onEndChange('')
      setSelecting('end')
    } else {
      if (start && date < start) {
        onStartChange(toISO(date))
        onEndChange(toISO(start))
      } else {
        onEndChange(toISO(date))
      }
      setOpen(false)
      setSelecting('start')
      setHovered(null)
    }
  }

  function handleOpen() {
    setOpen(v => !v)
    setSelecting('start')
    if (startDate) {
      const d = fromISO(startDate)
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }

  return (
    <div ref={ref} className="relative">

      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={handleOpen}
        className={`
          w-full px-4 py-3 border-2 rounded-xl bg-background text-left
          flex items-center gap-3 transition-all focus:outline-none cursor-pointer
          ${open
            ? 'border-secondary ring-2 ring-secondary/30'
            : 'border-border hover:border-secondary/60'
          }
        `}
      >
        <span className="text-xl shrink-0">📅</span>

        <div className="flex-1 min-w-0">
          {start ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-text text-sm">{formatDisplay(start)}</span>
              <span className="text-muted text-xs font-bold">→</span>
              <span className={`text-sm font-semibold ${end ? 'text-text' : 'text-muted'}`}>
                {end ? formatDisplay(end) : 'Datum povratka...'}
              </span>
            </div>
          ) : (
            <span className="text-muted text-sm">Odaberite datume putovanja</span>
          )}
        </div>

        {nights != null && nights > 0 && (
          <motion.span
            key={nights}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="shrink-0 text-xs font-bold bg-secondary/10 text-secondary-dark px-2.5 py-1 rounded-lg"
          >
            {nights} {nights === 1 ? 'noć' : 'noći'}
          </motion.span>
        )}
      </button>

      {/* ── Calendar Popover ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute z-50 top-full mt-2 left-0 right-0 bg-surface rounded-2xl border-2 border-border shadow-[0_8px_0_rgba(0,0,0,0.07),0_16px_32px_rgba(0,0,0,0.1)] p-4 select-none"
          >

            {/* Instruction pill */}
            <div className="flex justify-center mb-3">
              <motion.span
                key={selecting}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  text-xs font-bold px-3 py-1 rounded-full
                  ${selecting === 'start'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-success/10 text-success'
                  }
                `}
              >
                {selecting === 'start' ? '📍 Odaberi datum polaska' : '🏁 Odaberi datum povratka'}
              </motion.span>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold text-muted hover:bg-background hover:text-text transition-colors cursor-pointer"
              >
                ‹
              </button>
              <span className="font-bold text-text" style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}>
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold text-muted hover:bg-background hover:text-text transition-colors cursor-pointer"
              >
                ›
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-muted py-1 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {days.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="h-9" />

                const isStart = isSameDay(date, start)
                const isEnd = isSameDay(date, rangeEndPreview)
                const inRange = isInRange(date)
                const isPast = date < today
                const isToday = isSameDay(date, today)

                // Range background strip
                const showStrip = inRange || (isStart && rangeEndPreview) || (isEnd && start)
                const isStripStart = isStart && rangeEndPreview
                const isStripEnd = isEnd && start

                return (
                  <div
                    key={toISO(date)}
                    className="relative h-9 flex items-center justify-center"
                    onMouseEnter={() => selecting === 'end' && setHovered(date)}
                    onMouseLeave={() => selecting === 'end' && setHovered(null)}
                  >
                    {/* Range strip */}
                    {(inRange || isStripStart || isStripEnd) && (
                      <div
                        className={`absolute inset-y-1 bg-secondary/15 ${
                          isStripStart ? 'left-1/2 right-0' :
                          isStripEnd   ? 'left-0 right-1/2' :
                          'left-0 right-0'
                        }`}
                      />
                    )}

                    {/* Day button */}
                    <button
                      type="button"
                      disabled={isPast}
                      onClick={() => !isPast && handleDayClick(date)}
                      className={`
                        relative z-10 w-8 h-8 rounded-full text-sm font-semibold
                        transition-all duration-150
                        ${isStart || isEnd
                          ? 'bg-secondary text-white shadow-[0_3px_0_rgba(56,189,248,0.4)] scale-105'
                          : inRange
                          ? 'text-secondary-dark hover:bg-secondary/20 cursor-pointer'
                          : isPast
                          ? 'text-muted/30 cursor-not-allowed'
                          : isToday
                          ? 'text-primary font-bold ring-2 ring-primary/25 hover:bg-primary/8 cursor-pointer'
                          : 'text-text hover:bg-background cursor-pointer'
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Footer summary */}
            <AnimatePresence>
              {start && end && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-xs text-muted truncate">
                      {formatDisplay(start)} → {formatDisplay(end)}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg">
                      {nights} {nights === 1 ? 'noć' : 'noći'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
