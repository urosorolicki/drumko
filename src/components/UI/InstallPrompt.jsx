import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === 'true'
  )

  useEffect(() => {
    if (dismissed) return
    function handler(e) {
      e.preventDefault()
      setPrompt(e)
      // Show after a short delay so it doesn't immediately pop on first visit
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {show && prompt && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-surface rounded-2xl shadow-[0_8px_0_rgba(0,0,0,0.10),0_20px_60px_rgba(0,0,0,0.15)] border border-border p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_3px_0_rgba(234,88,12,0.5)]">
              <svg width="28" height="28" viewBox="0 0 64 64">
                <path d="M12 38h40l-4-12h-6l-2-6H24l-2 6h-6l-4 12z" fill="white"/>
                <circle cx="20" cy="40" r="4" fill="rgba(28,25,23,0.8)"/>
                <circle cx="44" cy="40" r="4" fill="rgba(28,25,23,0.8)"/>
                <rect x="26" y="28" width="12" height="6" rx="1" fill="#38BDF8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text">Instaliraj Drumko</p>
              <p className="text-xs text-muted leading-snug">Dodaj na home screen za brži pristup</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={handleInstall}
                className="btn-clay px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Instaliraj
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-muted hover:text-text transition-colors text-center cursor-pointer"
              >
                Ne hvala
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
