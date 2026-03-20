import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import useNominatim from '../hooks/useNominatim'
import useOSRM from '../hooks/useOSRM'
import useGeoapify from '../hooks/useGeoapify'
import { generatePackingList } from '../utils/packingUtils'
import { estimateFuelCost, calculateTripDays, calculateNights, formatCurrency } from '../utils/budgetUtils'
import TripMap from '../components/Map/MapContainer'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'
import DateRangePicker from '../components/UI/DateRangePicker'
import poiCategories from '../data/poiCategories'
import useAuthStore from '../store/useAuthStore'
import { getRouteKm } from '../utils/geoUtils'
import useSmartStops from '../hooks/useSmartStops'

const STEPS = ['stepBasics', 'stepRoute', 'stepPacking', 'stepBudget']

/** Build a Google Maps Directions URL from form data */
function buildGoogleMapsUrl(form) {
  const origin = `${form.startCity.lat},${form.startCity.lng}`
  const destination = `${form.endCity.lat},${form.endCity.lng}`
  const waypoints = form.stops.map(s => `${s.lat},${s.lng}`).join('|')
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  if (waypoints) url.searchParams.set('waypoints', waypoints)
  url.searchParams.set('travelmode', 'driving')
  return url.toString()
}

/** Build a Waze navigation URL (navigates to final destination) */
function buildWazeUrl(form) {
  const url = new URL('https://waze.com/ul')
  url.searchParams.set('ll', `${form.endCity.lat},${form.endCity.lng}`)
  url.searchParams.set('navigate', 'yes')
  return url.toString()
}

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
  fuel:        { emoji: '⛽', label: 'Pumpa',           color: 'bg-stone-100 text-stone-700',    border: 'border-stone-200' },
  car_wash:    { emoji: '🚿', label: 'Autopraonica',    color: 'bg-sky-100 text-sky-700',        border: 'border-sky-200' },
  rest_area:   { emoji: '🌿', label: 'Odmaralište',     color: 'bg-green-100 text-green-700',    border: 'border-green-200' },
  services:    { emoji: '🏪', label: 'Servisna stanica',color: 'bg-indigo-100 text-indigo-700',  border: 'border-indigo-200' },
  picnic_site: { emoji: '🧺', label: 'Piknik',          color: 'bg-lime-100 text-lime-700',      border: 'border-lime-200' },
  restaurant:  { emoji: '🍽️', label: 'Restoran',        color: 'bg-amber-100 text-amber-700',    border: 'border-amber-200' },
  fast_food:   { emoji: '🍔', label: 'Fast food',       color: 'bg-red-100 text-red-700',        border: 'border-red-200' },
  cafe:        { emoji: '☕', label: 'Kafić',            color: 'bg-yellow-100 text-yellow-700',  border: 'border-yellow-200' },
  hotel:       { emoji: '🏨', label: 'Hotel',            color: 'bg-blue-100 text-blue-700',      border: 'border-blue-200' },
  motel:       { emoji: '🛏️', label: 'Motel',            color: 'bg-blue-50 text-blue-600',       border: 'border-blue-100' },
  hostel:      { emoji: '🏠', label: 'Hostel',           color: 'bg-cyan-100 text-cyan-700',      border: 'border-cyan-200' },
  camp_site:   { emoji: '⛺', label: 'Kamp',             color: 'bg-emerald-100 text-emerald-700',border: 'border-emerald-200' },
  attraction:  { emoji: '🏛️', label: 'Atrakcija',        color: 'bg-purple-100 text-purple-700',  border: 'border-purple-200' },
  viewpoint:   { emoji: '🔭', label: 'Vidikovac',        color: 'bg-violet-100 text-violet-700',  border: 'border-violet-200' },
  museum:      { emoji: '🏺', label: 'Muzej',             color: 'bg-fuchsia-100 text-fuchsia-700',border: 'border-fuchsia-200' },
  supermarket: { emoji: '🛒', label: 'Supermarket',       color: 'bg-teal-100 text-teal-700',      border: 'border-teal-200' },
  pharmacy:    { emoji: '💊', label: 'Apoteka',           color: 'bg-rose-100 text-rose-700',      border: 'border-rose-200' },
  stop:        { emoji: '📍', label: 'Stanica',           color: 'bg-primary/10 text-primary',     border: 'border-primary/20' },
  park:        { emoji: '🌳', label: 'Park',              color: 'bg-green-100 text-green-700',    border: 'border-green-200' },
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
  const user = useAuthStore(s => s.user)
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
  const { fetchPOIs, pois, loading: poisLoading, error: poisError } = useGeoapify()
  const { buildSuggestions, suggestions, loading: smartLoading } = useSmartStops()

  // How many stop suggestions the user wants
  const [wantedStops, setWantedStops] = useState(3)

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

  // Fetch POIs when route is available — pass ALL category keys
  useEffect(() => {
    if (routeData?.geometry && step === 1) {
      fetchPOIs(routeData.geometry.coordinates, Object.keys(poiCategories))
    }
  }, [routeData?.geometry, step])

  // Build smart stop suggestions once we have both route AND POIs
  useEffect(() => {
    if (routeData?.geometry && pois.length > 0 && step === 1) {
      buildSuggestions(routeData.geometry.coordinates, pois, routeData.totalDistance, wantedStops)
    }
  }, [pois, routeData?.geometry, step, wantedStops])

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

  const [showSaveModal, setShowSaveModal] = useState(false)

  function handleSave() {
    if (!user) { setShowSaveModal(true); return }
    doSave()
  }

  function doSave() {
    if (isEditing) {
      updateTrip(id, form, user?.id)
      navigate(`/trips/${id}`)
    } else {
      const newId = crypto.randomUUID()
      addTrip({ ...form, id: newId }, user?.id)
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

          {/* Step progress — bubbles row + labels row */}
          <div>
            {/* Row 1: bubbles + connector lines */}
            <div className="flex items-center">
              {STEP_META.map((meta, i) => (
                <div key={i} className="flex items-center" style={{ flex: i < STEP_META.length - 1 ? '1' : '0 0 auto' }}>
                  <motion.div
                    animate={i === step ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, repeat: i === step ? Infinity : 0, repeatDelay: 2 }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
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
                        {i === step ? meta.icon : <span className="text-sm font-bold">{i + 1}</span>}
                      </div>
                    )}
                  </motion.div>
                  {i < STEP_META.length - 1 && (
                    <div className="flex-1 h-1 rounded-full bg-border mx-1.5 overflow-hidden">
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
            {/* Row 2: labels — desktop only, aligned under each bubble */}
            <div className="hidden sm:flex mt-1.5">
              {STEP_META.map((meta, i) => (
                <div
                  key={i}
                  className="flex items-start"
                  style={{ flex: i < STEP_META.length - 1 ? '1' : '0 0 auto' }}
                >
                  <span className={`text-[10px] font-semibold w-10 text-center leading-tight ${
                    i === step ? 'text-text' : i < step ? 'text-success' : 'text-muted'
                  }`}>
                    {t(meta.key)}
                  </span>
                </div>
              ))}
            </div>
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
              suggestions={suggestions}
              smartLoading={smartLoading}
              routeLoading={routeLoading}
              poisLoading={poisLoading}
              poisError={poisError}
              wantedStops={wantedStops}
              onWantedStopsChange={setWantedStops}
              onAddStop={handleAddStop}
              onRemoveStop={handleRemoveStop}
              onNoteChange={handleNoteChange}
              onReorderStops={(stops) => updateForm('stops', stops)}
              onRetryPOIs={() => form.route?.geometry && fetchPOIs(form.route.geometry.coordinates, Object.keys(poiCategories))}
            />
          )}
          {step === 2 && <StepPacking key="packing" form={form} setForm={setForm} />}
          {step === 3 && <StepBudget key="budget" form={form} setForm={setForm} />}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pb-8">
          <button
            onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            disabled={step === 0}
            className="px-6 py-3 rounded-xl font-semibold text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('back')}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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

      {/* Save → login modal */}
      <AnimatePresence>
        {showSaveModal && (
          <SaveAuthModal
            onClose={() => setShowSaveModal(false)}
            onSuccess={() => { setShowSaveModal(false); doSave() }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================
   Save Auth Modal
   ============================================ */
function SaveAuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signIn, signUp, signInWithGoogle } = useAuthStore()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (tab === 'signin') {
        await signIn(email, password)
        onSuccess()
      } else {
        await signUp(email, password)
        setError('Potvrdi email pa se prijavi!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // OAuth redirect — trip will be saved after redirect
    } catch (err) {
      setError(err.message)
      setGoogleLoading(false)
    }
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
        className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.12),0_20px_60px_rgba(0,0,0,0.15)] p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">🔐</div>
          <h2 className="text-xl font-bold text-text" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Sačuvaj rutu
          </h2>
          <p className="text-sm text-muted mt-1">Prijavi se da sačuvaš svoju avanturu</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-stone-100 rounded-2xl p-1 mb-4">
          {['signin', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                tab === t ? 'bg-white text-primary shadow-[0_2px_0_rgba(0,0,0,0.06)]' : 'text-muted'
              }`}
            >
              {t === 'signin' ? 'Prijava' : 'Registracija'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-3 border-2 border-border rounded-2xl text-sm font-bold text-text hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60 mb-3"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Nastavi sa Google
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted font-semibold">ili</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm bg-background text-text placeholder:text-muted focus:outline-none focus:border-primary transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lozinka"
            required
            minLength={6}
            className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm bg-background text-text placeholder:text-muted focus:outline-none focus:border-primary transition-all"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn-clay w-full py-3 bg-primary text-white font-bold rounded-2xl text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : tab === 'signin' ? '🚀 Prijavi se i sačuvaj' : 'Registruj se'
            }
          </button>
        </form>
      </motion.div>
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
function CityInput({ label, dotColor, textColor, focusColor, confirmed, placeholder, search, query, setQuery, show, setShow, onSelect }) {
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShow(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setShow])

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${dotColor} shrink-0`} />
        <span className="text-xs font-semibold text-muted">{label}</span>
        {confirmed && (
          <span className={`text-xs font-semibold ml-auto ${textColor}`}>
            ✓ {confirmed}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= 2) {
              search.search(e.target.value)
              setShow(true)
            } else {
              search.clearResults()
              setShow(false)
            }
          }}
          onFocus={() => { if (search.results.length) setShow(true) }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 border-2 border-border rounded-xl bg-background text-text placeholder:text-muted focus:outline-none ${focusColor} transition-all`}
        />
        {search.loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
        )}
        {!search.loading && confirmed && !show && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </div>
      {show && search.results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-surface border-2 border-border rounded-xl shadow-xl max-h-52 overflow-auto">
          {search.results.map((r, i) => (
            <li key={i}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(r)
                  setQuery(r.city || r.name.split(',')[0])
                  setShow(false)
                  search.clearResults()
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-primary/5 transition-colors cursor-pointer flex items-center gap-3"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-text block truncate">{r.city || r.name.split(',')[0]}</span>
                  {r.sub && <span className="text-muted text-xs block truncate">{r.sub}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {show && search.error && (
        <div className="absolute z-50 w-full mt-1 bg-surface border-2 border-border rounded-xl shadow-xl px-4 py-3 text-xs text-red-500">
          Pretraga nije uspela. Pokušaj ponovo.
        </div>
      )}
    </div>
  )
}

function StepBasics({ form, updateForm }) {
  const startSearch = useNominatim()
  const endSearch = useNominatim()
  const [startQuery, setStartQuery] = useState(form.startCity?.city || form.startCity?.name?.split(',')[0] || '')
  const [endQuery, setEndQuery] = useState(form.endCity?.city || form.endCity?.name?.split(',')[0] || '')
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
          placeholder="Letovanje 2026 🌊"
          className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text text-lg font-semibold placeholder:text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all"
        />
      </SectionCard>

      {/* Date range */}
      <SectionCard label="📅 Datumi putovanja" accent="border-sky-200">
        <DateRangePicker
          startDate={form.startDate}
          endDate={form.endDate}
          onStartChange={(v) => updateForm('startDate', v)}
          onEndChange={(v) => updateForm('endDate', v)}
        />
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
          <CityInput
            label={t('startCity')}
            dotColor="bg-success"
            textColor="text-success"
            focusColor="focus:border-success focus:ring-2 focus:ring-success/30"
            confirmed={form.startCity ? (form.startCity.city || form.startCity.name?.split(',')[0]) : null}
            placeholder="npr. Beograd"
            search={startSearch}
            query={startQuery}
            setQuery={setStartQuery}
            show={showStartResults}
            setShow={setShowStartResults}
            onSelect={(r) => updateForm('startCity', r)}
          />

          <div className="flex items-center gap-2 pl-1">
            <div className="w-0.5 h-5 bg-border mx-1" />
            <span className="text-xs text-muted">drivin'…</span>
          </div>

          <CityInput
            label={t('destination')}
            dotColor="bg-primary"
            textColor="text-primary"
            focusColor="focus:border-primary focus:ring-2 focus:ring-primary/30"
            confirmed={form.endCity ? (form.endCity.city || form.endCity.name?.split(',')[0]) : null}
            placeholder="npr. Split"
            search={endSearch}
            query={endQuery}
            setQuery={setEndQuery}
            show={showEndResults}
            setShow={setShowEndResults}
            onSelect={(r) => updateForm('endCity', r)}
          />
        </div>
      </SectionCard>
    </motion.div>
  )
}

/* ============================================
   Stops + Discover sidebar panel
   ============================================ */
function StopsPanel({ form, pois, suggestions, smartLoading, poisLoading, poisError, wantedStops, onWantedStopsChange, onAddStop, onRemoveStop, onRetryPOIs }) {
  const [tab, setTab] = useState('preporuke')
  const [discoverFilter, setDiscoverFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const [expandedSuggestion, setExpandedSuggestion] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState({})
  const [suggPage, setSuggPage] = useState(0)

  // Reset page when suggestions pool changes or user changes wanted count
  useEffect(() => { setSuggPage(0) }, [suggestions, wantedStops])

  const visibleSuggestions = suggestions.slice(suggPage * wantedStops, (suggPage + 1) * wantedStops)

  const routeCoords = form.route?.geometry?.coordinates ?? null

  const addedNames = useMemo(
    () => new Set(form.stops.map(s => s.name)),
    [form.stops]
  )

  // Thin route coords for sorting (every 10th point) — enough precision for ordering POIs
  const thinCoords = useMemo(
    () => routeCoords ? routeCoords.filter((_, i) => i % 10 === 0) : null,
    [routeCoords]
  )

  // Exclude already-added, sort by km position along route
  const sortedPois = useMemo(() => {
    const available = pois.filter(p => !addedNames.has(p.name))
    if (!thinCoords) return available
    // Pre-compute km for each POI once, then sort — avoids O(n log n) calls to getRouteKm
    const withKm = available.map(p => ({ p, km: getRouteKm(p.lat, p.lng, thinCoords) }))
    withKm.sort((a, b) => a.km - b.km)
    return withKm.map(({ p }) => p)
  }, [pois, addedNames, thinCoords])


  return (
    <div className="bg-surface border-2 border-orange-200 rounded-2xl overflow-hidden shadow-[0_4px_0_rgba(249,115,22,0.15)] flex flex-col" style={{ maxHeight: 'min(640px, 80vh)' }}>
      {/* Tab bar */}
      <div className="flex border-b-2 border-orange-100 shrink-0">
        <button
          onClick={() => setTab('preporuke')}
          className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer relative ${
            tab === 'preporuke' ? 'bg-orange-50 text-primary border-b-2 border-primary' : 'text-muted hover:text-text'
          }`}
        >
          ✨ Preporuke
          {smartLoading && <span className="ml-1 inline-block w-2 h-2 bg-primary rounded-full animate-ping" />}
          {!smartLoading && suggestions.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full">
              {suggestions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('route')}
          className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer ${
            tab === 'route' ? 'bg-orange-50 text-primary border-b-2 border-primary' : 'text-muted hover:text-text'
          }`}
        >
          🛣️ Ruta ({form.stops.length})
        </button>
        <button
          onClick={() => setTab('discover')}
          className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer relative ${
            tab === 'discover' ? 'bg-orange-50 text-primary border-b-2 border-primary' : 'text-muted hover:text-text'
          }`}
        >
          🔍 Otkrij
          {poisLoading && <span className="ml-1 inline-block w-2 h-2 bg-primary rounded-full animate-ping" />}
          {!poisLoading && sortedPois.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full">
              {sortedPois.length > 99 ? '99+' : sortedPois.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">

          {/* ── PREPORUKE TAB ── */}
          {tab === 'preporuke' && (
            <motion.div key="preporuke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Stop count picker — always visible */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-muted">Koliko pauza?</span>
                <div className="flex gap-1 ml-auto">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => { onWantedStopsChange(n); setSuggPage(0) }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        wantedStops === n
                          ? 'bg-primary text-white shadow-[0_2px_0_rgba(249,115,22,0.4)]'
                          : 'bg-orange-50 text-muted hover:bg-orange-100 border border-orange-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {smartLoading || poisLoading ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-text mb-1">Analiziram rutu...</p>
                  <p className="text-xs text-muted">Tražim idealna mesta za pauzu</p>
                </div>
              ) : !form.route?.geometry ? (
                <div className="text-center py-10 px-4">
                  <p className="text-4xl mb-3">🗺️</p>
                  <p className="text-sm font-bold text-text mb-1">Ruta nije izračunata</p>
                  <p className="text-xs text-muted">Dodaj polazak i odredište pa sačekaj da se ruta učita</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-4xl mb-3">🔄</p>
                  <p className="text-sm font-bold text-text mb-1">Čekam podatke o mestima...</p>
                  <p className="text-xs text-muted">Preporuke se prikazuju čim se učitaju mesta uz rutu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
                    Set {suggPage + 1} · {visibleSuggestions.length} pauze uz rutu
                  </p>

                  {visibleSuggestions.map((sug, si) => {
                    const globalIdx = suggPage * wantedStops + si
                    const isExpanded = expandedSuggestion === globalIdx
                    // Only show categories that have POIs, prioritised
                    const PRIO = ['fuel', 'restaurant', 'fast_food', 'cafe', 'hotel', 'motel', 'rest_area', 'supermarket', 'attraction', 'pharmacy']
                    const catKeys = [
                      ...PRIO.filter(k => sug.byCategory[k]?.length > 0),
                      ...Object.keys(sug.byCategory).filter(k => sug.byCategory[k]?.length > 0 && !PRIO.includes(k)),
                    ]
                    // Header shows up to 4 category icons — no counts
                    const headerCats = catKeys.slice(0, 4)

                    return (
                      <div
                        key={globalIdx}
                        className="border-2 border-orange-100 rounded-2xl overflow-hidden bg-orange-50/40"
                      >
                        {/* Stop header — click anywhere to expand */}
                        <button
                          onClick={() => setExpandedSuggestion(isExpanded ? null : globalIdx)}
                          className="w-full flex items-center gap-3 p-3 text-left cursor-pointer hover:bg-orange-50/60 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_3px_0_rgba(249,115,22,0.4)]">
                            {si + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text truncate">{sug.cityName}</p>
                            <p className="text-[10px] text-muted font-semibold">~{sug.km} km od polaska</p>
                          </div>
                          {/* Just emoji icons — no counts */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {headerCats.map(cat => (
                              <span key={cat} className="text-base">{POI_STYLE[cat]?.emoji ?? '📍'}</span>
                            ))}
                            {catKeys.length === 0 && <span className="text-xs text-muted">—</span>}
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            className="shrink-0 text-muted transition-transform duration-200"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>

                        {/* Expanded: top 1 pick per category + "X more" */}
                        {isExpanded && (
                          <div className="border-t-2 border-orange-100 p-3 space-y-1.5">
                            {catKeys.length === 0 ? (
                              <p className="text-xs text-muted text-center py-2">Nema pronađenih mesta u ovoj zoni</p>
                            ) : catKeys.map(cat => {
                              const style = POI_STYLE[cat] ?? POI_STYLE.stop
                              const items = sug.byCategory[cat]
                              const catKey = `${globalIdx}-${cat}`
                              const showAll = expandedCategory[catKey]
                              const displayed = showAll ? items : items.slice(0, 1)

                              return (
                                <div key={cat}>
                                  {displayed.map((poi, pi) => (
                                    <div key={poi.id ?? pi} className={`flex items-center gap-2 p-2 border ${style.border} bg-white rounded-xl`}>
                                      <span className="text-base shrink-0">{style.emoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-text truncate">{poi.name}</p>
                                        <p className="text-[10px] text-muted">{style.label}</p>
                                      </div>
                                      <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={() => onAddStop(poi)}
                                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                                      >
                                        +
                                      </motion.button>
                                    </div>
                                  ))}
                                  {items.length > 1 && (
                                    <button
                                      onClick={() => setExpandedCategory(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
                                      className="ml-2 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                      {showAll ? '▲ Sakrij' : `+ još ${items.length - 1} ${style.label.toLowerCase()}`}
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Give me more button */}
                  {suggestions.length > wantedStops && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSuggPage(p => (p + 1) % Math.ceil(suggestions.length / wantedStops))
                        setExpandedSuggestion(null)
                      }}
                      className="w-full py-3 border-2 border-dashed border-orange-200 rounded-2xl text-xs font-bold text-primary hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
                      </svg>
                      Daj mi još {wantedStops} pauza
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── RUTA TAB ── */}
          {tab === 'route' && (
            <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 p-2.5 mb-1 bg-success/10 border border-success/20 rounded-xl">
                <span className="w-7 h-7 bg-success rounded-full flex items-center justify-center shrink-0 text-sm">🏠</span>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wide">Polazak</p>
                  <p className="text-sm font-bold text-text">{form.startCity?.name?.split(',')[0]}</p>
                </div>
                {form.route?.totalDistance > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-muted bg-stone-100 px-2 py-1 rounded-lg">
                    0 km
                  </span>
                )}
              </div>

              {form.stops.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 px-4">
                  <p className="text-4xl mb-3">🗺️</p>
                  <p className="text-sm font-bold text-text mb-1">Nema stanica još</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Klikni na mapu da dodaš stanicu, ili pretraži mesta u tabu <strong>Otkrij</strong>
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-1 my-1.5">
                  {form.stops.map((stop, i) => {
                    const style = POI_STYLE[stop.type] ?? POI_STYLE.stop
                    const kmMark = thinCoords ? getRouteKm(stop.lat, stop.lng, thinCoords) : null
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
                          <p className="text-sm font-semibold text-text truncate">{stop.name?.split(',')[0]}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.color}`}>
                              {style.label}
                            </span>
                            {kmMark != null && (
                              <span className="text-[9px] font-bold text-muted">km {kmMark}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveStop(stop.id)}
                          className="text-muted hover:text-danger opacity-60 group-hover:opacity-100 transition-all cursor-pointer shrink-0 p-1"
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

              <div className="flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl mt-1">
                <span className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shrink-0 text-sm">🏁</span>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wide">Odredište</p>
                  <p className="text-sm font-bold text-text">{form.endCity?.name?.split(',')[0]}</p>
                </div>
                {form.route?.totalDistance > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-muted bg-stone-100 px-2 py-1 rounded-lg">
                    {Math.round(form.route.totalDistance)} km
                  </span>
                )}
              </div>

              {form.startCity?.lat && form.endCity?.lat && (
                <div className="mt-3 flex gap-2">
                  <a href={buildGoogleMapsUrl(form)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#4285F4] text-white text-xs font-bold rounded-xl shadow-[0_3px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Google Maps
                  </a>
                  <a href={buildWazeUrl(form)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#33CCFF] text-white text-xs font-bold rounded-xl shadow-[0_3px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    Waze
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* ── OTKRIJ TAB ── */}
          {tab === 'discover' && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {poisLoading ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-text mb-1">Tražim mesta uz rutu...</p>
                  <p className="text-xs text-muted">Pumpe, restorani, hoteli, odmarališta…</p>
                </div>
              ) : poisError ? (
                <div className="text-center py-10 px-4">
                  <p className="text-3xl mb-3">⚠️</p>
                  <p className="text-sm font-bold text-text mb-1">Greška pri učitavanju</p>
                  <p className="text-xs text-muted mb-4 leading-relaxed">{poisError}</p>
                  {onRetryPOIs && (
                    <button onClick={onRetryPOIs} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer">
                      Pokušaj ponovo
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* "What are you looking for?" category grid */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
                    Šta tražiš uz rutu?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { key: 'fuel',        label: 'Pumpa',      emoji: '⛽' },
                      { key: 'restaurant',  label: 'Restoran',   emoji: '🍽️' },
                      { key: 'hotel',       label: 'Hotel',      emoji: '🏨' },
                      { key: 'fast_food',   label: 'Fast food',  emoji: '🍔' },
                      { key: 'cafe',        label: 'Kafić',      emoji: '☕' },
                      { key: 'supermarket', label: 'Market',     emoji: '🛒' },
                      { key: 'rest_area',   label: 'Odmor',      emoji: '🌿' },
                      { key: 'attraction',  label: 'Atrakcija',  emoji: '🏛️' },
                      { key: 'pharmacy',    label: 'Apoteka',    emoji: '💊' },
                    ].map(({ key, label, emoji }) => {
                      const available = sortedPois.filter(p => p.category === key).length
                      const isSelected = discoverFilter === key
                      return (
                        <button
                          key={key}
                          onClick={() => { setDiscoverFilter(isSelected ? null : key); setShowAll(false) }}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : available > 0
                              ? 'bg-surface border-border text-text hover:border-primary/40'
                              : 'bg-surface/50 border-border/50 text-muted/50 cursor-not-allowed'
                          }`}
                          disabled={available === 0 && !poisLoading}
                        >
                          <span className="text-lg">{emoji}</span>
                          <span className="leading-tight text-center">{label}</span>
                          {available > 0 && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-primary/20 text-primary' : 'bg-stone-100 text-muted'}`}>
                              {available}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Results — only when a category is picked */}
                  {!discoverFilter ? (
                    <div className="text-center py-6 px-4">
                      <p className="text-2xl mb-2">👆</p>
                      <p className="text-xs text-muted">Odaberi kategoriju iznad da vidiš mesta uz rutu</p>
                    </div>
                  ) : (() => {
                    const filtered = sortedPois.filter(p => p.category === discoverFilter)
                    const shown = showAll ? filtered : filtered.slice(0, 8)
                    if (filtered.length === 0) return (
                      <p className="text-center text-xs text-muted py-4">Nema pronađenih mesta za ovu kategoriju.</p>
                    )
                    return (
                      <div className="space-y-1.5">
                        {shown.map((poi, i) => {
                          const style = POI_STYLE[poi.category] ?? POI_STYLE.stop
                          const alreadyAdded = addedNames.has(poi.name)
                          const km = thinCoords ? getRouteKm(poi.lat, poi.lng, thinCoords) : null
                          return (
                            <motion.div
                              key={poi.id ?? i}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(i * 0.03, 0.2) }}
                              className={`flex items-center gap-2.5 p-2.5 border ${style.border} bg-white rounded-xl`}
                            >
                              <span className="text-xl shrink-0">{style.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text truncate">{poi.name}</p>
                                {km != null && <p className="text-[10px] text-muted font-bold">{km} km od polaska</p>}
                              </div>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => onAddStop(poi)}
                                disabled={alreadyAdded}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all cursor-pointer shrink-0 ${
                                  alreadyAdded
                                    ? 'bg-success/20 text-success'
                                    : 'bg-primary text-white shadow-sm hover:opacity-80'
                                }`}
                              >
                                {alreadyAdded ? '✓' : '+'}
                              </motion.button>
                            </motion.div>
                          )
                        })}
                        {filtered.length > 8 && !showAll && (
                          <button
                            onClick={() => setShowAll(true)}
                            className="mt-2 w-full py-2.5 border-2 border-dashed border-border rounded-xl text-xs font-bold text-muted hover:border-primary transition-colors cursor-pointer text-xs font-bold text-muted hover:text-text"
                          >
                            + još {filtered.length - 8}
                          </button>
                        )}
                      </div>
                    )
                  })()}
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
function StepRoute({ form, pois, suggestions, smartLoading, routeLoading, poisLoading, poisError, wantedStops, onWantedStopsChange, onAddStop, onRemoveStop, onNoteChange, onReorderStops, onRetryPOIs }) {
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
          {/* Map — col 1-2 on desktop, below panel on mobile */}
          <div className="relative lg:col-span-2 lg:row-start-1 row-start-2">
            {routeLoading && (
              <div className="absolute inset-0 z-10 bg-surface/80 flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted">Računam rutu...</p>
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
              height="min(500px, 55vh)"
            />
          </div>

          {/* Stops + Discover panel — col 3 on desktop, above map on mobile */}
          <div className="lg:col-start-3 lg:row-start-1 row-start-1">
            <StopsPanel
              form={form}
              pois={pois}
              suggestions={suggestions}
              smartLoading={smartLoading}
              poisLoading={poisLoading}
              poisError={poisError}
              wantedStops={wantedStops}
              onWantedStopsChange={onWantedStopsChange}
              onAddStop={onAddStop}
              onRemoveStop={onRemoveStop}
              onRetryPOIs={onRetryPOIs}
            />
          </div>
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

  /** When user types a new total → distribute by fixed default percentages.
   *  This guarantees ALL 5 categories always get a share, regardless of
   *  what the user previously entered in individual fields. */
  function handleTotalChange(rawValue) {
    const total = parseFloat(rawValue) || 0
    const keys = Object.keys(CATEGORY_META)
    const newCategories = {}
    let allocated = 0
    keys.forEach((k, i) => {
      if (i < keys.length - 1) {
        newCategories[k] = Math.round(total * CATEGORY_META[k].defaultPct)
        allocated += newCategories[k]
      } else {
        // Last category gets the rounding remainder so sum == total
        newCategories[k] = Math.max(0, Math.round(total - allocated))
      }
    })
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
