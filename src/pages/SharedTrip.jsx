import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import TripMap from '../components/Map/MapContainer'
import { formatDistance, formatDuration } from '../utils/geoUtils'
import { calculateTripDays } from '../utils/budgetUtils'

export default function SharedTrip() {
  const { id } = useParams()
  const fetchSharedTrip = useTripStore((s) => s.fetchSharedTrip)
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchSharedTrip(id).then((data) => {
      if (data) setTrip(data)
      else setNotFound(true)
      setLoading(false)
    })
  }, [id])

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
        <div className="text-5xl mb-4">🔒</div>
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
      <div className="bg-white border-b border-border px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-medium mb-0.5">Podeljeno putovanje</p>
          <h1 className="text-lg font-bold text-text leading-tight">{trip.name}</h1>
        </div>
        <Link
          to="/"
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl whitespace-nowrap"
        >
          Planiraj svoje
        </Link>
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
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-[0_4px_0_rgba(234,88,12,0.4)]"
          >
            Otvori Drumko
          </Link>
        </div>

      </div>
    </motion.div>
  )
}
