import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
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
import useCuratedStops from '../hooks/useCuratedStops'
import { track } from '../lib/analytics'
import { detectCorridor } from '../utils/corridors'
import TripTimeline from '../components/Timeline/TripTimeline'

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
  Dokumenti:              { dot: 'bg-blue-500',   gradient: 'from-blue-50 to-blue-100',     badge: 'bg-blue-100 text-blue-700' },
  Deca:                   { dot: 'bg-pink-500',   gradient: 'from-pink-50 to-pink-100',     badge: 'bg-pink-100 text-pink-700' },
  Garderoba:              { dot: 'bg-purple-500', gradient: 'from-purple-50 to-purple-100', badge: 'bg-purple-100 text-purple-700' },
  Auto:                   { dot: 'bg-gray-500',   gradient: 'from-gray-50 to-gray-100',     badge: 'bg-gray-100 text-gray-700' },
  'Hrana i piće':         { dot: 'bg-amber-500',  gradient: 'from-amber-50 to-amber-100',   badge: 'bg-amber-100 text-amber-700' },
  Zabava:                 { dot: 'bg-green-500',  gradient: 'from-green-50 to-green-100',   badge: 'bg-green-100 text-green-700' },
  'Toaletne potrepštine': { dot: 'bg-teal-500',   gradient: 'from-teal-50 to-teal-100',     badge: 'bg-teal-100 text-teal-700' },
  Ostalo:                 { dot: 'bg-orange-500', gradient: 'from-orange-50 to-orange-100', badge: 'bg-orange-100 text-orange-700' },
}
function getPackingCatStyle(cat) {
  return PACKING_CAT_STYLE[cat] ?? PACKING_CAT_STYLE.Ostalo
}

/* POI category display meta */
const POI_STYLE = {
  fuel:        { dot: 'bg-stone-500',    label: 'Pumpa',           color: 'bg-stone-100 text-stone-700',    border: 'border-stone-200' },
  car_wash:    { dot: 'bg-sky-500',      label: 'Autopraonica',    color: 'bg-sky-100 text-sky-700',        border: 'border-sky-200' },
  rest_area:   { dot: 'bg-green-500',    label: 'Odmaralište',     color: 'bg-green-100 text-green-700',    border: 'border-green-200' },
  services:    { dot: 'bg-indigo-500',   label: 'Servisna stanica',color: 'bg-indigo-100 text-indigo-700',  border: 'border-indigo-200' },
  picnic_site: { dot: 'bg-lime-500',     label: 'Piknik',          color: 'bg-lime-100 text-lime-700',      border: 'border-lime-200' },
  restaurant:  { dot: 'bg-amber-500',    label: 'Restoran',        color: 'bg-amber-100 text-amber-700',    border: 'border-amber-200' },
  fast_food:   { dot: 'bg-red-500',      label: 'Fast food',       color: 'bg-red-100 text-red-700',        border: 'border-red-200' },
  cafe:        { dot: 'bg-yellow-500',   label: 'Kafić',           color: 'bg-yellow-100 text-yellow-700',  border: 'border-yellow-200' },
  hotel:       { dot: 'bg-blue-500',     label: 'Hotel',           color: 'bg-blue-100 text-blue-700',      border: 'border-blue-200' },
  motel:       { dot: 'bg-blue-400',     label: 'Motel',           color: 'bg-blue-50 text-blue-600',       border: 'border-blue-100' },
  hostel:      { dot: 'bg-cyan-500',     label: 'Hostel',          color: 'bg-cyan-100 text-cyan-700',      border: 'border-cyan-200' },
  camp_site:   { dot: 'bg-emerald-500',  label: 'Kamp',            color: 'bg-emerald-100 text-emerald-700',border: 'border-emerald-200' },
  attraction:  { dot: 'bg-purple-500',   label: 'Atrakcija',       color: 'bg-purple-100 text-purple-700',  border: 'border-purple-200' },
  viewpoint:   { dot: 'bg-violet-500',   label: 'Vidikovac',       color: 'bg-violet-100 text-violet-700',  border: 'border-violet-200' },
  museum:      { dot: 'bg-fuchsia-500',  label: 'Muzej',           color: 'bg-fuchsia-100 text-fuchsia-700',border: 'border-fuchsia-200' },
  supermarket: { dot: 'bg-teal-500',     label: 'Supermarket',     color: 'bg-teal-100 text-teal-700',      border: 'border-teal-200' },
  pharmacy:    { dot: 'bg-rose-500',     label: 'Apoteka',         color: 'bg-rose-100 text-rose-700',      border: 'border-rose-200' },
  stop:        { dot: 'bg-primary',      label: 'Stanica',  color: 'bg-primary/10 text-primary',     border: 'border-primary/20' },
  park:        { dot: 'bg-green-500',   label: 'Park',     color: 'bg-green-100 text-green-700',    border: 'border-green-200' },
}

const TRIP_INTERESTS = [
  { key: 'hrana',    label: 'Hrana',    poiKeys: ['restaurant', 'fast_food', 'cafe'],             curatedKeys: ['food', 'restaurant'] },
  { key: 'gorivo',   label: 'Gorivo',   poiKeys: ['fuel', 'car_wash', 'services', 'rest_area'],   curatedKeys: [] },
  { key: 'smestaj',  label: 'Smeštaj',  poiKeys: ['hotel', 'motel', 'hostel', 'camp_site'],       curatedKeys: ['accommodation'] },
  { key: 'kultura',  label: 'Kultura',  poiKeys: ['attraction', 'museum'],                         curatedKeys: ['culture', 'history', 'monastery', 'museum'] },
  { key: 'priroda',  label: 'Priroda',  poiKeys: ['viewpoint', 'picnic_site'],                    curatedKeys: ['nature', 'national_park', 'waterfall'] },
  { key: 'plaze',    label: 'Plaže',    poiKeys: [],                                               curatedKeys: ['beach'] },
  { key: 'kupovina', label: 'Kupovina', poiKeys: ['supermarket'],                                  curatedKeys: [] },
  { key: 'zdravlje', label: 'Zdravlje', poiKeys: ['pharmacy'],                                     curatedKeys: ['wellness'] },
]

function filterByInterests(pois, curatedStops, interests) {
  if (!interests || interests.length === 0) return { pois, curatedStops }
  const allowedPoi = new Set(interests.flatMap(k => TRIP_INTERESTS.find(i => i.key === k)?.poiKeys ?? []))
  const allowedCurated = new Set(interests.flatMap(k => TRIP_INTERESTS.find(i => i.key === k)?.curatedKeys ?? []))
  return {
    pois: pois.filter(p => allowedPoi.has(p.category)),
    curatedStops: curatedStops.filter(s => allowedCurated.has(s.category)),
  }
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
  const [form, setForm] = useState(() => {
    const base = {
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
      interests: [],
      style: 'easy',
      kidsMinAge: null,
      departureTime: '07:00',
    }
    try {
      const fork = localStorage.getItem('drumko_fork_trip')
      if (fork) {
        const { startCity, endCity, stops } = JSON.parse(fork)
        localStorage.removeItem('drumko_fork_trip')
        return { ...base, startCity: startCity || null, endCity: endCity || null, stops: stops || [] }
      }
    } catch (_) {}
    return base
  })

  // Load existing trip data if editing
  useEffect(() => {
    if (existingTrip) {
      setForm(existingTrip)
    }
  }, [existingTrip])

  // Routing
  const { fetchRoute, route: routeData, loading: routeLoading, error: routeError } = useOSRM()
  const { fetchPOIs, pois, loading: poisLoading, error: poisError } = useGeoapify()
  const { stops: curatedStops, fetchAlongRoute: fetchCuratedStops } = useCuratedStops()

  const corridor = useMemo(
    () => detectCorridor(form.startCity?.name, form.endCity?.name),
    [form.startCity, form.endCity]
  )

  const departureIso = useMemo(() => {
    if (!form.startDate) return new Date().toISOString()
    const t = form.departureTime || '07:00'
    return new Date(`${form.startDate}T${t}:00`).toISOString()
  }, [form.startDate, form.departureTime])

  const { suggestions, narrative, loading: smartLoading } = useSmartStops({
    routeGeometry: routeData?.geometry?.coordinates,
    totalDistanceKm: routeData?.totalDistance,
    totalDurationSec: routeData?.totalDuration,
    departureIso,
    adults: form.adults,
    kids: form.children,
    kidsMinAge: form.kidsMinAge,
    style: form.style,
    corridor,
    geoapifyPois: pois,
  })

  // How many stop suggestions the user wants
  const [wantedStops, setWantedStops] = useState(3)

  // Which stop is focused (map pans to it)
  const [focusedStopLatLng, setFocusedStopLatLng] = useState(null)

  function handleFocusStop(stop) {
    if (stop?.lat && stop?.lng) setFocusedStopLatLng({ lat: stop.lat, lng: stop.lng })
  }

  // Auto-fill trip name when both cities are selected and user hasn't typed anything
  useEffect(() => {
    if (form.startCity?.name && form.endCity?.name && !form.name) {
      const start = form.startCity.name.split(',')[0].trim()
      const end = form.endCity.name.split(',')[0].trim()
      updateForm('name', `${start} → ${end}`)
    }
  }, [form.startCity, form.endCity])

  // Debounced route fetch — avoids hammering OSRM on every stop add/remove/reorder
  const routeDebounceRef = useRef(null)
  useEffect(() => {
    if (!form.startCity?.lat || !form.endCity?.lat) return
    clearTimeout(routeDebounceRef.current)
    routeDebounceRef.current = setTimeout(async () => {
      const result = await fetchRoute([form.startCity, ...form.stops, form.endCity])
      if (result) {
        track('route_planned', {
          origin_city: form.startCity?.name?.split(',')[0]?.trim() ?? null,
          destination_city: form.endCity?.name?.split(',')[0]?.trim() ?? null,
          total_km: Math.round(result.totalDistance),
          total_min: Math.round(result.totalDuration / 60),
          departure_iso: form.startDate ?? null,
          adults: form.adults ?? null,
          kids_count: form.children ?? null,
          waypoint_count: form.stops?.length ?? 0,
        })
      }
    }, 300)
    return () => clearTimeout(routeDebounceRef.current)
  }, [form.startCity, form.endCity, form.stops, fetchRoute])

  // Update form with route data
  useEffect(() => {
    if (routeData) {
      setForm(prev => ({
        ...prev,
        route: routeData,
      }))
    }
  }, [routeData])

  // Fetch POIs + curated stops as soon as route is ready
  useEffect(() => {
    if (routeData?.geometry) {
      fetchPOIs(routeData.geometry.coordinates, Object.keys(poiCategories))
      fetchCuratedStops(routeData.geometry.coordinates)
    }
  }, [routeData?.geometry])

  // Suggestions now derive automatically from useSmartStops inputs — no manual trigger needed.

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

  function handleReorderStops(newStops) {
    setForm(prev => ({ ...prev, stops: newStops }))
  }

  function handleNoteChange(stopId, note) {
    setForm(prev => ({
      ...prev,
      stops: prev.stops.map(s => s.id === stopId ? { ...s, note } : s),
    }))
  }

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const GUEST_TRIP_LIMIT = 3

  function handleSave() {
    if (!user) {
      const guestCount = isEditing ? trips.length : trips.length
      if (!isEditing && guestCount >= GUEST_TRIP_LIMIT) {
        setShowSaveModal(true)
        return
      }
      doSave()
      return
    }
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

  function validationMessage() {
    if (step !== 0) return null
    if (!form.startCity && !form.endCity) return 'Izaberi početni grad i odredište'
    if (!form.startCity) return 'Izaberi početni grad'
    if (!form.endCity) return 'Izaberi odredište'
    if (!form.name) return 'Unesi naziv putovanja'
    return null
  }

  function handleNext() {
    if (!canProceed()) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* ── Glass header ── */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                if (step > 0) { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
                else navigate(-1)
              }}
              aria-label="Nazad"
              className="w-9 h-9 rounded-xl border border-border bg-surface/80 hover:border-secondary/40 hover:bg-secondary/5 flex items-center justify-center transition-all cursor-pointer shrink-0 text-muted hover:text-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-base font-bold text-text leading-none">
                {isEditing ? t('editTrip') : t('newTrip')}
              </h1>
              <p className="text-[11px] text-muted mt-0.5 font-medium">
                Korak {step + 1} / {STEPS.length}
              </p>
            </div>
            <LanguageToggle />
          </div>

          {/* Step stepper */}
          <div className="grid grid-cols-4">
            {STEP_META.map((meta, i) => (
              <div key={i} className="flex flex-col items-center relative">
                {/* Left connector */}
                {i > 0 && (
                  <div className="absolute left-0 right-1/2 top-5 h-1 -translate-y-1/2 bg-border rounded-full overflow-hidden">
                    <motion.div className="h-full bg-success rounded-full" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.45, ease: 'easeInOut' }} />
                  </div>
                )}
                {/* Right connector */}
                {i < STEP_META.length - 1 && (
                  <div className="absolute left-1/2 right-0 top-5 h-1 -translate-y-1/2 bg-border rounded-full overflow-hidden">
                    <motion.div className="h-full bg-success rounded-full" initial={false} animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.45, ease: 'easeInOut' }} />
                  </div>
                )}
                {/* Bubble */}
                <motion.div
                  className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 mb-1.5 ${
                    i < step
                      ? 'bg-success shadow-[0_3px_0_rgba(34,197,94,0.3),0_4px_12px_rgba(34,197,94,0.2)]'
                      : i === step
                      ? `${meta.iconBg} shadow-[0_3px_0_rgba(0,0,0,0.14),0_4px_16px_rgba(0,0,0,0.12)]`
                      : 'bg-slate-100 border border-border'
                  }`}
                  animate={i === step ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                  transition={{ duration: 2, repeat: i === step ? Infinity : 0, repeatDelay: 3 }}
                >
                  {i < step ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <div className={i === step ? 'text-white' : 'text-muted'}>
                      {i === step ? meta.icon : <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                  )}
                </motion.div>
                {/* Label */}
                <span className={`text-[10px] font-semibold leading-tight text-center hidden sm:block ${
                  i === step ? 'text-text' : i < step ? 'text-success' : 'text-muted/50'
                }`}>
                  {t(meta.key)}
                </span>
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
              curatedStops={curatedStops}
              suggestions={suggestions}
              narrative={narrative}
              smartLoading={smartLoading}
              routeLoading={routeLoading}
              routeError={routeError}
              poisLoading={poisLoading}
              poisError={poisError}
              wantedStops={wantedStops}
              onWantedStopsChange={setWantedStops}
              onAddStop={handleAddStop}
              onRemoveStop={handleRemoveStop}
              onNoteChange={handleNoteChange}
              onReorderStops={(stops) => updateForm('stops', stops)}
              onUpdateCity={(key, val) => updateForm(key, val)}
              onRetryPOIs={() => form.route?.geometry && fetchPOIs(form.route.geometry.coordinates, Object.keys(poiCategories))}
              onNext={() => { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              focusedStopLatLng={focusedStopLatLng}
              onFocusStop={handleFocusStop}
            />
          )}
          {step === 2 && <StepPacking key="packing" form={form} setForm={setForm} />}
          {step === 3 && <StepBudget key="budget" form={form} setForm={setForm} />}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 pb-10 space-y-3">
          {/* Validation banner */}
          <AnimatePresence>
            {showValidation && validationMessage() && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2.5 bg-danger/8 border border-danger/25 rounded-xl px-4 py-2.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-sm font-semibold text-danger">{validationMessage()}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => { setShowValidation(false); setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-semibold text-muted hover:text-text border border-border hover:border-secondary/30 hover:bg-secondary/5 transition-all cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              {t('back')}
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleNext}
              className="btn-clay flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-xl cursor-pointer"
            >
              {t('next')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleSave}
              className="btn-clay flex items-center gap-2 px-8 py-3.5 bg-success text-white font-bold rounded-xl cursor-pointer glow-green"
              style={{ boxShadow: '0 6px 0 rgba(34,197,94,0.3), 0 8px 24px rgba(34,197,94,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              {isEditing ? t('saveChanges') : t('save')}
            </motion.button>
          )}
          </div>
        </div>
      </main>

      {/* Save → login modal */}
      <AnimatePresence>
        {showSaveModal && (
          <SaveAuthModal
            onClose={() => setShowSaveModal(false)}
            onSuccess={() => { setShowSaveModal(false); doSave() }}
            formData={form}
            limitReached
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================
   Save Auth Modal
   ============================================ */
function SaveAuthModal({ onClose, onSuccess, formData, limitReached }) {
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
      if (formData) localStorage.setItem('drumko_pending_trip', JSON.stringify(formData))
      await signInWithGoogle()
      // OAuth redirect — trip will be restored in App.jsx after redirect
    } catch (err) {
      localStorage.removeItem('drumko_pending_trip')
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
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {limitReached ? 'Limit dostignut' : 'Sačuvaj rutu'}
          </h2>
          <p className="text-sm text-muted mt-1">
            {limitReached
              ? 'Možeš čuvati do 3 putovanja bez naloga. Registruj se za neograničen broj.'
              : 'Prijavi se da sačuvaš svoju avanturu'}
          </p>
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
              : tab === 'signin' ? 'Prijavi se i sačuvaj' : 'Registruj se'
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

  // Map step index to aurora-style gradient
  const bannerGradients = [
    'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 50%, #7DD3FC 100%)',  // Sky — Basics
    'linear-gradient(135deg, #FB923C 0%, #F97316 50%, #FDBA74 100%)',  // Orange — Route
    'linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #FDE68A 100%)',  // Amber — Packing
    'linear-gradient(135deg, #4ADE80 0%, #22C55E 50%, #86EFAC 100%)',  // Green — Budget
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 mb-6 flex items-center gap-4 relative overflow-hidden"
      style={{ background: bannerGradients[stepIndex] }}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 opacity-25" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />

      {/* Icon */}
      <div className="relative w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.12)] shrink-0 border border-white/40">
        {meta.icon}
      </div>

      {/* Text */}
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
          Korak {stepIndex + 1} / {STEPS.length}
        </p>
        <h2 className="text-2xl font-semibold text-white leading-tight drop-shadow-sm" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          {t(meta.key)}
        </h2>
        <p className="text-sm text-white/80 font-medium">{meta.tagline[lang] ?? meta.tagline.en}</p>
      </div>
    </motion.div>
  )
}

/* Reusable premium section card */
function SectionCard({ label, children, accent = '' }) {
  return (
    <div
      className="bg-surface rounded-2xl p-4"
      style={{
        border: `1.5px solid ${accent ? 'rgba(14,165,233,0.18)' : 'rgba(226,232,240,0.9)'}`,
        boxShadow: '0 2px 0 rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.05)',
      }}
    >
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">{label}</p>
      )}
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
        <ul
          className="absolute z-50 w-full mt-1.5 bg-surface rounded-2xl overflow-auto max-h-52"
          style={{
            border: '1.5px solid rgba(14,165,233,0.2)',
            boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
          }}
        >
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
                className="w-full text-left px-4 py-2.5 hover:bg-secondary/5 transition-colors cursor-pointer flex items-center gap-3"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" className="shrink-0">
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
          placeholder="Letovanje 2026"
          className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-text text-lg font-semibold placeholder:text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all"
        />
      </SectionCard>

      {/* Date range */}
      <SectionCard label="Datumi putovanja" accent="border-sky-200">
        <DateRangePicker
          startDate={form.startDate}
          endDate={form.endDate}
          onStartChange={(v) => updateForm('startDate', v)}
          onEndChange={(v) => updateForm('endDate', v)}
        />
      </SectionCard>

      {/* Travelers */}
      <SectionCard label="Putnici" accent="border-sky-200">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t('adults'), key: 'adults', min: 1 },
            { label: t('children'), key: 'children', min: 0 },
          ].map(({ label, key, min }) => (
            <div key={key}>
              <p className="text-xs font-semibold text-muted mb-2">{label}</p>
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

      {/* Interests */}
      <SectionCard label="Šta vam je važno na putu?" accent="border-sky-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted">Prilagodićemo preporuke na mapi</p>
          <AnimatePresence>
            {(form.interests || []).length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => updateForm('interests', [])}
                className="text-[11px] font-bold text-muted hover:text-danger transition-colors cursor-pointer"
              >
                Obriši sve
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRIP_INTERESTS.map(({ key, label }) => {
            const selected = (form.interests || []).includes(key)
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  const cur = form.interests || []
                  updateForm('interests', selected ? cur.filter(k => k !== key) : [...cur, key])
                }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                  selected
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-surface text-muted hover:border-secondary/30 hover:text-text'
                }`}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
      </SectionCard>

      {/* Travel style + departure hour + kids age */}
      <SectionCard label="Kako planiraš putovanje?" accent="border-sky-200">
        <p className="text-xs text-muted mb-3">Ovo nam pomaže da odredimo ritam pauza</p>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Stil</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'fast',    label: 'Brzo',         hint: 'manje pauza' },
                { key: 'easy',    label: 'Ležerno',      hint: 'standard' },
                { key: 'explore', label: 'Istraživanje', hint: 'češće pauze' },
              ].map(opt => {
                const selected = (form.style ?? 'easy') === opt.key
                return (
                  <motion.button
                    key={opt.key}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => updateForm('style', opt.key)}
                    className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-muted hover:border-secondary/30'
                    }`}
                  >
                    {opt.label}
                    <span className="block text-[10px] font-normal text-muted">{opt.hint}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Polazak (sat)</p>
            <input
              type="time"
              value={form.departureTime ?? '07:00'}
              onChange={(e) => updateForm('departureTime', e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border-2 border-border rounded-xl bg-background text-text text-base font-semibold focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all"
            />
          </div>

          {form.children > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Uzrast najmlađeg deteta</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: 2,  label: '0–2' },
                  { val: 5,  label: '3–5' },
                  { val: 12, label: '6–12' },
                  { val: 17, label: '13–18' },
                ].map(opt => {
                  const selected = form.kidsMinAge === opt.val
                  return (
                    <motion.button
                      key={opt.val}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => updateForm('kidsMinAge', opt.val)}
                      className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-muted hover:border-secondary/30'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Route */}
      <SectionCard label="Ruta" accent="border-sky-200">
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
   Route node (start / end)
   ============================================ */
function RouteNode({ isStart, name }) {
  return (
    <div className="flex items-center gap-3 mb-2">
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
        <p className="text-sm font-bold text-text">{name || '...'}</p>
      </div>
    </div>
  )
}

/* ============================================
   Segment gap with inline suggestions
   ============================================ */
function SegmentGap({ segKm, suggestions, onAddSuggestion, loading }) {
  return (
    <div className="flex gap-3 my-1">
      <div className="flex flex-col items-center w-9 shrink-0">
        <div className="w-0.5 flex-1 border-l-2 border-dashed border-stone-200 min-h-[28px]" />
      </div>
      <div className="flex-1 py-1 min-w-0">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-xs text-muted">Tražim pauze...</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {segKm != null && segKm > 0 && (
              <span className="text-[10px] text-muted font-semibold shrink-0">{segKm} km</span>
            )}
            {suggestions.map((sug) => (
              <motion.button
                key={sug.cityName}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAddSuggestion(sug)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border-2 border-primary/20 bg-primary/8 text-primary hover:bg-primary/15 transition-colors cursor-pointer shrink-0"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {sug.cityName}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================
   Sortable route stop
   ============================================ */
function SortableRouteStop({ stop, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })
  const style = POI_STYLE[stop.type] ?? POI_STYLE.stop

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-3 mb-2"
    >
      <div
        {...attributes}
        {...listeners}
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-stone-50 border-2 border-border cursor-grab active:cursor-grabbing touch-none"
        aria-label="Premesti stanicu"
      >
        <svg width="10" height="14" viewBox="0 0 10 18" fill="#D1D5DB">
          <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="2.5" cy="9" r="1.5"/><circle cx="2.5" cy="15.5" r="1.5"/>
          <circle cx="7.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="9" r="1.5"/><circle cx="7.5" cy="15.5" r="1.5"/>
        </svg>
      </div>
      <div className={`flex-1 flex items-center gap-2.5 border-2 ${style.border} bg-white rounded-xl px-3 py-2.5`}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text truncate">{stop.name?.split(',')[0]}</p>
          <p className="text-[10px] font-semibold text-muted">{style.label}</p>
        </div>
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Ukloni stanicu"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ============================================
   Route Builder Panel — unified stop management
   ============================================ */
function RouteBuilderPanel({ form, pois, suggestions, narrative, smartLoading, routeLoading, poisLoading, onAddStop, onRemoveStop, onReorderStops, onFocusStop }) {
  const stopSearch = useNominatim()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (searchQuery.length > 1) {
      stopSearch.search(searchQuery)
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, [searchQuery])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = form.stops.findIndex(s => s.id === active.id)
    const newIndex = form.stops.findIndex(s => s.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) onReorderStops(arrayMove(form.stops, oldIndex, newIndex))
  }

  const routeCoords = form.route?.geometry?.coordinates ?? null
  const thinCoords = useMemo(
    () => routeCoords ? routeCoords.filter((_, i) => i % 10 === 0) : null,
    [routeCoords]
  )
  const addedNames = useMemo(() => new Set(form.stops.map(s => s.name)), [form.stops])

  const stopsWithKm = useMemo(() => {
    if (!thinCoords) return form.stops.map(s => ({ ...s, km: null }))
    return form.stops.map(s => ({ ...s, km: Math.round(getRouteKm(s.lat, s.lng, thinCoords)) }))
  }, [form.stops, thinCoords])

  const totalKm = form.route?.totalDistance ? Math.round(form.route.totalDistance) : null
  const totalDur = form.route?.totalDuration || 0
  const durH = Math.floor(totalDur / 3600)
  const durM = Math.floor((totalDur % 3600) / 60)

  function addSearchResult(result) {
    onAddStop({
      id: crypto.randomUUID(),
      name: result.name,
      lat: result.lat,
      lng: result.lng,
      type: 'stop',
      category: 'stop',
      note: '',
      arrivalTime: '',
    })
    setSearchQuery('')
    setShowResults(false)
    stopSearch.clearResults()
    inputRef.current?.blur()
  }

  function getGapSuggestions(fromKm, toKm) {
    return suggestions
      .filter(s => {
        const km = s.km
        return km > (fromKm ?? 0) && km < (toKm ?? Infinity) && !addedNames.has(s.cityName)
      })
      .slice(0, 3)
  }

  function addSuggestion(sug) {
    onAddStop({
      id: `city-${sug.lat}-${sug.lng}`,
      name: sug.cityName,
      lat: sug.lat,
      lng: sug.lng,
      type: 'stop',
      category: 'stop',
      note: '',
      arrivalTime: '',
    })
  }

  const hasRoute = form.startCity?.lat && form.endCity?.lat
  const startName = form.startCity?.city || form.startCity?.name?.split(',')[0]
  const endName = form.endCity?.city || form.endCity?.name?.split(',')[0]

  return (
    <div className="flex flex-col h-full">

      {/* Search bar */}
      <div className="p-3 shrink-0 border-b border-border/50" ref={searchRef}>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length > 1 && setShowResults(true)}
            placeholder="Dodaj grad ili stanicu..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowResults(false); stopSearch.clearResults() }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center text-muted hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}

          <AnimatePresence>
            {showResults && stopSearch.results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border-2 border-border shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
              >
                {stopSearch.results.slice(0, 6).map((result, i) => (
                  <button
                    key={i}
                    onClick={() => addSearchResult(result)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors cursor-pointer text-left border-b border-border/50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate">{result.city || result.name?.split(',')[0]}</p>
                      {result.sub && <p className="text-[10px] text-muted truncate">{result.sub}</p>}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Route timeline */}
      <div className="flex-1 overflow-y-auto">
        <TripTimeline
          suggestions={suggestions}
          confirmedStops={stopsWithKm}
          startCity={form.startCity}
          endCity={form.endCity}
          narrative={narrative}
          loading={smartLoading && !routeLoading}
          totalDurationSec={form.route?.totalDuration || 0}
          totalKm={totalKm || 0}
          onAcceptSuggestion={onAddStop}
          onRemoveConfirmed={onRemoveStop}
          onFocus={onFocusStop}
        />
      </div>

      {/* Stats + nav apps */}
      {hasRoute && totalKm && (
        <div className="shrink-0 border-t border-border/50 p-3 space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'km', value: totalKm },
              { label: 'Vožnja', value: durH > 0 ? `${durH}h ${durM}m` : `${durM}min` },
              { label: 'Stanice', value: form.stops.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-stone-50 rounded-xl p-2 text-center border border-border/50">
                <p className="text-xs font-bold text-text">{value}</p>
                <p className="text-[10px] text-muted font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {form.startCity?.lat && form.endCity?.lat && (
            <div className="flex gap-2">
              <a
                href={buildGoogleMapsUrl(form)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#4285F4] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Google Maps
              </a>
              <a
                href={buildWazeUrl(form)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#33CCFF] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                Waze
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================
   Mobile Bottom Drawer — route step
   ============================================ */
function MobileBottomDrawer({ form, pois, suggestions, narrative, smartLoading, routeLoading, poisLoading, onAddStop, onRemoveStop, onReorderStops, onFocusStop, onNext }) {
  const [open, setOpen] = useState(false)

  const totalKm = form.route?.totalDistance ? Math.round(form.route.totalDistance) : null
  const totalDur = form.route?.totalDuration || 0
  const durH = Math.floor(totalDur / 3600)
  const durM = Math.floor((totalDur % 3600) / 60)
  const hasRoute = form.startCity?.lat && form.endCity?.lat

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl flex flex-col overflow-hidden"
      style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.14), 0 -1px 0 rgba(0,0,0,0.05)', zIndex: 10 }}
      animate={{ height: open ? '65dvh' : '68px' }}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
    >
      {/* Handle + mini stats strip */}
      <div className="shrink-0">
        <button
          className="w-full flex items-center justify-center pt-2.5 pb-1 cursor-pointer"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Zatvori panel' : 'Otvori panel'}
        >
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </button>

        {!open && (
          <div className="flex items-center gap-3 px-4 pb-2.5">
            {hasRoute && totalKm ? (
              <>
                <button className="flex-1 flex items-center gap-2.5 min-w-0 py-0.5" onClick={() => setOpen(true)}>
                  <span className="text-sm font-bold text-text">{totalKm} km</span>
                  <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                  <span className="text-sm font-bold text-text">{durH > 0 ? `${durH}h ${durM}m` : `${durM}min`}</span>
                  <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                  <span className="text-sm font-bold text-text truncate">{form.stops.length} stan.</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" className="shrink-0">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </button>
                <button
                  onClick={onNext}
                  className="shrink-0 flex items-center gap-1 pl-3 border-l border-border/60 text-sm font-bold text-primary cursor-pointer py-0.5"
                >
                  Nastavi
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </>
            ) : (
              <button className="flex-1 text-left py-0.5" onClick={() => setOpen(true)}>
                <p className="text-xs font-semibold text-muted">
                  {hasRoute
                    ? (routeLoading ? 'Računam rutu...' : 'Otvori za stanice ↑')
                    : 'Unesi polazak i odredište ↑'}
                </p>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full RouteBuilderPanel — always rendered, hidden by overflow */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <RouteBuilderPanel
          form={form}
          pois={pois}
          suggestions={suggestions}
          narrative={narrative}
          smartLoading={smartLoading}
          routeLoading={routeLoading}
          poisLoading={poisLoading}
          onAddStop={onAddStop}
          onRemoveStop={onRemoveStop}
          onReorderStops={onReorderStops}
          onFocusStop={onFocusStop}
        />
      </div>
    </motion.div>
  )
}

/* ============================================
   STEP 2: Route & Stops
   ============================================ */
function StepRoute({ form, pois, curatedStops, suggestions, narrative, smartLoading, routeLoading, routeError, poisLoading, poisError, wantedStops, onWantedStopsChange, onAddStop, onRemoveStop, onNoteChange, onReorderStops, onRetryPOIs, onUpdateCity, onNext, focusedStopLatLng, onFocusStop }) {
  const startSearch = useNominatim()
  const endSearch = useNominatim()
  const [startQuery, setStartQuery] = useState(form.startCity?.city || form.startCity?.name?.split(',')[0] || '')
  const [endQuery, setEndQuery] = useState(form.endCity?.city || form.endCity?.name?.split(',')[0] || '')
  const [showStart, setShowStart] = useState(false)
  const [showEnd, setShowEnd] = useState(false)

  const { pois: filteredPois, curatedStops: filteredCurated } = filterByInterests(pois, curatedStops, form.interests)

  const cityInputs = (
    <div className="flex flex-col xs:flex-row items-stretch xs:items-start gap-2">
      <div className="flex-1">
        <CityInput
          label="Polazak"
          dotColor="bg-success"
          textColor="text-success"
          focusColor="focus:border-success focus:ring-2 focus:ring-success/30"
          confirmed={form.startCity ? (form.startCity.city || form.startCity.name?.split(',')[0]) : null}
          placeholder="Grad polaska"
          search={startSearch}
          query={startQuery}
          setQuery={setStartQuery}
          show={showStart}
          setShow={setShowStart}
          onSelect={(r) => onUpdateCity('startCity', r)}
        />
      </div>
      <div className="hidden xs:flex pt-7 text-muted shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </div>
      <div className="flex-1">
        <CityInput
          label="Odredište"
          dotColor="bg-primary"
          textColor="text-primary"
          focusColor="focus:border-primary focus:ring-2 focus:ring-primary/30"
          confirmed={form.endCity ? (form.endCity.city || form.endCity.name?.split(',')[0]) : null}
          placeholder="Odredište"
          search={endSearch}
          query={endQuery}
          setQuery={setEndQuery}
          show={showEnd}
          setShow={setShowEnd}
          onSelect={(r) => onUpdateCity('endCity', r)}
        />
      </div>
    </div>
  )

  const builderPanel = (
    <RouteBuilderPanel
      form={form}
      pois={pois}
      suggestions={suggestions}
      narrative={narrative}
      smartLoading={smartLoading}
      routeLoading={routeLoading}
      poisLoading={poisLoading}
      onAddStop={onAddStop}
      onRemoveStop={onRemoveStop}
      onReorderStops={onReorderStops}
      onFocusStop={onFocusStop}
    />
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* MOBILE: full-viewport — breaks out of main padding */}
      <div
        className="lg:hidden -mx-4 -mb-6 flex flex-col"
        style={{ height: 'calc(100dvh - 130px)' }}
      >
        {/* City inputs strip */}
        <div className="px-4 pt-2 pb-2 bg-background shrink-0" style={{ zIndex: 20, position: 'relative' }}>
          {cityInputs}
          {routeError && (
            <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{routeError}</span>
            </div>
          )}
        </div>

        {/* Map + bottom drawer */}
        <div className="flex-1 relative overflow-hidden">
          {routeLoading && (
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 15 }}>
              <div className="text-center">
                <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-text">Računam rutu...</p>
              </div>
            </div>
          )}
          <TripMap
            startCity={form.startCity}
            endCity={form.endCity}
            stops={form.stops}
            route={form.route}
            pois={filteredPois}
            curatedStops={filteredCurated}
            onAddStop={onAddStop}
            onRemoveStop={onRemoveStop}
            onNoteChange={onNoteChange}
            showSearch={false}
            showPOIs={true}
            showStats={false}
            height="100%"
            className="h-full"
            focusedStopLatLng={focusedStopLatLng}
          />
          <MobileBottomDrawer
            form={form}
            pois={pois}
            suggestions={suggestions}
            narrative={narrative}
            smartLoading={smartLoading}
            routeLoading={routeLoading}
            poisLoading={poisLoading}
            onAddStop={onAddStop}
            onRemoveStop={onRemoveStop}
            onReorderStops={onReorderStops}
            onFocusStop={onFocusStop}
            onNext={onNext}
          />
        </div>
      </div>

      {/* DESKTOP: standard side-by-side layout */}
      <div className="hidden lg:block">
        <div className="mb-2">{cityInputs}</div>
        {routeError && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">✕</span>
            <span>{routeError}</span>
          </div>
        )}
        <div className="flex gap-4" style={{ minHeight: '62vh' }}>
          <div className="flex-1 relative rounded-2xl overflow-hidden">
            {routeLoading && (
              <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold text-text">Računam rutu...</p>
                </div>
              </div>
            )}
            <TripMap
              startCity={form.startCity}
              endCity={form.endCity}
              stops={form.stops}
              route={form.route}
              pois={filteredPois}
              curatedStops={filteredCurated}
              onAddStop={onAddStop}
              onRemoveStop={onRemoveStop}
              onNoteChange={onNoteChange}
              showSearch={false}
              showPOIs={true}
              showStats={false}
              height="min(580px, 65vh)"
              focusedStopLatLng={focusedStopLatLng}
            />
          </div>
          <div
            className="w-80 shrink-0 bg-surface rounded-2xl overflow-hidden flex flex-col"
            style={{
              border: '1.5px solid rgba(249,115,22,0.15)',
              boxShadow: '0 4px 0 rgba(249,115,22,0.10), 0 8px 32px rgba(249,115,22,0.06)',
            }}
          >
            {builderPanel}
          </div>
        </div>
      </div>
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
        <div className="mb-3">
          <span className="text-3xl font-extrabold text-text" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0}
            <span className="text-xl text-muted">%</span>
          </span>
          <p className="text-xs text-muted">{packedItems} / {totalItems} packed</p>
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
            { key: 'all', label: 'Sve' },
            { key: 'unpacked', label: 'Todo' },
            { key: 'packed', label: 'Done' },
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
      <div className="mb-5 space-y-2">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="w-full px-3 py-2.5 border-2 border-amber-200 rounded-xl bg-surface text-text text-sm cursor-pointer"
        >
          {[...categories, 'Ostalo'].filter((v, i, a) => a.indexOf(v) === i).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Dodaj stvar za pakovanje..."
            className="flex-1 px-4 py-2.5 border-2 border-amber-200 rounded-xl bg-surface text-text placeholder:text-muted text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={addItem}
            className="btn-clay px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm cursor-pointer shrink-0"
          >
            +
          </motion.button>
        </div>
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
                <span className={`w-3 h-3 rounded-full shrink-0 ${style.dot}`} />
                <div className="flex-1">
                  <span className="font-bold text-text text-sm">{category}</span>
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {packedCount}/{items.length}
                  </span>
                </div>
                {allDone && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
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
    const cleaned = String(rawValue).replace(/[^0-9.]/g, '')
    const total = parseFloat(cleaned) || 0
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
            className="flex-1 px-4 py-3 text-xl sm:text-3xl font-extrabold border-2 border-emerald-300 rounded-xl bg-white text-success focus:outline-none focus:border-success focus:ring-2 focus:ring-success/30 transition-all"
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
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
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
