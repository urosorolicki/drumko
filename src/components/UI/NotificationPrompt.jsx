import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import usePushNotifications from '../../hooks/usePushNotifications'

export default function NotificationPrompt({ userId, tripName, startDate }) {
  const { permission, subscribed, loading, supported, subscribe, unsubscribe } = usePushNotifications(userId)
  const [dismissed, setDismissed] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)

  // Only show if: push is supported, not already granted/denied, trip has a future start date
  const hasFutureDate = startDate && new Date(startDate + 'T00:00:00') > new Date()
  const show = supported && !dismissed && !subscribed && permission === 'default' && hasFutureDate

  async function handleSubscribe() {
    const ok = await subscribe()
    if (ok) {
      setJustSubscribed(true)
      setTimeout(() => setJustSubscribed(false), 3000)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="bg-primary/6 border border-primary/20 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text">Podsjetnik dan prije polaska</p>
            <p className="text-xs text-muted leading-snug mt-0.5">
              Obavijestimo te dan prije početka putovanja <strong className="text-text">{tripName}</strong>.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="btn-clay px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {loading
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : null}
                Uključi obavještenja
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
              >
                Ne hvala
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {justSubscribed && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-success/8 border border-success/25 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-text">Obavještenje je postavljeno!</p>
        </motion.div>
      )}
      {subscribed && !justSubscribed && (
        <div className="flex items-center justify-between bg-success/6 border border-success/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p className="text-xs font-semibold text-success">Podsjetnik aktivan</p>
          </div>
          <button
            onClick={unsubscribe}
            disabled={loading}
            className="text-xs text-muted hover:text-danger transition-colors cursor-pointer"
          >
            Isključi
          </button>
        </div>
      )}
    </AnimatePresence>
  )
}
