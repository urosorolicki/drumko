import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import useNominatim from '../hooks/useNominatim'
import useOSRM from '../hooks/useOSRM'
import useOverpass from '../hooks/useOverpass'
import { generatePackingList } from '../utils/packingUtils'
import { estimateFuelCost, calculateTripDays, calculateNights, formatCurrency } from '../utils/budgetUtils'
import TripMap from '../components/Map/MapContainer'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'

const STEPS = ['stepBasics', 'stepRoute', 'stepPacking', 'stepBudget']

/* Shared packing category styles — also used in TripDetail */
const PACKING_CAT_STYLE = {
  Dokumenti:              { emoji: '📄', gradient: 'from-blue-50 to-blue-100',     badge: 'bg-blue-100 text-blue-700' },
  Deca:                   { emoji: '🧸', gradient: 'from-pink-50 to-pink-100',     badge: 'bg-pink-100 text-pink-700' },
  Garderoba:              { emoji: '👕', gradient: 'from-purple-50 to-purple-100', badge: 'bg-purple-100 text-purple-700' },
  Auto:                   { emoji: '🔧', gradient: 'from-gray-50 to-gray-100',     badge: 'bg-gray-100 text-gray-700' },
  'Hrana i piće':         { emoji: '🥪', gradient: 'from-amber-50 to-amber-100',   badge: 'bg-amber-100 text-amber-700' },
  Zabava:                 { emoji: '🎮', gradient: 'from-green-50 to-green-100',   badge: 'bg-green-100 text-green-700' },
  'Toaletne potrepštine': { emoji: '🧴', gradient: 'from-teal-50 to-teal-100',     badge: 'bg-teal-100 text-teal-700' },
  Ostalo:                 { emoji: '📦', gradient: 'from-orange-50 to-orange-100', badge: 'bg-orange-100 text-orange-700' },
}
function getPackingCatStyle(cat) {
  return PACKING_CAT_STYLE[cat] ?? PACKING_CAT_STYLE.Ostalo
}

/* POI category display meta */
const POI_STYLE = {
  fuel:        { emoji: '⛽', label: 'Gas', color: 'bg-stone-100 text-stone-700',   border: 'border-stone-200' },
  restaurant:  { emoji: '🍽️', label: 'Food', color: 'bg-amber-100 text-amber-700',  border: 'border-amber-200' },
  cafe:        { emoji: '☕', label: 'Cafe', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  attraction:  { emoji: '🏛️', label: 'Attraction', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  park:        { emoji: '🌳', label: 'Park', color: 'bg-green-100 text-green-700',   border: 'border-green-200' },
  hotel:       { emoji: '🏨', label: 'Hotel', color: 'bg-blue-100 text-blue-700',   border: 'border-blue-200' },
  stop:        { emoji: '📍', label: 'Stop', color: 'bg-primary/10 text-primary',   border: 'border-primary/20' },
}

const STEP_META = [
  {
    key: 'stepBasics',
    tagline: { en: "Let's kick off your adventure!", sr: 'Hajde da počnemo avanturu!' },
    color: 'from-sky-400 to-blue-500',
    ring: 'ring-sky-300',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    iconBg: 'bg-sky-500',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    key: 'stepRoute',
    tagline: { en: 'Draw your road on the map!', sr: 'Nacrtaj rutu na mapi!' },
    color: 'from-orange-400 to-primary',
    ring: 'ring-orange-300',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-primary',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18M3 12h18M3 17h18"/>
      </svg>
    ),
  },
  {
    key: 'stepPacking',
    tagline: { en: "Don't forget the snacks!", sr: 'Ne zaboravite grickalice!' },
    color: 'from-amber-400 to-yellow-500',
    ring: 'ring-amber-300',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    key: 'stepBudget',
    tagline: { en: 'Time to talk money!', sr: 'Vreme je za budžet!' },
    color: 'from-emerald-400 to-success',
    ring: 'ring-emerald-300',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-success',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
]

export default function CreateTrip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const trips = useTripStore(s => s.trips)
  const addTrip = useTripStore(s => s.addTrip)
  const updateTrip = useTripStore(s => s.updateTrip)
  const { t } = useTranslation()

  const existingTrip = isEditing ? trips.find(t => t.id === id) : null

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    adults: 2,
    children: 0,
    startCity: null,
    endCity: null,
    stops: [],
    packingList: [],
    budget: {
      total: 0,
      currency: 'RSD',
      categories: { fuel: 0, accommodation: 0, food: 0, activities: 0, other: 0 },
      expenses: [],
    },
    route: { geometry: null, totalDistance: 0, totalDuration: 0 },
  })

  // Load existing trip data if editing
  useEffect(() => {
    if (existingTrip) {
      setForm(existingTrip)
    }
  }, [existingTrip])

  // Routing
  const { fetchRoute, route: routeData, loading: routeLoading } = useOSRM()
  const { fetchPOIs, pois, loading: poisLoading } = useOverpass()

  // Fetch route when start/end cities or stops change
  useEffect(() => {
    if (form.startCity?.lat && form.endCity?.lat && step === 1) {
      const waypoints = [
        form.startCity,
        ...form.stops,
        form.endCity,
      ]
      fetchRoute(waypoints)
    }
  }, [form.startCity, form.endCity, form.stops, step])

  // Update form with route data
  useEffect(() => {
    if (routeData) {
      setForm(prev => ({
        ...prev,
        route: routeData,
      }))
    }
  }, [routeData])

  // Fetch POIs when route is available
  useEffect(() => {
    if (routeData?.geometry && step === 1) {
      fetchPOIs(routeData.geometry)
    }
  }, [routeData?.geometry, step])

  // Generate packing list when moving to step 3
  useEffect(() => {
    if (step === 2 && form.packingList.length === 0) {
      const days = calculateTripDays(form.startDate, form.endDate) || 5
      const list = generatePackingList(days, form.adults, form.children)
      setForm(prev => ({ ...prev, packingList: list }))
    }
  }, [step])

  // Auto-estimate budget when moving to step 4
  useEffect(() => {
    if (step === 3 && form.budget.total === 0) {
      const distKm = form.route.totalDistance || 500 // fallback 500 km if no route yet
      const days = calculateTripDays(form.startDate, form.endDate) || 5
      const nights = calculateNights(form.startDate, form.endDate) || 4
      const people = form.adults + form.children
      const currency = form.budget.currency

      const fuelPrice = currency === 'RSD' ? 200 : 1.6
      const fuel = Math.round(estimateFuelCost(distKm, 7, fuelPrice))
      const accommodation = currency === 'RSD' ? nights * 8000 : nights * 70
      const food = currency === 'RSD' ? days * (form.adults * 3000 + form.children * 1500) : days * (form.adults * 25 + form.children * 12)
      const activities = currency === 'RSD' ? days * people * 1000 : days * people * 10
      const other = currency === 'RSD' ? 10000 : 80

      const total = fuel + accommodation + food + activities + other

      setForm(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          total,
          categories: { fuel, accommodation, food, activities, other },
        },
      }))
    }
  }, [step])

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleAddStop(poi) {
    const stop = {
      id: crypto.randomUUID(),
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      note: '',
      arrivalTime: '',
      type: poi.category || 'stop',
    }
    setForm(prev => ({ ...prev, stops: [...prev.stops, stop] }))
  }

  function handleRemoveStop(stopId) {
    setForm(prev => ({ ...prev, stops: prev.stops.filter(s => s.id !== stopId) }))
  }

  function handleNoteChange(stopId, note) {
    setForm(prev => ({
      ...prev,
      stops: prev.stops.map(s => s.id === stopId ? { ...s, note } : s),
    }))
  }

  function handleSave() {
    if (isEditing) {
      updateTrip(id, form)
      navigate(`/trips/${id}`)
    } else {
      const newId = crypto.randomUUID()
      addTrip({ ...form, id: newId })
      navigate(`/trips/${newId}`)
    }
  }

  function canProceed() {
    switch (step) {
      case 0: return form.name && form.startCity && form.endCity
      case 1: return true
      case 2: return true
      case 3: return true
      default: return false
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="text-muted hover:text-text transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="text-lg font-bold text-text">
              {isEditing ? t('editTrip') : t('newTrip')}
            </h1>
            <LanguageToggle />
          </div>

          {/* Step progress — fun bubbles */}
          <div className="flex items-center gap-1">
            {STEP_META.map((meta, i) => (
              <div key={i} className="flex-1 flex items-center gap-1">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <motion.div
                    animate={i === step ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, repeat: i === step ? Infinity : 0, repeatDelay: 2 }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      i < step
                        ? 'bg-success shadow-[0_4px_0_rgba(34,197,94,0.4)]'
                        : i === step
                        ? `${meta.iconBg} shadow-[0_4px_0_rgba(0,0,0,0.15)]`
                        : 'bg-border'
                    }`}
                  >
                    {i < step ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <div className={i === step ? 'text-white' : 'text-muted'}>
                        {i === step ? meta.icon : (
                          <span className="text-sm font-bold">{i + 1}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-semibold hidden sm:block ${
                    i === step ? 'text-text' : i < step ? 'text-success' : 'text-muted'
                  }`}>
                    {t(meta.key)}
                  </span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className="flex-1 h-1 rounded-full bg-border mb-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-success rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: i < step ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {step === 0 && <StepBasics key="basics" form={form} updateForm={updateForm} />}
          {step === 1 && (
            <StepRoute
              key="route"
              form={form}
              pois={pois}
              routeLoading={routeLoading}
              poisLoading={poisLoading}
              onAddStop={handleAddStop}
              onRemoveStop={handleRemoveStop}
              onNoteChange={handleNoteChange}
              onReorderStops={(stops) => updateForm('stops', stops)}
            />
          )}
          {step === 2 && <StepPacking key="packing" form={form} setForm={setForm} />}
          {step === 3 && <StepBudget key="budget" form={form} setForm={setForm} />}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pb-8">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="px-6 py-3 rounded-xl font-semibold text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('back')}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="btn-clay px-8 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t('next')}
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="btn-clay px-8 py-3 bg-success text-white font-bold rounded-xl cursor-pointer"
            >
              {isEditing ? t('saveChanges') : t('save')}
            </button>
          )}
        </div>
      </main>
    </motion.div>
  )
}

/* ============================================
   Step Banner — colourful top card per step
   ============================================ */
function StepBanner({ stepIndex, t }) {
  const meta = STEP_META[stepIndex]
  const lang = useTranslation().lang
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${meta.bg} border-2 ${meta.border} rounded-3xl p-5 mb-6 flex items-center gap-4`}
    >
      <div className={`w-14 h-14 rounded-2xl ${meta.iconBg} flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.15)] shrink-0`}>
        {meta.icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted mb-0.5">
          Step {stepIndex + 1} / {STEPS.length}
        </p>
        <h2 className="text-2xl font-semibold text-text leading-tight" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          {t(meta.key)}
        </h2>
        <p className="text-sm text-muted">{meta.tagline[lang] ?? meta.tagline.en}</p>
      </div>
    </motion.div>
  )
}

/* Reusable clay-style section card */
function SectionCard({ label, children, accent = '' }) {
  return (
    <div className={`bg-surface rounded-2xl border-2 ${accent || 'border-border'} p-4 shadow-[0_3px_0_rgba(0,0,0,0.06)]`}>
      {label && <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">{label}</p>}
      {children}
    </div>
  )
}

/* ============================================
   STEP 1: Trip Basics
   ============================================ */
function StepBasics({ form, updateForm }) {
  const startSearch = useNominatim()
  const endSearch = useNominatim()
  const [startQuery, setStartQuery] = useState(form.startCity?.name?.split(',')[0] || '')
  const [endQuery, setEndQuery] = useState(form.endCity?.name?.split(',')[0] || '')
  const [showStartResults, setShowStartResults] = useState(false)
  const [showEndResults, setShowEndResults] = useState(false)
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="max-w-lg mx-auto space-y-4"
    >
      <StepBanner stepIndex={0} t={t} />

      {/* Trip name */}
      <SectionCard label={t('tripName')} accent="border-sky-200">
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
          placeholder="Letovanje 2025 🌊"
          className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text text-lg font-semibold placeholder:text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all"
        />
      </SectionCard>

      {/* Date range */}
      <SectionCard label={`${t('startDate')} → ${t('endDate')}`} accent="border-sky-200">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => updateForm('startDate', e.target.value)}
            className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all cursor-pointer"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => updateForm('endDate', e.target.value)}
            className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all cursor-pointer"
          />
        </div>
      </SectionCard>

      {/* Travelers */}
      <SectionCard label="👥 Putnici / Travelers" accent="border-sky-200">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t('adults'), key: 'adults', min: 1, emoji: '🧑' },
            { label: t('children'), key: 'children', min: 0, emoji: '🧒' },
          ].map(({ label, key, min, emoji }) => (
            <div key={key}>
              <p className="text-xs font-semibold text-muted mb-2">{emoji} {label}</p>
              <div className="flex items-center bg-background border-2 border-border rounded-xl overflow-hidden">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => updateForm(key, Math.max(min, form[key] - 1))}
                  className="px-4 py-3 text-xl font-bold text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  −
                </motion.button>
                <motion.span
                  key={form[key]}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex-1 text-center text-2xl font-bold text-text"
                >
                  {form[key]}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => updateForm(key, form[key] + 1)}
                  className="px-4 py-3 text-xl font-bold text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  +
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Route */}
      <SectionCard label="🗺️ Ruta / Route" accent="border-sky-200">
        <div className="space-y-3">
          {/* Start city */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-success shrink-0" />
              <span className="text-xs font-semibold text-muted">{t('startCity')}</span>
              {form.startCity && <span className="text-xs text-success font-semibold ml-auto">✓ {form.startCity.name.split(',')[0]}</span>}
            </div>
            <input
              type="text"
              value={startQuery}
              onChange={(e) => {
                setStartQuery(e.target.value)
                if (e.target.value.length >= 3) { startSearch.search(e.target.value); setShowStartResults(true) }
                else setShowStartResults(false)
              }}
              onFocus={() => { if (startSearch.results.length) setShowStartResults(true) }}
              placeholder="npr. Beograd"
              className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text placeholder:text-muted focus:outline-none focus:border-success focus:ring-2 focus:ring-success/30 transition-all"
            />
            {showStartResults && startSearch.results.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-surface border-2 border-border rounded-xl shadow-xl max-h-48 overflow-auto">
                {startSearch.results.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { updateForm('startCity', r); setStartQuery(r.name.split(',')[0]); setShowStartResults(false); startSearch.clearResults() }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-success/5 transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-text">{r.name.split(',')[0]}</span>
                      <span className="text-muted text-xs block truncate">{r.name.split(',').slice(1).join(',')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 pl-1">
            <div className="w-0.5 h-5 bg-border mx-1" />
            <span className="text-xs text-muted">drivin'…</span>
          </div>

          {/* End city */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
              <span className="text-xs font-semibold text-muted">{t('destination')}</span>
              {form.endCity && <span className="text-xs text-primary font-semibold ml-auto">✓ {form.endCity.name.split(',')[0]}</span>}
            </div>
            <input
              type="text"
              value={endQuery}
              onChange={(e) => {
                setEndQuery(e.target.value)
                if (e.target.value.length >= 3) { endSearch.search(e.target.value); setShowEndResults(true) }
                else setShowEndResults(false)
              }}
              onFocus={() => { if (endSearch.results.length) setShowEndResults(true) }}
              placeholder="npr. Split"
              className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {showEndResults && endSearch.results.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-surface border-2 border-border rounded-xl shadow-xl max-h-48 overflow-auto">
                {endSearch.results.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { updateForm('endCity', r); setEndQuery(r.name.split(',')[0]); setShowEndResults(false); endSearch.clearResults() }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-text">{r.name.split(',')[0]}</span>
                      <span className="text-muted text-xs block truncate">{r.name.split(',').slice(1).join(',')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>
    </motion.div>
  )
}

/* ============================================
   Stops + Discover sidebar panel
   ============================================ */
function StopsPanel({ form, pois, poisLoading, onAddStop, onRemoveStop }) {
  const [tab, setTab] = useState('route') // 'route' | 'discover'
  const [discoverFilter, setDiscoverFilter] = useState('all')
  const { t } = useTranslation()

  // Group POIs by category, exclude already added stops
  const addedNames = new Set(form.stops.map(s => s.name))
  const filteredPois = pois.filter(p => !addedNames.has(p.name))
  const poiCategories = ['all', ...new Set(filteredPois.map(p => p.category).filter(Boolean))]
  const visiblePois = discoverFilter === 'all'
    ? filteredPois
    : filteredPois.filter(p => p.category === discoverFilter)

  return (
    <div className="bg-surface border-2 border-orange-200 rounded-2xl overflow-hidden shadow-[0_4px_0_rgba(249,115,22,0.15)] flex flex-col max-h-[600px]">
      {/* Tab bar */}
      <div className="flex border-b-2 border-orange-100">
        <button
          onClick={() => setTab('route')}
          className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${
            tab === 'route' ? 'bg-orange-50 text-primary border-b-2 border-primary' : 'text-muted hover:text-text'
          }`}
        >
          🛣️ Ruta ({form.stops.length})
        </button>
        <button
          onClick={() => setTab('discover')}
          className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer relative ${
            tab === 'discover' ? 'bg-orange-50 text-primary border-b-2 border-primary' : 'text-muted hover:text-text'
          }`}
        >
          ✨ Otkrij
          {poisLoading && (
            <span className="ml-1 inline-block w-2 h-2 bg-primary rounded-full animate-ping" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {tab === 'route' && (
            <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Start */}
              <div className="flex items-center gap-2 p-2.5 mb-1 bg-success/10 border border-success/20 rounded-xl">
                <span className="w-7 h-7 bg-success rounded-full flex items-center justify-center shrink-0 shadow-sm text-sm">🏠</span>
                <div>
                  <p className="text-xs text-muted font-semibold">Polazak</p>
                  <p className="text-sm font-bold text-text">{form.startCity?.name?.split(',')[0]}</p>
                </div>
              </div>

              {form.stops.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6 px-4"
                >
                  <p className="text-3xl mb-2">🗺️</p>
                  <p className="text-sm font-semibold text-text mb-1">Nema stanica još</p>
                  <p className="text-xs text-muted">Klikni na mapi ili istražuj atrakcije u tabu "Otkrij"</p>
                </motion.div>
              ) : (
                <div className="space-y-1 my-2">
                  {form.stops.map((stop, i) => {
                    const style = POI_STYLE[stop.type] ?? POI_STYLE.stop
                    return (
                      <motion.div
                        key={stop.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`flex items-center gap-2 p-2.5 border ${style.border} bg-white rounded-xl group`}
                      >
                        <span className="text-lg shrink-0">{style.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{stop.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${style.color}`}>
                            {style.label}
                          </span>
                        </div>
                        <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <button
                          onClick={() => onRemoveStop(stop.id)}
                          className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* End */}
              <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl mt-1">
                <span className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shrink-0 shadow-sm text-sm">🏁</span>
                <div>
                  <p className="text-xs text-muted font-semibold">Odredište</p>
                  <p className="text-sm font-bold text-text">{form.endCity?.name?.split(',')[0]}</p>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'discover' && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {poisLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted">Tražim atrakcije...</p>
                </div>
              ) : filteredPois.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm text-muted">Nema pronađenih atrakcija uz rutu.</p>
                </div>
              ) : (
                <>
                  {/* Category filter chips */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {poiCategories.map(cat => {
                      const style = POI_STYLE[cat]
                      return (
                        <button
                          key={cat}
                          onClick={() => setDiscoverFilter(cat)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            discoverFilter === cat
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface border border-border text-muted hover:text-text'
                          }`}
                        >
                          {cat === 'all' ? '🌍 Sve' : `${style?.emoji ?? '📍'} ${style?.label ?? cat}`}
                        </button>
                      )
                    })}
                  </div>

                  {/* POI cards */}
                  <div className="space-y-1.5">
                    {visiblePois.slice(0, 30).map((poi, i) => {
                      const style = POI_STYLE[poi.category] ?? POI_STYLE.stop
                      const alreadyAdded = addedNames.has(poi.name)
                      return (
                        <motion.div
                          key={i}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`flex items-center gap-2.5 p-2.5 border ${style.border} bg-white rounded-xl`}
                        >
                          <span className="text-xl shrink-0">{style.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{poi.name}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${style.color}`}>
                              {style.label}
                            </span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onAddStop(poi)}
                            disabled={alreadyAdded}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all cursor-pointer shrink-0 ${
                              alreadyAdded
                                ? 'bg-success/20 text-success'
                                : 'bg-primary text-white shadow-sm hover:bg-primary-dark'
                            }`}
                          >
                            {alreadyAdded ? '✓' : '+'}
                          </motion.button>
                        </motion.div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ============================================
   STEP 2: Route & Stops
   ============================================ */
function StepRoute({ form, pois, routeLoading, poisLoading, onAddStop, onRemoveStop, onNoteChange, onReorderStops }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <StepBanner stepIndex={1} t={t} />

      {!form.startCity?.lat || !form.endCity?.lat ? (
        <div className="text-center py-12 text-muted">
          <p>Please set start and destination cities in the previous step.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2">
            {routeLoading && (
              <div className="absolute inset-0 z-10 bg-surface/80 flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted">Calculating route...</p>
                </div>
              </div>
            )}
            <TripMap
              startCity={form.startCity}
              endCity={form.endCity}
              stops={form.stops}
              route={form.route}
              pois={pois}
              onAddStop={onAddStop}
              onRemoveStop={onRemoveStop}
              onNoteChange={onNoteChange}
              showSearch={true}
              showPOIs={true}
              showStats={true}
              height="500px"
            />
          </div>

          {/* Stops + Discover panel */}
          <StopsPanel
            form={form}
            pois={pois}
            poisLoading={poisLoading}
            onAddStop={onAddStop}
            onRemoveStop={onRemoveStop}
          />
        </div>
      )}
    </motion.div>
  )
}

/* ============================================
   STEP 3: Packing List
   ============================================ */
function StepPacking({ form, setForm }) {
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('Ostalo')
  const [filter, setFilter] = useState('all')
  const { t } = useTranslation()

  const categories = [...new Set(form.packingList.map(item => item.category))]
  const totalItems = form.packingList.length
  const packedItems = form.packingList.filter(item => item.checked).length

  function toggleItem(itemId) {
    setForm(prev => ({
      ...prev,
      packingList: prev.packingList.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }))
  }

  function addItem() {
    if (!newItem.trim()) return
    const item = {
      id: crypto.randomUUID(),
      category: newCategory,
      name: newItem.trim(),
      checked: false,
    }
    setForm(prev => ({ ...prev, packingList: [...prev.packingList, item] }))
    setNewItem('')
  }

  function removeItem(itemId) {
    setForm(prev => ({
      ...prev,
      packingList: prev.packingList.filter(item => item.id !== itemId),
    }))
  }

  const filteredList = form.packingList.filter(item => {
    if (filter === 'packed') return item.checked
    if (filter === 'unpacked') return !item.checked
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="max-w-2xl mx-auto"
    >
      <StepBanner stepIndex={2} t={t} />

      {/* Fun progress header */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5 shadow-[0_3px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-3xl font-extrabold text-text" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              {totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0}
              <span className="text-xl text-muted">%</span>
            </span>
            <p className="text-xs text-muted">{packedItems} / {totalItems} packed</p>
          </div>
          <span className="text-4xl">{packedItems === totalItems && totalItems > 0 ? '🏖️' : packedItems > totalItems / 2 ? '🚗' : '🧳'}</span>
        </div>
        <div className="h-3 bg-amber-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #F59E0B, #F97316)' }}
            animate={{ width: `${totalItems > 0 ? (packedItems / totalItems) * 100 : 0}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: '🗂 All' },
            { key: 'unpacked', label: '⬜ Todo' },
            { key: 'packed', label: '✅ Done' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filter === f.key ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-muted hover:text-text border border-amber-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add custom item */}
      <div className="flex gap-2 mb-5">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="px-3 py-2.5 border-2 border-amber-200 rounded-xl bg-surface text-text text-sm cursor-pointer"
        >
          {[...categories, 'Ostalo'].filter((v, i, a) => a.indexOf(v) === i).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add something to pack..."
          className="flex-1 px-4 py-2.5 border-2 border-amber-200 rounded-xl bg-surface text-text placeholder:text-muted text-sm focus:outline-none focus:border-amber-400 transition-colors"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={addItem}
          className="btn-clay px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm cursor-pointer"
        >
          +
        </motion.button>
      </div>

      {/* Packing items by category — fun gradient cards */}
      <div className="space-y-3">
        {categories.map(category => {
          const items = filteredList.filter(item => item.category === category)
          if (items.length === 0) return null
          const style = getPackingCatStyle(category)
          const packedCount = items.filter(i => i.checked).length
          const allDone = packedCount === items.length

          return (
            <div key={category} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Category header */}
              <div className={`flex items-center gap-3 p-3 bg-gradient-to-r ${style.gradient}`}>
                <span className="text-2xl">{style.emoji}</span>
                <div className="flex-1">
                  <span className="font-bold text-text text-sm">{category}</span>
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {packedCount}/{items.length}
                  </span>
                </div>
                {allDone && <span className="text-lg">✅</span>}
              </div>

              {/* Items */}
              <div className="divide-y divide-border">
                {items.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      item.checked ? 'bg-success/5' : 'hover:bg-background'
                    }`}
                  >
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={() => toggleItem(item.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        item.checked ? 'bg-success border-success' : 'border-border hover:border-primary'
                      }`}
                    >
                      {item.checked && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }}
                          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </motion.svg>
                      )}
                    </motion.button>
                    <span className={`flex-1 text-sm font-medium transition-all ${item.checked ? 'line-through text-muted' : 'text-text'}`}>
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-border hover:text-danger transition-colors cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ============================================
   Shared budget constants
   ============================================ */
const CATEGORY_META = {
  fuel:          { label: 'Fuel',          sr: 'Gorivo',       emoji: '⛽', color: '#78716C', defaultPct: 0.25 },
  accommodation: { label: 'Accommodation', sr: 'Smeštaj',      emoji: '🏨', color: '#3B82F6', defaultPct: 0.33 },
  food:          { label: 'Food & Drinks', sr: 'Hrana i piće', emoji: '🍽️', color: '#F59E0B', defaultPct: 0.25 },
  activities:    { label: 'Activities',    sr: 'Aktivnosti',   emoji: '🎯', color: '#8B5CF6', defaultPct: 0.12 },
  other:         { label: 'Other',         sr: 'Ostalo',       emoji: '📦', color: '#A8A29E', defaultPct: 0.05 },
}

/**
 * Distribute a total budget proportionally across categories.
 * Uses current category values as ratio basis;
 * falls back to CATEGORY_META.defaultPct when all are zero.
 */
function autoAllocate(total, currentCategories) {
  const keys = Object.keys(currentCategories)
  const sum = keys.reduce((s, k) => s + (currentCategories[k] || 0), 0)

  // Determine ratios
  const ratios = {}
  if (sum > 0) {
    keys.forEach(k => { ratios[k] = (currentCategories[k] || 0) / sum })
  } else {
    keys.forEach(k => { ratios[k] = CATEGORY_META[k]?.defaultPct ?? 0.1 })
  }

  // Allocate — round to whole numbers, fix rounding remainder on first category
  const result = {}
  let allocated = 0
  keys.forEach((k, i) => {
    if (i < keys.length - 1) {
      result[k] = Math.round(total * ratios[k])
      allocated += result[k]
    } else {
      result[k] = Math.round(total - allocated)
    }
  })
  return result
}

/* ============================================
   STEP 4: Budget
   ============================================ */
function StepBudget({ form, setForm }) {
  const { budget } = form
  const { t } = useTranslation()

  /** When user types a new total → re-allocate all categories proportionally */
  function handleTotalChange(rawValue) {
    const total = parseFloat(rawValue) || 0
    const newCategories = autoAllocate(total, budget.categories)
    setForm(prev => ({
      ...prev,
      budget: { ...prev.budget, total, categories: newCategories },
    }))
  }

  /** When user manually edits a category → update that category + recalc total */
  function handleCategoryChange(key, rawValue) {
    const num = parseFloat(rawValue) || 0
    const newCategories = { ...budget.categories, [key]: num }
    const newTotal = Object.values(newCategories).reduce((a, b) => a + b, 0)
    setForm(prev => ({
      ...prev,
      budget: { ...prev.budget, categories: newCategories, total: newTotal },
    }))
  }

  const EUR_TO_RSD = 117
  function handleCurrencyChange(cur) {
    if (cur === budget.currency) return
    const rate = cur === 'EUR' ? 1 / EUR_TO_RSD : EUR_TO_RSD
    const newTotal = Math.round(budget.total * rate)
    const newCategories = Object.fromEntries(
      Object.entries(budget.categories).map(([k, v]) => [k, Math.round(v * rate)])
    )
    setForm(prev => ({
      ...prev,
      budget: { ...prev.budget, currency: cur, total: newTotal, categories: newCategories },
    }))
  }

  const totalFromCategories = Object.values(budget.categories).reduce((a, b) => a + b, 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="max-w-2xl mx-auto"
    >
      <StepBanner stepIndex={3} t={t} />

      {/* Currency toggle */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-semibold text-muted">{t('currency')}:</span>
        <div className="flex bg-emerald-50 border-2 border-emerald-200 rounded-xl overflow-hidden">
          {['RSD', 'EUR'].map(cur => (
            <button
              key={cur}
              onClick={() => handleCurrencyChange(cur)}
              className={`px-5 py-2 text-sm font-bold transition-colors cursor-pointer ${
                budget.currency === cur ? 'bg-success text-white' : 'text-muted hover:text-text'
              }`}
            >
              {cur === 'RSD' ? 'RSD (дин.)' : '€ EUR'}
            </button>
          ))}
        </div>
      </div>

      {/* Total budget — magic input */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 mb-5 shadow-[0_4px_0_rgba(34,197,94,0.2)]">
        <label className="block text-sm font-bold text-text mb-0.5" style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1rem' }}>
          {t('totalBudget')}
        </label>
        <p className="text-xs text-muted mb-3">{t('budgetHint')}</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-400">{budget.currency === 'RSD' ? 'din.' : '€'}</span>
          <input
            type="number"
            value={budget.total || ''}
            onChange={(e) => handleTotalChange(e.target.value)}
            className="flex-1 px-4 py-3 text-3xl font-extrabold border-2 border-emerald-300 rounded-xl bg-white text-success focus:outline-none focus:border-success focus:ring-2 focus:ring-success/30 transition-all"
            placeholder="0"
          />
        </div>
      </div>

      {/* Auto-allocated category sliders */}
      <div className="bg-surface border-2 border-emerald-200 rounded-2xl p-5 mb-5 shadow-[0_3px_0_rgba(0,0,0,0.06)]">
        <h3 className="text-sm font-semibold text-text mb-1">Allocation</h3>
        <p className="text-xs text-muted mb-4">{t('budgetHint')}</p>
        <div className="space-y-4">
          {Object.entries(budget.categories).map(([key, value]) => {
            const meta = CATEGORY_META[key]
            const catKey = key === 'fuel' ? 'catFuel' : key === 'accommodation' ? 'catAccomm' : key === 'food' ? 'catFood' : key === 'activities' ? 'catActivities' : 'catOther'
            const pct = totalFromCategories > 0 ? (value / totalFromCategories) * 100 : 0
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg">{meta.emoji}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text">{t(catKey)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value || ''}
                      onChange={(e) => handleCategoryChange(key, e.target.value)}
                      className="w-28 px-3 py-1.5 border border-border rounded-lg bg-background text-text text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted w-9 text-right">{Math.round(pct)}%</span>
                  </div>
                </div>
                {/* Mini bar showing proportion */}
                <div className="h-1.5 bg-border rounded-full overflow-hidden ml-8">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.color }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Visual stacked bar */}
      <div className="h-8 rounded-2xl overflow-hidden flex bg-border">
        {Object.entries(budget.categories).map(([key, value]) => {
          const pct = totalFromCategories > 0 ? (value / totalFromCategories) * 100 : 0
          if (pct <= 0) return null
          return (
            <motion.div
              key={key}
              className="h-full"
              style={{ backgroundColor: CATEGORY_META[key].color }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              title={`${CATEGORY_META[key].label}: ${Math.round(pct)}%`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const catKey = key === 'fuel' ? 'catFuel' : key === 'accommodation' ? 'catAccomm' : key === 'food' ? 'catFood' : key === 'activities' ? 'catActivities' : 'catOther'
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
              {t(catKey)}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
