import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

function translateError(msg) {
  if (!msg) return 'Nešto je pošlo naopako. Pokušaj ponovo.'
  const m = msg.toLowerCase()
  if (m.includes('password should be at least') || m.includes('weak password'))
    return 'Lozinka mora imati najmanje 6 karaktera.'
  if (m.includes('auth session missing') || m.includes('not authenticated'))
    return 'Link je istekao ili je već iskorišten. Zatraži novi.'
  if (m.includes('same password') || m.includes('different from the old'))
    return 'Nova lozinka mora biti drugačija od stare.'
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Previše pokušaja. Sačekaj malo i pokušaj ponovo.'
  return msg
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Supabase processes the hash fragment and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
      }
    })
    // Also check for an existing session (if page is refreshed after recovery)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Lozinke se ne podudaraju.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      navigate('/trips')
    } catch (err) {
      setError(translateError(err.message))
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(150deg, #F97316 0%, #FDBA74 35%, #38BDF8 70%, #7DD3FC 100%)' }}
    >
      <Link
        to="/auth"
        className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Nazad
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/90 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.12)] flex items-center justify-center mx-auto mb-3">
            <svg width="36" height="36" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="16" fill="#F97316"/>
              <path d="M10 40h44l-5-14h-7l-3-7H25l-3 7h-7L10 40z" fill="white"/>
              <circle cx="21" cy="42" r="5" fill="#1C1917"/>
              <circle cx="43" cy="42" r="5" fill="#1C1917"/>
              <rect x="27" y="29" width="10" height="7" rx="2" fill="#38BDF8"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Drumko
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.12),0_16px_40px_rgba(0,0,0,0.1)] p-6">
          {!ready ? (
            /* Waiting for Supabase to process the recovery token */
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted">Provjera linka…</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-text mb-1">Nova lozinka</h2>
              <p className="text-sm text-muted mb-5">Unesite novu lozinku za vaš nalog.</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-muted uppercase tracking-wide">Nova lozinka</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-xs text-muted hover:text-text font-semibold cursor-pointer"
                    >
                      {showPassword ? 'Sakrij' : 'Prikaži'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm bg-background text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wide">Ponovi lozinku</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm bg-background text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 font-medium"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="btn-clay w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Sačuvaj lozinku'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
