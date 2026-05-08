import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import useTripStore from '../store/useTripStore'
import TripMap from '../components/Map/MapContainer'
import { formatDistance, formatDuration } from '../utils/geoUtils'
import { calculateTripDays } from '../utils/budgetUtils'

export default function SharedTrip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fetchSharedTrip = useTripStore((s) => s.fetchSharedTrip)
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSharedTrip(id).then((data) => {
      if (data) setTrip(data)
      else setNotFound(true)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!trip) return
    const start = trip.startCity?.name?.split(',')[0] || ''
    const end = trip.endCity?.name?.split(',')[0] || ''
    const title = start && end
      ? `${start} → ${end} | Drumko`
      : `${trip.name} | Drumko`
    const desc = [
      start && end ? `Ruta: ${start} → ${end}` : trip.name,
      trip.stops?.length ? `${trip.stops.length} stanica` : null,
      trip.route?.totalDistance ? formatDistance(trip.route.totalDistance) : null,
    ].filter(Boolean).join(' · ')

    document.title = title
    const setMeta = (prop, val, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el) }
      el.setAttribute('content', val)
    }
    setMeta('description', desc)
    setMeta('og:title', title, 'property')
    setMeta('og:description', desc, 'property')
    setMeta('twitter:title', title)
    setMeta('twitter:description', desc)

    return () => { document.title = 'Drumko — Planiranje putovanja za porodicu | Besplatan planer' }
  }, [trip])

  function forkTrip() {
    localStorage.setItem('drumko_fork_trip', JSON.stringify({
      startCity: trip.startCity,
      endCity: trip.endCity,
      stops: trip.stops || [],
    }))
    setCopied(true)
    setTimeout(() => navigate('/trips/new'), 600)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-muted/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Putovanje nije dostupno</h1>
        <p className="text-muted mb-6">Ovaj link nije aktivan ili putovanje više nije javno.</p>
        <Link to="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl">
          Planiraj svoje putovanje
        </Link>
      </div>
    )
  }

  const days = calculateTripDays(trip.startDate, trip.endDate)
  const totalPeople = (trip.adults || 1) + (trip.children || 0)
  const dist = trip.route?.totalDistance
  const dur = trip.route?.totalDuration

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted font-medium mb-0.5">Podeljeno putovanje</p>
          <h1 className="text-lg font-bold text-text leading-tight truncate">{trip.name}</h1>
        </div>
        <motion.button
          onClick={forkTrip}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl whitespace-nowrap flex-shrink-0"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          )}
          {copied ? 'Kopirano!' : 'Kopiraj rutu'}
        </motion.button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Route card */}
        <div className="bg-white rounded-2xl border-2 border-border p-4 shadow-[0_3px_0_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-success flex-shrink-0" />
            <span className="font-semibold text-text">{trip.startCity?.name || '—'}</span>
          </div>
          {trip.stops?.length > 0 && (
            <div className="ml-1.5 border-l-2 border-dashed border-border pl-4 mb-3 space-y-2">
              {trip.stops.map((stop) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-text">{stop.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-danger flex-shrink-0" />
            <span className="font-semibold text-text">{trip.endCity?.name || '—'}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Dana', value: days || '—' },
            { label: 'Putnika', value: totalPeople },
            { label: 'Distanca', value: dist ? formatDistance(dist) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border-2 border-border p-3 text-center shadow-[0_3px_0_rgba(0,0,0,0.06)]">
              <p className="text-xl font-extrabold text-primary">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Map */}
        {(trip.startCity || trip.endCity) && (
          <div className="rounded-2xl overflow-hidden border-2 border-border shadow-[0_3px_0_rgba(0,0,0,0.06)]" style={{ height: 300 }}>
            <TripMap
              startCity={trip.startCity}
              endCity={trip.endCity}
              stops={trip.stops}
              route={trip.route}
              readonly
            />
          </div>
        )}

        {/* Stops detail */}
        {trip.stops?.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-border p-4 shadow-[0_3px_0_rgba(0,0,0,0.06)]">
            <h2 className="font-bold text-text mb-3">Stanice</h2>
            <div className="space-y-2">
              {trip.stops.map((stop, i) => (
                <div key={stop.id} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text">{stop.name}</p>
                    {stop.note && <p className="text-xs text-muted">{stop.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-primary/10 rounded-2xl border-2 border-primary/20 p-5 text-center">
          <p className="font-bold text-text mb-1">Planiraj i ti svoje putovanje</p>
          <p className="text-sm text-muted mb-4">Besplatno — ruta, budžet i lista za pakovanje na jednom mestu.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={forkTrip}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary text-white font-bold rounded-xl shadow-[0_4px_0_rgba(234,88,12,0.4)]"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Kopiraj ovu rutu
            </motion.button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 border-2 border-primary/30 text-primary font-bold rounded-xl"
            >
              Napravi novu rutu
            </Link>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
