import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true)
      setWasOffline(true)
      setShowBackOnline(false)
    }
    function handleOnline() {
      setIsOffline(false)
      if (wasOffline) {
        setShowBackOnline(true)
        setTimeout(() => setShowBackOnline(false), 3000)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [wasOffline])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          role="status"
          aria-live="assertive"
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-text text-white text-xs font-semibold py-2 px-4 text-center"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0112 10c-2.4 0-4.63.8-6.41 2.13"/>
            <path d="M5 12.55a11 11 0 014.52-2.46"/>
            <path d="M10.71 5.05A16 16 0 0122.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 016.95 0"/>
            <circle cx="12" cy="20" r="1"/>
          </svg>
          Nema interneta — putovanja dostupna offline
        </motion.div>
      )}
      {!isOffline && showBackOnline && (
        <motion.div
          key="online"
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-success text-white text-xs font-semibold py-2 px-4"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Ponovo online
        </motion.div>
      )}
    </AnimatePresence>
  )
}
