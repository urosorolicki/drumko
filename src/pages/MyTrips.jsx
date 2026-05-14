import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import useAuthStore from '../store/useAuthStore'
import { formatDistance } from '../utils/geoUtils'
import { calculateTripDays } from '../utils/budgetUtils'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'
import TripCardSkeleton from '../components/UI/TripCardSkeleton'

const CARD_GRADIENTS = [
  { from: '#F97316', via: '#FB923C', to: '#FDBA74' },
  { from: '#0EA5E9', via: '#38BDF8', to: '#7DD3FC' },
  { from: '#22C55E', via: '#4ADE80', to: '#86EFAC' },
  { from: '#A855F7', via: '#C084FC', to: '#E9D5FF' },
  { from: '#F59E0B', via: '#FBBF24', to: '#FDE68A' },
  { from: '#EC4899', via: '#F472B6', to: '#FBCFE8' },
]

const SORT_OPTIONS = [
  { key: 'newest', label: 'Najnovije' },
  { key: 'oldest', label: 'Najstarije' },
  { key: 'az',     label: 'A → Z' },
  { key: 'upcoming', label: 'Predstojeće' },
]

function sortTrips(trips, sort) {
  const arr = [...trips]
  if (sort === 'newest') return arr // already newest-first from store
  if (sort === 'oldest') return arr.reverse()
  if (sort === 'az') return arr.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'upcoming') {
    return arr.sort((a, b) => {
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return new Date(a.startDate) - new Date(b.startDate)
    })
  }
  return arr
}

function filterTrips(trips, search) {
  if (!search.trim()) return trips
  const q = search.toLowerCase()
  return trips.filter(t =>
    t.name?.toLowerCase().includes(q) ||
    t.startCity?.name?.toLowerCase().includes(q) ||
    t.endCity?.name?.toLowerCase().includes(q)
  )
}

/* ── Undo toast ───────────────────────────────────────────────── */
function UndoToast({ tripName, onUndo, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-text text-white px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] max-w-xs w-[calc(100%-2rem)]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 opacity-70">
        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
      </svg>
      <span className="flex-1 text-sm font-medium truncate">
        <span className="opacity-70">Obrisano · </span>
        <span className="font-bold">{tripName}</span>
      </span>
      <button
        onClick={onUndo}
        className="shrink-0 text-sm font-bold text-primary-light hover:text-white transition-colors cursor-pointer"
        style={{ color: '#FB923C' }}
      >
        Vrati
      </button>
    </motion.div>
  )
}

/* ── Status badge ─────────────────────────────────────────────── */
function TripStatusBadge({ startDate, endDate }) {
  if (!startDate) return null
  const now = new Date()
  const start = new Date(startDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T23:59:59') : null

  let label, cls
  if (now < start) {
    const daysUntil = Math.ceil((start - now) / 86400000)
    label = daysUntil === 1 ? 'Sutra!' : `Za ${daysUntil} dana`
    cls = 'bg-white/25 text-white border border-white/40'
  } else if (end && now > end) {
    label = 'Završeno'
    cls = 'bg-black/20 text-white/80 border border-white/20'
  } else {
    label = '● Aktivno'
    cls = 'bg-green-400/25 text-white border border-green-300/40'
  }

  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${cls}`}>
      {label}
    </span>
  )
}

/* ── Delete confirm overlay ───────────────────────────────────── */
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-label="Potvrda brisanja putovanja"
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute inset-0 bg-white/96 backdrop-blur-sm rounded-[20px] z-10 flex flex-col items-center justify-center gap-3 p-4"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-10 h-10 bg-danger/10 rounded-2xl flex items-center justify-center mb-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
        </svg>
      </div>
      <p className="text-sm font-bold text-text text-center">Obrisati ovo putovanje?</p>
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.93 }} onClick={onCancel}
          className="px-4 py-2 rounded-xl border-2 border-border text-sm font-bold text-muted hover:bg-background transition-colors cursor-pointer">
          Odustani
        </motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-danger text-white text-sm font-bold shadow-[0_3px_0_rgba(239,68,68,0.4)] cursor-pointer">
          Obriši
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ── Trip card ────────────────────────────────────────────────── */
function TripCard({ trip, index, onDelete, onDuplicate }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dupeFlash, setDupeFlash] = useState(false)

  const days = calculateTripDays(trip.startDate, trip.endDate)
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const budgetSpent = trip.budget?.expenses?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0
  const budgetTotal = trip.budget?.total || 0
  const budgetPct = budgetTotal > 0 ? Math.min(100, (budgetSpent / budgetTotal) * 100) : 0

  function handleDuplicate(e) {
    e.stopPropagation()
    setDupeFlash(true)
    onDuplicate(trip)
    setTimeout(() => setDupeFlash(false), 600)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 26 }}
      className="relative"
    >
      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirm
            onConfirm={() => { onDelete(trip); setConfirmDelete(false) }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        onClick={() => navigate(`/trips/${trip.id}`)}
        className="trip-card cursor-pointer"
      >
        {/* Aurora gradient header */}
        <div
          className="h-[76px] relative flex flex-col justify-between px-4 pt-2.5 pb-2.5 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.via} 55%, ${gradient.to} 100%)` }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)' }} />

          {/* Top row: route + actions */}
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" className="shrink-0">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              <span className="text-white/95 text-xs font-semibold truncate drop-shadow-sm">
                {trip.startCity?.name?.split(',')[0]} → {trip.endCity?.name?.split(',')[0]}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Duplicate */}
              <motion.button
                animate={dupeFlash ? { scale: [1, 1.3, 1] } : {}}
                onClick={handleDuplicate}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/15 hover:bg-black/30 transition-colors cursor-pointer backdrop-blur-sm"
                aria-label="Dupliraj putovanje"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </motion.button>
              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/15 hover:bg-black/30 transition-colors cursor-pointer backdrop-blur-sm"
                aria-label="Obriši putovanje"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="relative">
            <TripStatusBadge startDate={trip.startDate} endDate={trip.endDate} />
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <h3 className="font-bold text-text text-[15px] mb-3 leading-snug">{trip.name}</h3>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { value: days || '—', label: 'dana' },
              { value: trip.stops?.length || 0, label: t('stops').toLowerCase() },
              { value: (trip.adults || 1) + (trip.children || 0), label: 'putnika' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-background rounded-xl p-2.5 text-center border border-border/50">
                <p className="text-lg font-bold text-text leading-none">{value}</p>
                <p className="text-[10px] text-muted mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted flex-wrap">
            {trip.startDate ? (
              <span className="flex items-center gap-1.5 shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}
                {trip.endDate && ` — ${new Date(trip.endDate + 'T00:00:00').toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}`}
              </span>
            ) : (
              <span className="italic text-muted/60">Bez datuma</span>
            )}
            {trip.route?.totalDistance > 0 && (
              <span className="font-semibold text-text/70 shrink-0 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/>
                </svg>
                {formatDistance(trip.route.totalDistance)}
              </span>
            )}
          </div>

          {budgetTotal > 0 && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-[10px] text-muted mb-1.5 gap-1">
                <span className="shrink-0 font-medium">Budžet</span>
                <span className="font-bold text-text/80 truncate">
                  {budgetSpent.toLocaleString()} / {budgetTotal.toLocaleString()} {trip.budget?.currency || 'RSD'}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetPct}%` }}
                  transition={{ delay: index * 0.06 + 0.35, duration: 0.65, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: budgetPct > 90 ? '#EF4444'
                      : budgetPct > 70 ? '#F97316'
                      : `linear-gradient(90deg, ${gradient.from}, ${gradient.via})`,
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

/* ── Delete account modal ─────────────────────────────────────── */
function DeleteAccountModal({ onClose }) {
  const deleteAccount = useAuthStore(s => s.deleteAccount)
  const clearTrips = useTripStore(s => s.clearTrips)
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await deleteAccount()
      clearTrips()
      navigate('/')
    } catch {
      setError('Brisanje nije uspelo. Pokušaj ponovo ili kontaktiraj podršku.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
          </svg>
        </div>
        <h2 id="delete-account-title" className="text-lg font-bold text-text text-center mb-1">Obriši nalog</h2>
        <p className="text-sm text-muted text-center mb-5">
          Ovo će trajno obrisati <strong className="text-text">sva tvoja putovanja</strong> i nalog.
          Ova radnja se <strong className="text-danger">ne može poništiti</strong>.
        </p>
        <div className="mb-4">
          <label htmlFor="delete-confirm" className="block text-xs font-semibold text-muted mb-1.5">
            Upiši <span className="text-danger font-bold">OBRIŠI</span> za potvrdu
          </label>
          <input
            id="delete-confirm" type="text"
            value={confirm} onChange={e => setConfirm(e.target.value.trim())}
            placeholder="OBRIŠI"
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text focus:outline-none focus:border-danger/50 transition-colors"
          />
        </div>
        {error && <p className="text-xs text-danger font-semibold mb-3 text-center">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-bold text-muted hover:bg-background transition-colors cursor-pointer">
            Odustani
          </button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleDelete}
            disabled={confirm !== 'OBRIŠI' || loading}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-bold shadow-[0_3px_0_rgba(239,68,68,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            Obriši nalog
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
export default function MyTrips() {
  const trips = useTripStore(s => s.trips)
  const tripsLoading = useTripStore(s => s.tripsLoading)
  const deleteTrip = useTripStore(s => s.deleteTrip)
  const duplicateTrip = useTripStore(s => s.duplicateTrip)
  const user = useAuthStore(s => s.user)
  const signOut = useAuthStore(s => s.signOut)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  // Undo delete state
  const [undoPending, setUndoPending] = useState(null) // { trip }
  const undoTimerRef = useRef(null)

  function commitDelete(trip) {
    deleteTrip(trip.id, user?.id)
    setUndoPending(null)
  }

  function handleDeleteTrip(trip) {
    // If there's already a pending undo, commit it first
    if (undoPending) {
      clearTimeout(undoTimerRef.current)
      commitDelete(undoPending.trip)
    }
    setUndoPending({ trip })
    undoTimerRef.current = setTimeout(() => {
      commitDelete(trip)
    }, 5000)
  }

  function handleUndo() {
    clearTimeout(undoTimerRef.current)
    setUndoPending(null)
  }

  useEffect(() => () => clearTimeout(undoTimerRef.current), [])

  function handleDuplicate(trip) {
    duplicateTrip(trip, user?.id)
  }

  // Filter out the pending-delete trip from display
  const visibleTrips = trips.filter(t => t.id !== undoPending?.trip?.id)
  const filtered = sortTrips(filterTrips(visibleTrips, search), sort)
  const showSearchBar = visibleTrips.length > 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* ── Glass header ── */}
      <header className="header-glass sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 grid grid-cols-3 items-center">
          <div className="flex items-center">
            <Link to="/"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-surface/80 hover:border-secondary/40 hover:bg-secondary/5 transition-all cursor-pointer"
              aria-label="Nazad na početnu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-text leading-none">{t('myTrips')}</h1>
            {visibleTrips.length > 0 && (
              <p className="text-xs text-muted mt-0.5 font-medium">
                {visibleTrips.length} {visibleTrips.length === 1 ? 'putovanje' : 'putovanja'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <div className="hidden sm:block"><LanguageToggle /></div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Link to="/trips/new"
                className="btn-clay inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm cursor-pointer">
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

      {/* ── Guest banner ── */}
      {!user && visibleTrips.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text">Putovanja su sačuvana lokalno</p>
              <p className="text-[11px] text-muted leading-snug">
                Registruj se da ih sačuvaš trajno i pristupiš sa svih uređaja
                {visibleTrips.length < 3 && ` · još ${3 - visibleTrips.length} besplatno`}
              </p>
            </div>
            <Link to="/auth" className="shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl btn-clay">
              Prijavi se
            </Link>
          </motion.div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Search + Sort bar (only when 4+ trips) ── */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              key="searchbar"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 space-y-3"
            >
              {/* Search input */}
              <div className="relative">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pretraži putovanja..."
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors cursor-pointer"
                    aria-label="Obriši pretragu">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort pills */}
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      sort === opt.key
                        ? 'bg-primary text-white shadow-[0_2px_0_rgba(249,115,22,0.35)]'
                        : 'bg-surface border border-border text-muted hover:border-primary/30 hover:text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {tripsLoading && (
          <div className="grid gap-4 sm:grid-cols-2" aria-label="Učitavanje putovanja" aria-busy="true">
            {[0, 1, 2, 3].map(i => <TripCardSkeleton key={i} />)}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!tripsLoading && visibleTrips.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 mx-auto mb-6 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(14,165,233,0.10))',
                  boxShadow: '0 4px 0 rgba(249,115,22,0.15), 0 8px 24px rgba(249,115,22,0.1)',
                  border: '2px solid rgba(249,115,22,0.12)',
                }}
              >
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-text mb-2">{t('noTripsYet')}</h2>
              <p className="text-muted mb-8 max-w-xs mx-auto leading-relaxed">{t('noTripsDesc')}</p>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link to="/trips/new"
                  className="btn-clay inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-bold rounded-2xl text-base cursor-pointer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  {t('planFirst')}
                </Link>
              </motion.div>
            </motion.div>
          ) : !tripsLoading && filtered.length === 0 ? (
            /* ── No search results ── */
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <p className="text-base font-bold text-text mb-1">Nema rezultata</p>
              <p className="text-sm text-muted">Promenite pretragu ili filter</p>
              <button onClick={() => { setSearch(''); setSort('newest') }}
                className="mt-4 text-sm font-bold text-primary hover:underline cursor-pointer">
                Resetuj filter
              </button>
            </motion.div>
          ) : (
            /* ── Trip cards grid ── */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {filtered.map((trip, i) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onDelete={handleDeleteTrip}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Account section ── */}
        {user && (
          <div className="pb-8 mt-6">
            <div className="border-t border-border pt-6">
              <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">Prijavljeni kao</p>
                    <p className="text-sm font-bold text-text truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => signOut()}
                    className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-muted hover:bg-background transition-colors cursor-pointer">
                    Odjavi se
                  </button>
                  <button onClick={() => setShowDeleteAccount(true)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-danger/25 text-sm font-semibold text-danger hover:bg-danger/5 transition-colors cursor-pointer">
                    Obriši nalog
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Undo toast ── */}
      <AnimatePresence>
        {undoPending && (
          <UndoToast
            key="undo"
            tripName={undoPending.trip.name}
            onUndo={handleUndo}
            onDismiss={() => {
              clearTimeout(undoTimerRef.current)
              commitDelete(undoPending.trip)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteAccount && (
          <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
