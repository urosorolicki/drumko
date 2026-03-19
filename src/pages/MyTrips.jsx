import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useTripStore from '../store/useTripStore'
import { formatDistance, formatDuration } from '../utils/geoUtils'
import { calculateTripDays } from '../utils/budgetUtils'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'

export default function MyTrips() {
  const trips = useTripStore(state => state.trips)
  const deleteTrip = useTripStore(state => state.deleteTrip)
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted hover:text-text transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-text">{t('myTrips')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/trips/new"
              className="btn-clay inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {t('newTrip')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {trips.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">{t('noTripsYet')}</h2>
            <p className="text-muted mb-8">{t('noTripsDesc')}</p>
            <Link
              to="/trips/new"
              className="btn-clay inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl text-lg cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {t('planFirst')}
            </Link>
          </motion.div>
        ) : (
          /* Trip cards grid */
          <div className="grid gap-4 sm:grid-cols-2">
            {trips.map((trip, i) => {
              const days = calculateTripDays(trip.startDate, trip.endDate)
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="card-clay bg-surface border border-border p-5 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-text text-lg group-hover:text-primary transition-colors">
                        {trip.name}
                      </h3>
                      <p className="text-sm text-muted">
                        {trip.startCity?.name?.split(',')[0]} → {trip.endCity?.name?.split(',')[0]}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this trip?')) {
                          deleteTrip(trip.id)
                        }
                      }}
                      className="text-muted hover:text-danger transition-colors p-1"
                      aria-label="Delete trip"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted">
                    {trip.startDate && (
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        {new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </span>
                    )}
                    {days > 0 && (
                      <span>{days} days</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {trip.stops?.length || 0} {t('stops').toLowerCase()}
                    </span>
                    {trip.route?.totalDistance > 0 && (
                      <span>{formatDistance(trip.route.totalDistance)}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      {trip.adults + trip.children} {t('travelers').toLowerCase()}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </motion.div>
  )
}
