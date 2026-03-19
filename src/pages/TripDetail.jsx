import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import TripMap from '../components/Map/MapContainer'
import { formatDistance, formatDuration } from '../utils/geoUtils'
import { calculateTripDays, formatCurrency, getBudgetSummary } from '../utils/budgetUtils'
import useRouteStats from '../hooks/useRouteStats'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'

const TABS = ['overview', 'map', 'stops', 'packing', 'budget']

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const { t } = useTranslation()

  const trip = useTripStore(s => s.trips.find(t => t.id === id))
  const updateTrip = useTripStore(s => s.updateTrip)
  const deleteTrip = useTripStore(s => s.deleteTrip)
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
      deleteTrip(id)
      navigate('/trips')
    }
  }

  function handleShareTrip() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!')
    })
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
              updateTrip={updateTrip}
            />
          )}
          {activeTab === 'packing' && (
            <TabPacking
              key="packing"
              trip={trip}
              toggleItem={togglePackingItem}
              updateTrip={updateTrip}
            />
          )}
          {activeTab === 'budget' && (
            <TabBudget
              key="budget"
              trip={trip}
              budgetSummary={budgetSummary}
              addExpense={addExpense}
              removeExpense={removeExpense}
            />
          )}
        </AnimatePresence>
      </main>
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
function TabStops({ trip, routeStats, updateStop }) {
  // Build full ordered list: start → intermediate stops → end
  const allPoints = [
    { ...trip.startCity, id: 'start', isStart: true },
    ...trip.stops,
    { ...trip.endCity, id: 'end', isEnd: true },
  ].filter(p => p && p.lat)

  // stopDistances[i] is the distance FROM point i TO point i+1
  const { stopDistances, stopDurations } = routeStats

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
        // The leg ARRIVING at stop i is segment i-1
        const legDist = stopDistances[i - 1]
        const legDur = stopDurations[i - 1]

        return (
          <div key={stop.id || i} className="relative">
            {/* Driving info connector between stops */}
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
                {/* Marker badge */}
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
                      placeholder="Add notes for this stop..."
                      rows={2}
                      className="mt-2 w-full text-sm p-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-text placeholder:text-muted"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {allPoints.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="font-medium">No stops yet</p>
          <p className="text-sm">Add stops in the route step when editing the trip.</p>
        </div>
      )}
    </motion.div>
  )
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
function TabBudget({ trip, budgetSummary, addExpense, removeExpense }) {
  const updateBudget = useTripStore(s => s.updateBudget)
  const { t } = useTranslation()
  const [newExpense, setNewExpense] = useState({
    name: '', amount: '', category: 'food',
    date: new Date().toISOString().slice(0, 10),
  })

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

  const totalFromCats = Object.values(trip.budget.categories || {}).reduce((a, b) => a + b, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-muted mb-1">{t('budget')}</p>
          <p className="text-base font-bold text-text">{formatCurrency(budgetSummary.totalBudget, trip.budget.currency)}</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-muted mb-1">{t('spent')}</p>
          <p className="text-base font-bold text-primary">{formatCurrency(budgetSummary.totalSpent, trip.budget.currency)}</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${budgetSummary.remaining >= 0 ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
          <p className="text-xs font-medium text-muted mb-1">{t('remaining')}</p>
          <p className={`text-base font-bold ${budgetSummary.remaining >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(budgetSummary.remaining, trip.budget.currency)}
          </p>
        </div>
      </div>

      {/* Total budget — auto-allocates on change */}
      <div className="bg-surface border-2 border-primary/30 rounded-2xl p-5">
        <label className="block text-sm font-semibold text-text mb-0.5">{t('totalBudget')}</label>
        <p className="text-xs text-muted mb-3">{t('budgetHint')}</p>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-muted">{trip.budget.currency === 'RSD' ? 'din.' : '€'}</span>
          <input
            type="number"
            value={trip.budget.total || ''}
            onChange={e => handleTotalChange(e.target.value)}
            className="flex-1 px-4 py-3 text-2xl font-extrabold border-2 border-primary/40 rounded-xl bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="0"
          />
        </div>
      </div>

      {/* Category allocation — editable */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text mb-1">Allocation</h3>
        <p className="text-xs text-muted mb-4">{t('budgetHint')}</p>
        <div className="space-y-4">
          {Object.entries(trip.budget.categories || {}).map(([key, value]) => {
            const meta = CAT_META[key]
            const catKey = key === 'fuel' ? 'catFuel' : key === 'accommodation' ? 'catAccomm' : key === 'food' ? 'catFood' : key === 'activities' ? 'catActivities' : 'catOther'
            const pct = totalFromCats > 0 ? (value / totalFromCats) * 100 : 0
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg">{meta?.emoji}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text">{t(catKey)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value || ''}
                      onChange={e => handleCategoryChange(key, e.target.value)}
                      className="w-28 px-3 py-1.5 border border-border rounded-lg bg-background text-text text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted w-9 text-right">{Math.round(pct)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden ml-8">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta?.color }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {/* Stacked bar */}
        <div className="h-6 rounded-xl overflow-hidden flex bg-border mt-5">
          {Object.entries(trip.budget.categories || {}).map(([key, value]) => {
            const pct = totalFromCats > 0 ? (value / totalFromCats) * 100 : 0
            if (pct <= 0) return null
            return (
              <motion.div key={key} className="h-full" style={{ backgroundColor: CAT_META[key]?.color }}
                animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
            )
          })}
        </div>
      </div>

      {/* Log expense */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text mb-1">{t('logExpense')}</h3>
        <div className="grid grid-cols-2 gap-2 mb-2 mt-3">
          <input type="text" value={newExpense.name}
            onChange={e => setNewExpense(p => ({ ...p, name: e.target.value }))}
            placeholder={t('description')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input type="number" value={newExpense.amount}
            onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
            placeholder={`Iznos (${trip.budget.currency})`}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select value={newExpense.category}
            onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm text-text">
            {Object.entries(CAT_META).map(([k, m]) => {
              const ck = k === 'fuel' ? 'catFuel' : k === 'accommodation' ? 'catAccomm' : k === 'food' ? 'catFood' : k === 'activities' ? 'catActivities' : 'catOther'
              return <option key={k} value={k}>{m.emoji} {t(ck)}</option>
            })}
          </select>
          <input type="date" value={newExpense.date}
            onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm text-text" />
        </div>
        <button onClick={handleAddExpense}
          className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors">
          {t('addExpense')}
        </button>
      </div>

      {/* Expense list */}
      {trip.budget.expenses?.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text mb-3">
            {t('expenses')} <span className="text-muted font-normal">({trip.budget.expenses.length})</span>
          </h3>
          <div className="space-y-2">
            {[...trip.budget.expenses].reverse().map(expense => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CAT_META[expense.category]?.emoji ?? '📦'}</span>
                  <div>
                    <p className="text-sm font-medium text-text">{expense.name}</p>
                    <p className="text-xs text-muted">
                      {(() => { const ck = expense.category === 'fuel' ? 'catFuel' : expense.category === 'accommodation' ? 'catAccomm' : expense.category === 'food' ? 'catFood' : expense.category === 'activities' ? 'catActivities' : 'catOther'; return t(ck) })()}
                      {expense.date && ` · ${new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text">
                    {formatCurrency(expense.amount, trip.budget.currency)}
                  </span>
                  <button onClick={() => removeExpense(trip.id, expense.id)}
                    className="text-muted hover:text-danger transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
