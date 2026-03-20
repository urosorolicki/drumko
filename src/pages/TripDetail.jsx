import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import useAuthStore from '../store/useAuthStore'
import TripMap from '../components/Map/MapContainer'
import { formatDistance, formatDuration } from '../utils/geoUtils'
import { calculateTripDays, formatCurrency, getBudgetSummary } from '../utils/budgetUtils'
import useRouteStats from '../hooks/useRouteStats'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'
import useNominatim from '../hooks/useNominatim'
import useOSRM from '../hooks/useOSRM'

const TABS = ['overview', 'map', 'stops', 'packing', 'budget']

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const { t } = useTranslation()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const updateTrip = useTripStore(s => s.updateTrip)
  const deleteTrip = useTripStore(s => s.deleteTrip)
  const setShared = useTripStore(s => s.setShared)
  const addStop = useTripStore(s => s.addStop)
  const removeStop = useTripStore(s => s.removeStop)
  const user = useAuthStore(s => s.user)
  const [showShareModal, setShowShareModal] = useState(false)
  const togglePackingItem = useTripStore(s => s.togglePackingItem)
  const addExpense = useTripStore(s => s.addExpense)
  const removeExpense = useTripStore(s => s.removeExpense)
  const updateStop = useTripStore(s => s.updateStop)

  // Hook expects (route, [startCity, ...stops, endCity])
  const routeWaypoints = trip
    ? [trip.startCity, ...(trip.stops || []), trip.endCity].filter(Boolean)
    : []
  const routeStats = useRouteStats(trip?.route, routeWaypoints)

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-text mb-2">Trip not found</p>
          <Link to="/trips" className="text-primary hover:underline">Back to My Trips</Link>
        </div>
      </div>
    )
  }

  const days = calculateTripDays(trip.startDate, trip.endDate)
  const packedCount = trip.packingList.filter(i => i.checked).length
  const packingPct = trip.packingList.length > 0
    ? Math.round((packedCount / trip.packingList.length) * 100)
    : 0
  const budgetSummary = getBudgetSummary(trip.budget)

  function handleDeleteTrip() {
    if (window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
      deleteTrip(id, user?.id)
      navigate('/trips')
    }
  }

  function handleShareTrip() {
    setShowShareModal(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/trips" className="text-muted hover:text-text transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-text leading-tight">{trip.name}</h1>
                <p className="text-xs text-muted">
                  {trip.startCity?.name?.split(',')[0]} → {trip.endCity?.name?.split(',')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                to={`/trips/${id}/edit`}
                className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                {t('editTrip')}
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TABS.map(key => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-1.5 rounded-lg whitespace-nowrap text-sm font-semibold transition-colors ${
                  activeTab === key
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-text hover:bg-background'
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <TabOverview
              key="overview"
              trip={trip}
              days={days}
              routeStats={routeStats}
              packedCount={packedCount}
              packingPct={packingPct}
              budgetSummary={budgetSummary}
              onDelete={handleDeleteTrip}
              onShare={handleShareTrip}
            />
          )}
          {activeTab === 'map' && (
            <TabMap
              key="map"
              trip={trip}
              routeStats={routeStats}
              updateStop={updateStop}
            />
          )}
          {activeTab === 'stops' && (
            <TabStops
              key="stops"
              trip={trip}
              routeStats={routeStats}
              updateStop={updateStop}
              updateTrip={(updates) => updateTrip(id, updates, user?.id)}
              addStop={(stop) => addStop(id, stop)}
              removeStop={(stopId) => removeStop(id, stopId)}
              userId={user?.id}
            />
          )}
          {activeTab === 'packing' && (
            <TabPacking
              key="packing"
              trip={trip}
              toggleItem={togglePackingItem}
              updateTrip={(tripId, updates) => updateTrip(tripId, updates, user?.id)}
            />
          )}
          {activeTab === 'budget' && (
            <TabBudget
              key="budget"
              trip={trip}
              addExpense={addExpense}
              removeExpense={removeExpense}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Share modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            trip={trip}
            onClose={() => setShowShareModal(false)}
            onToggleShared={(shared) => setShared(id, shared, user?.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================================
   SHARE MODAL
   ============================================================ */
function ShareModal({ trip, onClose, onToggleShared }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/shared/${trip.id}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.12)] p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text mb-1">Podeli putovanje</h2>
        <p className="text-sm text-muted mb-5">Svako sa linkom može da vidi ovo putovanje.</p>

        {/* Toggle */}
        <div className="flex items-center justify-between bg-surface rounded-2xl p-4 mb-4 border border-border">
          <div>
            <p className="text-sm font-semibold text-text">{trip.isShared ? 'Javno putovanje' : 'Privatno putovanje'}</p>
            <p className="text-xs text-muted">{trip.isShared ? 'Link je aktivan' : 'Samo ti možeš da vidiš'}</p>
          </div>
          <button
            onClick={() => onToggleShared(!trip.isShared)}
            className={`w-12 h-6 rounded-full transition-colors relative ${trip.isShared ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${trip.isShared ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Link */}
        {trip.isShared && (
          <div className="flex gap-2 mb-4">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2.5 text-xs border border-border rounded-xl bg-background text-muted font-mono truncate"
            />
            <button
              onClick={copyLink}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${copied ? 'bg-success text-white' : 'bg-primary text-white'}`}
            >
              {copied ? 'Kopirano!' : 'Kopiraj'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-surface border border-border rounded-xl text-sm font-semibold text-text"
        >
          Zatvori
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
   TAB: Overview
   ============================================================ */
function TabOverview({ trip, days, routeStats, packedCount, packingPct, budgetSummary, onDelete, onShare }) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'days', value: days || '—', icon: '📅' },
          { key: 'distance', value: routeStats.totalDistance || '—', icon: '🛣️' },
          { key: 'driveTime', value: routeStats.totalDuration || '—', icon: '⏱️' },
          { key: 'travelers', value: trip.adults + trip.children, icon: '👨‍👩‍👧' },
        ].map(stat => (
          <div key={stat.key} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-text">{stat.value}</div>
            <div className="text-xs font-medium text-text/70">{t(stat.key)}</div>
          </div>
        ))}
      </div>

      {/* Trip info */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="font-semibold text-text mb-3">{t('tripInfo')}</h2>
        <div className="space-y-2 text-sm">
          {trip.startDate && (
            <div className="flex justify-between">
              <span className="text-muted">{t('dates')}</span>
              <span className="text-text font-medium">
                {new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">{t('adults')} / {t('children')}</span>
            <span className="text-text font-medium">{trip.adults} / {trip.children}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('stops')}</span>
            <span className="text-text font-medium">{trip.stops.length}</span>
          </div>
        </div>
      </div>

      {/* Packing progress */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-text">{t('packing')}</h2>
          <span className="text-sm font-bold text-primary">{packingPct}%</span>
        </div>
        <div className="h-3 bg-border rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${packingPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted">{packedCount} of {trip.packingList.length} items packed</p>
      </div>

      {/* Budget summary */}
      {trip.budget.total > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-semibold text-text mb-3">{t('budget')}</h2>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-text">
                {formatCurrency(budgetSummary.totalSpent, trip.budget.currency)}
              </p>
              <p className="text-xs text-muted">
                {t('spent').toLowerCase()} of {formatCurrency(budgetSummary.totalBudget, trip.budget.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-success">
                {formatCurrency(budgetSummary.remaining, trip.budget.currency)}
              </p>
              <p className="text-xs text-muted">{t('remaining').toLowerCase()}</p>
            </div>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: budgetSummary.totalBudget > 0
                  ? `${Math.min(100, (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100)}%`
                  : '0%'
              }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onShare}
          className="flex-1 py-3 bg-surface border border-border rounded-xl text-sm font-semibold text-text hover:bg-background transition-colors"
        >
          {t('shareTrip')}
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-3 bg-danger/10 rounded-xl text-sm font-semibold text-danger hover:bg-danger/20 transition-colors"
        >
          {t('deleteTrip')}
        </button>
      </div>
    </motion.div>
  )
}

/* ============================================================
   TAB: Map
   ============================================================ */
function TabMap({ trip, routeStats, updateStop }) {
  function handleNoteChange(stopId, note) {
    updateStop(trip.id, stopId, { note })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <TripMap
        startCity={trip.startCity}
        endCity={trip.endCity}
        stops={trip.stops}
        route={trip.route}
        onNoteChange={handleNoteChange}
        showSearch={false}
        showPOIs={false}
        showStats={true}
        height="600px"
        className="rounded-2xl overflow-hidden border border-border shadow"
      />
    </motion.div>
  )
}

/* ============================================================
   TAB: Stops
   ============================================================ */
function TabStops({ trip, routeStats, updateStop, updateTrip, addStop, removeStop }) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const inputRef = useRef(null)
  const { search, results, loading: searchLoading, clearResults } = useNominatim()
  const { fetchRoute } = useOSRM()

  const allPoints = [
    { ...trip.startCity, id: 'start', isStart: true },
    ...trip.stops,
    { ...trip.endCity, id: 'end', isEnd: true },
  ].filter(p => p && p.lat)

  const { stopDistances, stopDurations } = routeStats

  useEffect(() => {
    const t = setTimeout(() => { if (query.trim().length > 1) search(query) }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function recalcRoute(newStops) {
    const waypoints = [trip.startCity, ...newStops, trip.endCity].filter(p => p?.lat)
    if (waypoints.length < 2) return
    setRecalculating(true)
    const result = await fetchRoute(waypoints)
    if (result) updateTrip({ route: result })
    setRecalculating(false)
  }

  async function handleAddStop(place) {
    const stop = { lat: place.lat, lng: place.lng || place.lon, name: place.display_name || place.name, category: 'stop' }
    addStop(stop)
    const newStops = [...trip.stops, stop]
    setQuery('')
    clearResults()
    setShowResults(false)
    await recalcRoute(newStops)
  }

  async function handleRemoveStop(stopId) {
    removeStop(stopId)
    const newStops = trip.stops.filter(s => s.id !== stopId)
    await recalcRoute(newStops)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-1"
    >
      {allPoints.map((stop, i) => {
        const isStart = stop.isStart
        const isEnd = stop.isEnd
        const legDist = stopDistances[i - 1]
        const legDur = stopDurations[i - 1]

        return (
          <div key={stop.id || i} className="relative">
            {i > 0 && (
              <div className="flex items-center gap-2 py-2 pl-12 text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22V2M4.93 7 12 2l7.07 5M4.93 17 12 22l7.07-5"/>
                  </svg>
                  <span className="font-medium">{legDist || '—'}</span>
                  <span>·</span>
                  <span>{legDur || '—'}</span>
                </div>
              </div>
            )}

            <div className={`bg-surface border rounded-2xl p-4 relative ${
              isStart ? 'border-success/40 bg-success/5' :
              isEnd ? 'border-secondary/40 bg-secondary/5' :
              'border-border'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isStart ? 'bg-success text-white' :
                  isEnd ? 'bg-secondary text-white' :
                  'bg-primary text-white'
                }`}>
                  {isStart ? '🏠' : isEnd ? '🏁' : i}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text">{stop.name?.split(',')[0]}</h3>
                    {isStart && <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">Start</span>}
                    {isEnd && <span className="text-xs bg-secondary/20 text-secondary-dark px-2 py-0.5 rounded-full font-medium">Destination</span>}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {stop.name?.split(',').slice(1, 3).join(',').trim()}
                  </p>
                  {!isStart && !isEnd && (
                    <textarea
                      value={stop.note || ''}
                      onChange={(e) => updateStop(trip.id, stop.id, { note: e.target.value })}
                      placeholder="Beleška za ovu stanicu..."
                      rows={2}
                      className="mt-2 w-full text-sm p-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-text placeholder:text-muted"
                    />
                  )}
                </div>

                {/* Delete button for intermediate stops */}
                {!isStart && !isEnd && (
                  <button
                    onClick={() => handleRemoveStop(stop.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger/20 transition-colors shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Add stop inline */}
      <div className="pt-2">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
                onFocus={() => setShowResults(true)}
                placeholder="Dodaj stanicu..."
                className="w-full px-4 py-3 border-2 border-dashed border-border rounded-2xl bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
              {searchLoading && (
                <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {showResults && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-2xl shadow-lg z-20 overflow-hidden"
              >
                {results.slice(0, 5).map((r, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); handleAddStop(r) }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-surface transition-colors border-b border-border last:border-0"
                  >
                    <span className="font-medium text-text">{r.display_name?.split(',')[0]}</span>
                    <span className="text-muted text-xs ml-1">{r.display_name?.split(',').slice(1, 3).join(',')}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {recalculating && (
          <p className="text-xs text-muted mt-2 text-center">Preračunavam rutu...</p>
        )}
      </div>

      {/* Navigation */}
      {trip.startCity?.lat && trip.endCity?.lat && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted font-semibold mb-2 uppercase tracking-wide">Navigacija</p>
          <div className="flex gap-2">
            <a
              href={buildNavUrl('google', trip)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#4285F4] text-white text-sm font-bold rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Google Maps
            </a>
            <a
              href={buildNavUrl('waze', trip)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#33CCFF] text-white text-sm font-bold rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              Waze
            </a>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function buildNavUrl(app, trip) {
  if (app === 'google') {
    const origin = `${trip.startCity.lat},${trip.startCity.lng}`
    const destination = `${trip.endCity.lat},${trip.endCity.lng}`
    const waypoints = (trip.stops || []).map(s => `${s.lat},${s.lng}`).join('|')
    const url = new URL('https://www.google.com/maps/dir/')
    url.searchParams.set('api', '1')
    url.searchParams.set('origin', origin)
    url.searchParams.set('destination', destination)
    if (waypoints) url.searchParams.set('waypoints', waypoints)
    url.searchParams.set('travelmode', 'driving')
    return url.toString()
  }
  // Waze: navigate to destination
  const url = new URL('https://waze.com/ul')
  url.searchParams.set('ll', `${trip.endCity.lat},${trip.endCity.lng}`)
  url.searchParams.set('navigate', 'yes')
  return url.toString()
}

/* ============================================================
   TAB: Packing  —  fun & relaxed redesign
   ============================================================ */

// Emoji and gradient per category name
const CATEGORY_STYLE = {
  Dokumenti:              { emoji: '📄', gradient: 'from-blue-50 to-blue-100',     ring: 'ring-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  Deca:                   { emoji: '🧸', gradient: 'from-pink-50 to-pink-100',     ring: 'ring-pink-200',   badge: 'bg-pink-100 text-pink-700' },
  Garderoba:              { emoji: '👕', gradient: 'from-purple-50 to-purple-100', ring: 'ring-purple-200', badge: 'bg-purple-100 text-purple-700' },
  Auto:                   { emoji: '🔧', gradient: 'from-gray-50 to-gray-100',     ring: 'ring-gray-200',   badge: 'bg-gray-100 text-gray-700' },
  'Hrana i piće':         { emoji: '🥪', gradient: 'from-amber-50 to-amber-100',   ring: 'ring-amber-200',  badge: 'bg-amber-100 text-amber-700' },
  Zabava:                 { emoji: '🎮', gradient: 'from-green-50 to-green-100',   ring: 'ring-green-200',  badge: 'bg-green-100 text-green-700' },
  'Toaletne potrepštine': { emoji: '🧴', gradient: 'from-teal-50 to-teal-100',     ring: 'ring-teal-200',   badge: 'bg-teal-100 text-teal-700' },
  Ostalo:                 { emoji: '📦', gradient: 'from-orange-50 to-orange-100', ring: 'ring-orange-200', badge: 'bg-orange-100 text-orange-700' },
}

function getCatStyle(cat) {
  return CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.Ostalo
}

function TabPacking({ trip, toggleItem, updateTrip }) {
  const [filter, setFilter] = useState('all')
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('Ostalo')
  const [expandedCats, setExpandedCats] = useState({})

  const categories = [...new Set(trip.packingList.map(i => i.category))]
  const totalItems = trip.packingList.length
  const packedItems = trip.packingList.filter(i => i.checked).length
  const pct = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0
  const allDone = totalItems > 0 && packedItems === totalItems

  function addItem() {
    if (!newItem.trim()) return
    const item = { id: crypto.randomUUID(), category: newCategory, name: newItem.trim(), checked: false }
    updateTrip(trip.id, { packingList: [...trip.packingList, item] })
    setNewItem('')
  }

  function removeItem(itemId) {
    updateTrip(trip.id, { packingList: trip.packingList.filter(i => i.id !== itemId) })
  }

  function resetAll() {
    updateTrip(trip.id, { packingList: trip.packingList.map(i => ({ ...i, checked: false })) })
  }

  function toggleCat(cat) {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const filteredByFilter = trip.packingList.filter(i => {
    if (filter === 'packed') return i.checked
    if (filter === 'unpacked') return !i.checked
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* All-done celebration */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-5 p-5 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, #22C55E20, #38BDF820)' }}
          >
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-text text-lg">All packed!</p>
            <p className="text-sm text-muted">You're ready to hit the road!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fun progress header */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-3xl font-extrabold text-text">{pct}<span className="text-xl text-muted">%</span></p>
            <p className="text-sm text-muted">{packedItems} of {totalItems} packed</p>
          </div>
          <div className="text-right">
            <p className="text-4xl">{pct < 30 ? '🧳' : pct < 60 ? '🚗' : pct < 100 ? '🏃' : '🏖️'}</p>
          </div>
        </div>

        {/* Chunky progress bar */}
        <div className="h-4 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: allDone ? '#22C55E' : 'linear-gradient(90deg, #F97316, #38BDF8)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Filter pills + reset */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: '🗂 All' },
              { key: 'unpacked', label: '⬜ Todo' },
              { key: 'packed', label: '✅ Done' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filter === f.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={resetAll} className="text-xs text-muted hover:text-danger transition-colors">
            Reset all
          </button>
        </div>
      </div>

      {/* Add item row */}
      <div className="flex gap-2 mb-5">
        <select
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-xl bg-surface text-text text-sm"
        >
          {[...categories, 'Ostalo'].filter((v, i, a) => a.indexOf(v) === i).map(c => (
            <option key={c} value={c}>{getCatStyle(c).emoji} {c}</option>
          ))}
        </select>
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add something to pack..."
          className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={addItem}
          className="px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors"
        >
          +
        </motion.button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map(cat => {
          const catItems = filteredByFilter.filter(i => i.category === cat)
          if (!catItems.length) return null
          const catStyle = getCatStyle(cat)
          const catPacked = catItems.filter(i => i.checked).length
          const allCatDone = catPacked === catItems.length
          const isExpanded = expandedCats[cat] !== false // default open

          return (
            <div key={cat} className="bg-surface border border-border rounded-2xl overflow-hidden">
              {/* Category header — click to collapse */}
              <button
                onClick={() => toggleCat(cat)}
                className={`w-full flex items-center gap-3 p-4 bg-gradient-to-r ${catStyle.gradient} hover:opacity-90 transition-opacity`}
              >
                <span className="text-2xl">{catStyle.emoji}</span>
                <div className="flex-1 text-left">
                  <span className="font-bold text-text">{cat}</span>
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${catStyle.badge}`}>
                    {catPacked}/{catItems.length}
                  </span>
                </div>
                {allCatDone && <span className="text-lg">✅</span>}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-border">
                      {catItems.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            item.checked ? 'bg-success/5' : 'hover:bg-background'
                          }`}
                        >
                          {/* Big tap-friendly checkbox */}
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => toggleItem(trip.id, item.id)}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              item.checked
                                ? 'bg-success border-success text-white'
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            {item.checked && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
                              >
                                <path d="M20 6L9 17l-5-5"/>
                              </motion.svg>
                            )}
                          </motion.button>

                          <span className={`flex-1 text-sm font-medium transition-all ${
                            item.checked ? 'line-through text-muted' : 'text-text'
                          }`}>
                            {item.name}
                          </span>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-border hover:text-danger transition-colors p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ============================================================
   Shared budget helpers (mirrors CreateTrip's CATEGORY_META)
   ============================================================ */
const CAT_META = {
  fuel:          { label: 'Fuel',          sr: 'Gorivo',       emoji: '⛽', color: '#78716C', defaultPct: 0.25 },
  accommodation: { label: 'Accommodation', sr: 'Smeštaj',      emoji: '🏨', color: '#3B82F6', defaultPct: 0.33 },
  food:          { label: 'Food & Drinks', sr: 'Hrana i piće', emoji: '🍽️', color: '#F59E0B', defaultPct: 0.25 },
  activities:    { label: 'Activities',    sr: 'Aktivnosti',   emoji: '🎯', color: '#8B5CF6', defaultPct: 0.12 },
  other:         { label: 'Other',         sr: 'Ostalo',       emoji: '📦', color: '#A8A29E', defaultPct: 0.05 },
}

function distributeTotal(total, currentCats) {
  const keys = Object.keys(currentCats)
  const sum = keys.reduce((s, k) => s + (currentCats[k] || 0), 0)
  const ratios = {}
  if (sum > 0) {
    keys.forEach(k => { ratios[k] = (currentCats[k] || 0) / sum })
  } else {
    keys.forEach(k => { ratios[k] = CAT_META[k]?.defaultPct ?? 0.1 })
  }
  const result = {}
  let allocated = 0
  keys.forEach((k, i) => {
    if (i < keys.length - 1) { result[k] = Math.round(total * ratios[k]); allocated += result[k] }
    else result[k] = Math.round(total - allocated)
  })
  return result
}

/* ============================================================
   TAB: Budget
   ============================================================ */
function TabBudget({ trip, addExpense, removeExpense }) {
  const updateBudget = useTripStore(s => s.updateBudget)
  const { t } = useTranslation()
  const [newExpense, setNewExpense] = useState({
    name: '', amount: '', category: 'food',
    date: new Date().toISOString().slice(0, 10),
  })

  const cur = trip.budget.currency || 'RSD'
  const totalBudget = trip.budget.total || 0
  const expenses = trip.budget.expenses || []
  const totalSpent = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const remaining = totalBudget - totalSpent
  const pctUsed = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

  // Per-person & per-day stats
  const travelers = (trip.adults || 1) + (trip.children || 0)
  const days = calculateTripDays(trip.startDate, trip.endDate)
  const perPerson = travelers > 0 && totalBudget > 0 ? totalBudget / travelers : 0
  const perDay = days > 0 && totalBudget > 0 ? totalBudget / days : 0

  // Days elapsed since trip start (for avg daily spend)
  const today = new Date()
  const startDate = trip.startDate ? new Date(trip.startDate + 'T00:00:00') : null
  const daysElapsed = startDate
    ? Math.min(Math.max(Math.ceil((today - startDate) / 86400000), 1), days || 1)
    : null
  const avgPerDay = daysElapsed && totalSpent > 0 ? totalSpent / daysElapsed : 0
  const projected = avgPerDay > 0 && days > 0 ? avgPerDay * days : 0

  // Spending by category (actual from expenses)
  const catSpent = {}
  expenses.forEach(e => {
    const k = e.category || 'other'
    catSpent[k] = (catSpent[k] || 0) + (parseFloat(e.amount) || 0)
  })

  const totalFromCats = Object.values(trip.budget.categories || {}).reduce((a, b) => a + b, 0)

  function handleTotalChange(rawValue) {
    const total = parseFloat(rawValue) || 0
    const newCats = distributeTotal(total, trip.budget.categories)
    updateBudget(trip.id, { total, categories: newCats })
  }

  function handleCategoryChange(key, rawValue) {
    const num = parseFloat(rawValue) || 0
    const newCats = { ...trip.budget.categories, [key]: num }
    const newTotal = Object.values(newCats).reduce((a, b) => a + b, 0)
    updateBudget(trip.id, { categories: newCats, total: newTotal })
  }

  function handleAddExpense() {
    if (!newExpense.name || !newExpense.amount) return
    addExpense(trip.id, {
      id: crypto.randomUUID(),
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
    })
    setNewExpense(prev => ({ ...prev, name: '', amount: '' }))
  }

  function catLabel(key) {
    const ck = key === 'fuel' ? 'catFuel' : key === 'accommodation' ? 'catAccomm' : key === 'food' ? 'catFood' : key === 'activities' ? 'catActivities' : 'catOther'
    return t(ck)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4 max-w-2xl mx-auto"
    >
      {/* ── Total budget input ── */}
      <div className="bg-surface border-2 border-primary/30 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-text">{t('totalBudget')}</p>
            <p className="text-xs text-muted">{t('budgetHint')}</p>
          </div>
          <span className="text-xs font-semibold text-muted bg-border px-2 py-1 rounded-lg">{cur}</span>
        </div>
        <input
          type="number"
          value={trip.budget.total || ''}
          onChange={e => handleTotalChange(e.target.value)}
          className="w-full px-4 py-3 text-2xl font-extrabold border-2 border-primary/40 rounded-xl bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="0"
        />
        {/* Overall progress bar */}
        {totalBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{Math.round(pctUsed)}% potrošeno</span>
              <span className={remaining >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                {remaining >= 0 ? 'Ostalo: ' : 'Prekoračeno: '}{formatCurrency(Math.abs(remaining), cur)}
              </span>
            </div>
            <div className="h-3 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: pctUsed > 90 ? '#EF4444' : pctUsed > 70 ? '#F97316' : '#22C55E' }}
                animate={{ width: `${pctUsed}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Summary stats ── */}
      {totalBudget > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[11px] font-medium text-muted mb-1">{t('spent')}</p>
            <p className="text-sm font-bold text-primary leading-tight">{formatCurrency(totalSpent, cur)}</p>
          </div>
          <div className={`border rounded-xl p-3 text-center ${remaining >= 0 ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
            <p className="text-[11px] font-medium text-muted mb-1">{t('remaining')}</p>
            <p className={`text-sm font-bold leading-tight ${remaining >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(remaining, cur)}
            </p>
          </div>
          {perPerson > 0 && (
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-[11px] font-medium text-muted mb-1">Po osobi</p>
              <p className="text-sm font-bold text-text leading-tight">{formatCurrency(perPerson, cur)}</p>
            </div>
          )}
          {perDay > 0 && (
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-[11px] font-medium text-muted mb-1">Po danu</p>
              <p className="text-sm font-bold text-text leading-tight">{formatCurrency(perDay, cur)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Spending projections (only if trip started and has expenses) ── */}
      {avgPerDay > 0 && days > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-bold text-text mb-3">Prognoza</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-3">
              <p className="text-[11px] text-muted mb-0.5">Dnevni prosek</p>
              <p className="text-sm font-bold text-text">{formatCurrency(avgPerDay, cur)}</p>
            </div>
            <div className={`rounded-xl p-3 ${projected > totalBudget ? 'bg-danger/5' : 'bg-success/5'}`}>
              <p className="text-[11px] text-muted mb-0.5">Očekivano ukupno</p>
              <p className={`text-sm font-bold ${projected > totalBudget ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(projected, cur)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Category breakdown ── */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <p className="text-sm font-bold text-text mb-4">Po kategorijama</p>
        <div className="space-y-3">
          {Object.entries(trip.budget.categories || {}).map(([key, budgeted]) => {
            const meta = CAT_META[key]
            const spent = catSpent[key] || 0
            const pct = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0
            const overBudget = spent > budgeted && budgeted > 0
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base shrink-0">{meta?.emoji}</span>
                  <span className="text-sm font-medium text-text flex-1">{catLabel(key)}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-bold ${overBudget ? 'text-danger' : 'text-text'}`}>
                      {formatCurrency(spent, cur)}
                    </span>
                    <span className="text-xs text-muted">/</span>
                    <input
                      type="number"
                      value={budgeted || ''}
                      onChange={e => handleCategoryChange(key, e.target.value)}
                      className="w-20 px-2 py-1 border border-border rounded-lg bg-background text-xs font-semibold text-right text-text focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden ml-7">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: overBudget ? '#EF4444' : meta?.color }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {/* Stacked bar */}
        {totalFromCats > 0 && (
          <div className="h-5 rounded-xl overflow-hidden flex bg-border mt-4">
            {Object.entries(trip.budget.categories || {}).map(([key, value]) => {
              const pct = totalFromCats > 0 ? (value / totalFromCats) * 100 : 0
              if (pct <= 0) return null
              return (
                <motion.div key={key} className="h-full" style={{ backgroundColor: CAT_META[key]?.color }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
              )
            })}
          </div>
        )}
      </div>

      {/* ── Log expense ── */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <p className="text-sm font-bold text-text mb-3">Dodaj trošak</p>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newExpense.name}
              onChange={e => setNewExpense(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
              placeholder="Opis"
              className="col-span-2 sm:col-span-1 px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="number"
              value={newExpense.amount}
              onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
              placeholder={`Iznos (${cur})`}
              className="col-span-2 sm:col-span-1 px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newExpense.category}
              onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}
              className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-text"
            >
              {Object.entries(CAT_META).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {catLabel(k)}</option>
              ))}
            </select>
            <input
              type="date"
              value={newExpense.date}
              onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
              className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm text-text"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddExpense}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors cursor-pointer"
          >
            + Dodaj trošak
          </motion.button>
        </div>
      </div>

      {/* ── Expense list ── */}
      {expenses.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-text">
              Troškovi <span className="text-muted font-normal">({expenses.length})</span>
            </p>
            <span className="text-sm font-bold text-primary">{formatCurrency(totalSpent, cur)}</span>
          </div>
          <div className="space-y-1">
            {[...expenses].reverse().map(expense => (
              <div key={expense.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <span className="text-lg shrink-0">{CAT_META[expense.category]?.emoji ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{expense.name}</p>
                  <p className="text-xs text-muted">
                    {catLabel(expense.category || 'other')}
                    {expense.date && ` · ${new Date(expense.date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                <span className="text-sm font-bold text-text shrink-0">
                  {formatCurrency(expense.amount, cur)}
                </span>
                <button
                  onClick={() => removeExpense(trip.id, expense.id)}
                  className="text-muted hover:text-danger transition-colors p-1 shrink-0 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
