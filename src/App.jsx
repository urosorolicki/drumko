import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './store/useAuthStore'
import useTripStore from './store/useTripStore'
import AuthGuard from './components/UI/AuthGuard'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import MyTrips from './pages/MyTrips'
import CreateTrip from './pages/CreateTrip'
import TripDetail from './pages/TripDetail'

export default function App() {
  const location = useLocation()
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const loadTrips = useTripStore((s) => s.loadTrips)
  const clearTrips = useTripStore((s) => s.clearTrips)

  // Boot auth once
  useEffect(() => { initialize() }, [])

  // Load trips from Supabase on login, clear on logout
  useEffect(() => {
    if (user) {
      loadTrips(user.id)
    } else {
      clearTrips()
    }
  }, [user?.id])

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/trips" element={<AuthGuard><MyTrips /></AuthGuard>} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/trips/:id/edit" element={<AuthGuard><CreateTrip /></AuthGuard>} />
        <Route path="/trips/:id" element={<AuthGuard><TripDetail /></AuthGuard>} />
      </Routes>
    </AnimatePresence>
  )
}
