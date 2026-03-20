import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from '../hooks/useTranslation'
import LanguageToggle from '../components/UI/LanguageToggle'


export default function Welcome() {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(150deg, #F97316 0%, #FDBA74 35%, #38BDF8 70%, #7DD3FC 100%)',
      }}
    >
      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-30">
        <LanguageToggle />
      </div>

      {/* Floating blobs */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 left-8 w-20 h-20 rounded-full bg-white/10 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute top-32 right-12 w-12 h-12 rounded-full bg-white/15 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute top-20 left-1/2 w-8 h-8 rounded-full bg-white/10 pointer-events-none"
      />

      {/* Road landscape */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#22C55E" fillOpacity="0.3" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,186.7C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L0,320Z"/>
          <path fill="#22C55E" fillOpacity="0.5" d="M0,256L48,250.7C96,245,192,235,288,234.7C384,235,480,245,576,256C672,267,768,277,864,266.7C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L0,320Z"/>
          <path fill="#4ADE80" fillOpacity="0.7" d="M0,288L48,282.7C96,277,192,267,288,272C384,277,480,299,576,298.7C672,299,768,277,864,272C960,267,1056,277,1152,282.7C1248,288,1344,288,1392,288L1440,288L1440,320L0,320Z"/>
        </svg>

        {/* Road + car share a container so the car always sits on the road at any screen width.
            Container height = the road SVG's natural height (viewBox 1440×100 → 6.944vw),
            but clamped to a minimum of 50px so the road stays visible on narrow screens. */}
        <div className="absolute bottom-0 w-full" style={{ height: 'max(50px, 6.944vw)' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <rect y="60" width="1440" height="40" fill="#44403C"/>
            <line x1="0" y1="80" x2="1440" y2="80" stroke="#FDE68A" strokeWidth="2" strokeDasharray="30 20"/>
          </svg>
          {/* bottom: 40% = road top edge (rect starts at y=60, so 40% from the bottom of the container) */}
          <div className="absolute z-10 animate-drive" style={{ bottom: '40%' }}>
            <svg width="80" height="40" viewBox="0 0 80 40">
              <rect x="10" y="15" width="60" height="20" rx="5" fill="#EF4444"/>
              <rect x="20" y="5" width="35" height="15" rx="3" fill="#EF4444"/>
              <rect x="24" y="7" width="12" height="10" rx="1" fill="#BFDBFE"/>
              <rect x="39" y="7" width="12" height="10" rx="1" fill="#BFDBFE"/>
              <circle cx="22" cy="35" r="5" fill="#1C1917"/>
              <circle cx="22" cy="35" r="2.5" fill="#78716C"/>
              <circle cx="58" cy="35" r="5" fill="#1C1917"/>
              <circle cx="58" cy="35" r="2.5" fill="#78716C"/>
              <rect x="65" y="20" width="8" height="4" rx="1" fill="#FDBA74"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-20 relative pt-8 pb-32">

        {/* Logo + title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 18 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 18 }}
            className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_6px_0_rgba(0,0,0,0.12),0_12px_32px_rgba(0,0,0,0.1)] flex items-center justify-center mx-auto mb-5"
          >
            <svg width="52" height="52" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="16" fill="#F97316"/>
              <path d="M10 40h44l-5-14h-7l-3-7H25l-3 7h-7L10 40z" fill="white"/>
              <circle cx="21" cy="42" r="5" fill="#1C1917"/>
              <circle cx="43" cy="42" r="5" fill="#1C1917"/>
              <rect x="27" y="29" width="10" height="7" rx="2" fill="#38BDF8"/>
            </svg>
          </motion.div>

          <h1
            className="text-6xl md:text-7xl font-semibold text-white drop-shadow-lg mb-2"
            style={{ fontFamily: 'Fredoka, sans-serif', letterSpacing: '0.02em' }}
          >
            Drumko
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-semibold drop-shadow">
            {t('tagline')}
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 22 }}
          className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-10"
        >
          <motion.div whileTap={{ scale: 0.95 }}>
            <Link
              to="/trips/new"
              className="btn-clay inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-2xl text-lg cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {t('planNewTrip')}
            </Link>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Link
              to="/trips"
              className="btn-clay inline-flex items-center gap-2 px-8 py-4 bg-white/25 backdrop-blur-sm text-white font-bold rounded-2xl border-2 border-white/50 text-lg cursor-pointer hover:bg-white/35 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h18M3 12h18M3 17h18"/>
              </svg>
              {t('myTrips')}
            </Link>
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  )
}
