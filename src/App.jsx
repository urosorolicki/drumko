import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './store/useAuthStore'
import useTripStore from './store/useTripStore'
import AuthGuard from './components/UI/AuthGuard'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import MyTrips from './pages/MyTrips'
import CreateTrip from './pages/CreateTrip'
import TripDetail from './pages/TripDetail'
import Support from './pages/Support'
import Privacy from './pages/Privacy'
import ResetPassword from './pages/ResetPassword'
import SharedTrip from './pages/SharedTrip'
import Admin from './pages/Admin'
import OfflineIndicator from './components/UI/OfflineIndicator'
import InstallPrompt from './components/UI/InstallPrompt'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const syncGuestTrips = useTripStore((s) => s.syncGuestTrips)
  const clearTrips = useTripStore((s) => s.clearTrips)
  const addTrip = useTripStore((s) => s.addTrip)

  // Boot auth once
  useEffect(() => { initialize() }, [])

  // Load trips from Supabase on login, clear on logout
  // Also restore any trip that was pending before Google OAuth redirect
  useEffect(() => {
    if (user) {
      syncGuestTrips(user.id)
      const raw = localStorage.getItem('drumko_pending_trip')
      if (raw) {
        try {
          const form = JSON.parse(raw)
          localStorage.removeItem('drumko_pending_trip')
          const newId = crypto.randomUUID()
          addTrip({ ...form, id: newId }, user.id)
          navigate(`/trips/${newId}`)
        } catch (_) {
          localStorage.removeItem('drumko_pending_trip')
        }
      }
    } else {
      clearTrips()
    }
  }, [user?.id])

  return (
    <>
      <OfflineIndicator />
      <InstallPrompt />
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/trips" element={<MyTrips />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/trips/:id/edit" element={<CreateTrip />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/shared/:id" element={<SharedTrip />} />
        <Route path="/admin/stops" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AnimatePresence>
    </>
  )
}
