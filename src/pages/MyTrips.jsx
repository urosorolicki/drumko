import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import useAuthStore from '../store/useAuthStore'
import { formatDistance } from '../utils/geoUtils'
import { calculateTripDays } from '../utils/budgetUtils'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'

/* Cycling gradient palettes per trip index */
const CARD_GRADIENTS = [
  { from: '#F97316', to: '#FDBA74', text: 'white' },
  { from: '#38BDF8', to: '#7DD3FC', text: 'white' },
  { from: '#22C55E', to: '#86EFAC', text: 'white' },
  { from: '#A78BFA', to: '#C4B5FD', text: 'white' },
  { from: '#F59E0B', to: '#FDE68A', text: 'white' },
  { from: '#EC4899', to: '#F9A8D4', text: 'white' },
]

function TripStatusBadge({ startDate, endDate }) {
  if (!startDate) return null
  const now = new Date()
  const start = new Date(startDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T23:59:59') : null

  let label, cls
  if (now < start) {
    const daysUntil = Math.ceil((start - now) / 86400000)
    label = daysUntil === 1 ? 'Sutra!' : `Za ${daysUntil} dana`
    cls = 'bg-secondary/15 text-secondary-dark'
  } else if (end && now > end) {
    label = 'Završeno'
    cls = 'bg-muted/15 text-muted'
  } else {
    label = '🟢 Aktivno'
    cls = 'bg-success/15 text-success'
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute inset-0 bg-surface/95 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-3 p-4"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-sm font-bold text-text text-center">Obrisati ovo putovanje?</p>
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onCancel}
          className="px-4 py-1.5 rounded-xl border-2 border-border text-sm font-bold text-muted hover:bg-background transition-colors cursor-pointer"
        >
          Odustani
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onConfirm}
          className="px-4 py-1.5 rounded-xl bg-danger text-white text-sm font-bold shadow-[0_3px_0_rgba(239,68,68,0.4)] cursor-pointer"
        >
          Obriši
        </motion.button>
      </div>
    </motion.div>
  )
}

function TripCard({ trip, index, onDelete }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const days = calculateTripDays(trip.startDate, trip.endDate)
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const budgetSpent = trip.budget?.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0
  const budgetTotal = trip.budget?.total || 0
  const budgetPct = budgetTotal > 0 ? Math.min(100, (budgetSpent / budgetTotal) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
      className="relative"
    >
      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirm
            onConfirm={() => { onDelete(trip.id); setConfirmDelete(false) }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={() => navigate(`/trips/${trip.id}`)}
        className="bg-surface rounded-2xl border-2 border-border overflow-hidden cursor-pointer shadow-[0_4px_0_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_0_rgba(0,0,0,0.07),0_16px_32px_rgba(0,0,0,0.1)] transition-shadow"
      >
        {/* Gradient header */}
        <div
          className="h-16 relative flex items-end px-4 pb-2"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          <div className="flex items-end justify-between w-full">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              <span className="text-white/90 text-xs font-semibold truncate max-w-[160px]">
                {trip.startCity?.name?.split(',')[0]} → {trip.endCity?.name?.split(',')[0]}
              </span>
            </div>
            <TripStatusBadge startDate={trip.startDate} endDate={trip.endDate} />
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/20 hover:bg-black/35 transition-colors cursor-pointer"
            aria-label="Obriši putovanje"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
            </svg>
          </button>
        </div>

        {/* Card body */}
        <div className="p-4">
          <h3 className="font-bold text-text text-base mb-3 leading-tight">
            {trip.name}
          </h3>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-background rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-text leading-none">{days || '—'}</p>
              <p className="text-[10px] text-muted mt-0.5">dana</p>
            </div>
            <div className="bg-background rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-text leading-none">{trip.stops?.length || 0}</p>
              <p className="text-[10px] text-muted mt-0.5">{t('stops').toLowerCase()}</p>
            </div>
            <div className="bg-background rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-text leading-none">{trip.adults + trip.children}</p>
              <p className="text-[10px] text-muted mt-0.5">putnika</p>
            </div>
          </div>

          {/* Date + distance */}
          <div className="flex items-center justify-between text-xs text-muted">
            {trip.startDate ? (
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}
                {trip.endDate && ` — ${new Date(trip.endDate + 'T00:00:00').toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}`}
              </span>
            ) : (
              <span className="italic">Bez datuma</span>
            )}
            {trip.route?.totalDistance > 0 && (
              <span className="font-semibold">{formatDistance(trip.route.totalDistance)}</span>
            )}
          </div>

          {/* Budget bar — only if budget set */}
          {budgetTotal > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                <span>Budžet</span>
                <span className="font-bold text-text">{budgetSpent.toLocaleString()} / {budgetTotal.toLocaleString()} {trip.budget?.currency || 'RSD'}</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetPct}%` }}
                  transition={{ delay: index * 0.07 + 0.3, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: budgetPct > 90
                      ? '#EF4444'
                      : budgetPct > 70
                      ? '#F97316'
                      : '#22C55E'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function MyTrips() {
  const trips = useTripStore(state => state.trips)
  const deleteTrip = useTripStore(state => state.deleteTrip)
  const user = useAuthStore(s => s.user)
  const signOut = useAuthStore(s => s.signOut)
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="bg-surface border-b-2 border-border sticky top-0 z-50 shadow-[0_2px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto px-4 py-4 grid grid-cols-3 items-center">
          {/* Left — back button */}
          <div className="flex items-center">
            <Link
              to="/"
              className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-border bg-background hover:border-primary/40 transition-colors cursor-pointer"
              aria-label="Nazad"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </Link>
          </div>

          {/* Center — title */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-text leading-none">{t('myTrips')}</h1>
            {trips.length > 0 && (
              <p className="text-xs text-muted mt-0.5">{trips.length} {trips.length === 1 ? 'putovanje' : 'putovanja'}</p>
            )}
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2 justify-end">
            <LanguageToggle />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Link
                to="/trips/new"
                className="btn-clay inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span className="hidden sm:inline">{t('newTrip')}</span>
                <span className="sm:hidden">+</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {trips.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 mx-auto mb-6 bg-primary/10 rounded-3xl flex items-center justify-center shadow-[0_4px_0_rgba(249,115,22,0.2)]"
              >
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-text mb-2">{t('noTripsYet')}</h2>
              <p className="text-muted mb-8 max-w-xs mx-auto">{t('noTripsDesc')}</p>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link
                  to="/trips/new"
                  className="btn-clay inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-bold rounded-2xl text-base cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  {t('planFirst')}
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            /* ── Trip cards grid ── */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {trips.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onDelete={(tripId) => deleteTrip(tripId, user?.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  )
}
