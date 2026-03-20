import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../store/useAuthStore'

function translateError(msg) {
  if (!msg) return 'Nešto je pošlo naopako. Pokušaj ponovo.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Pogrešan email ili lozinka.'
  if (m.includes('email not confirmed'))
    return 'Email nije potvrđen. Provjeri inbox i klikni na link za potvrdu.'
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Nalog sa ovim emailom već postoji. Pokušaj se prijaviti.'
  if (m.includes('password should be at least') || m.includes('weak password') || m.includes('password must be'))
    return 'Lozinka mora imati najmanje 6 karaktera.'
  if (m.includes('invalid email') || m.includes('invalid format') || m.includes('unable to validate email'))
    return 'Email adresa nije ispravna.'
  if (m.includes('too many requests') || m.includes('rate limit') || m.includes('over_email_send_rate_limit'))
    return 'Previše pokušaja. Sačekaj malo i pokušaj ponovo.'
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'Problem s internetom. Provjeri konekciju i pokušaj ponovo.'
  if (m.includes('signup is disabled') || m.includes('signups not allowed'))
    return 'Registracija trenutno nije dostupna.'
  return msg
}

export default function Auth() {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [mode, setMode] = useState('form') // 'form' | 'forgot' | 'forgot_sent'
  const { signIn, signUp, signInWithGoogle, resetPasswordForEmail } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (tab === 'signin') {
        await signIn(email, password)
        navigate('/trips')
      } else {
        const data = await signUp(email, password)
        if (data.session) {
          // Email confirmation disabled — signed in immediately
          navigate('/trips')
        } else {
          setSuccess(`Poslali smo link za potvrdu na ${email}. Provjeri inbox (i spam folder), pa klikni na link.`)
        }
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await resetPasswordForEmail(email)
      setMode('forgot_sent')
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // redirect happens via OAuth, no navigate needed
    } catch (err) {
      setError(translateError(err.message))
      setGoogleLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(150deg, #F97316 0%, #FDBA74 35%, #38BDF8 70%, #7DD3FC 100%)' }}
    >
      {/* Back to home */}
      <Link
        to="/"
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

          {/* ── Forgot password sent ── */}
          {mode === 'forgot_sent' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text mb-2">Provjeri inbox</h2>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Poslali smo link za resetovanje lozinke na <strong className="text-text">{email}</strong>.
                Provjeri i spam folder.
              </p>
              <button
                onClick={() => { setMode('form'); setError(null) }}
                className="text-sm font-bold text-primary hover:underline cursor-pointer"
              >
                ← Nazad na prijavu
              </button>
            </div>

          ) : mode === 'forgot' ? (
            /* ── Forgot password form ── */
            <>
              <button
                onClick={() => { setMode('form'); setError(null) }}
                className="flex items-center gap-1 text-sm text-muted hover:text-text font-semibold mb-5 cursor-pointer transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Nazad
              </button>
              <h2 className="text-lg font-bold text-text mb-1">Zaboravili ste lozinku?</h2>
              <p className="text-sm text-muted mb-5 leading-relaxed">
                Unesite vaš email i poslaćemo vam link za resetovanje.
              </p>
              <form onSubmit={handleForgot} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tvoj@email.com"
                    required
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
                  disabled={loading}
                  className="btn-clay w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Pošalji link'}
                </button>
              </form>
            </>

          ) : (
            /* ── Normal sign in / sign up ── */
            <>
              {/* Tabs */}
              <div className="flex bg-stone-100 rounded-2xl p-1 mb-6">
                {['signin', 'signup'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null); setSuccess(null) }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      tab === t
                        ? 'bg-white text-primary shadow-[0_2px_0_rgba(0,0,0,0.06)]'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    {t === 'signin' ? 'Prijava' : 'Registracija'}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 border-2 border-border rounded-2xl text-sm font-bold text-text hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60 mb-4"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Nastavi sa Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted font-semibold">ili</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tvoj@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm bg-background text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-muted uppercase tracking-wide">Lozinka</label>
                    {tab === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null) }}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        Zaboravili ste?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {success && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-success bg-success/10 border border-success/20 rounded-xl px-3 py-2 font-medium"
                    >
                      {success}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-clay w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : tab === 'signin' ? 'Prijavi se' : 'Registruj se'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
