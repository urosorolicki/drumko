import { motion } from 'framer-motion'
import useLanguageStore from '../../store/useLanguageStore'

/**
 * Pill-style language toggle: EN | SR
 * Drop it anywhere in a page header.
 */
export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div className="flex items-center bg-background border border-border rounded-full p-0.5 gap-0.5 shadow-sm">
      {['en', 'sr'].map((lang) => (
        <motion.button
          key={lang}
          onClick={() => setLanguage(lang)}
          whileTap={{ scale: 0.9 }}
          className={`relative px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
            language === lang
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-text'
          }`}
        >
          {lang === 'en' ? '🇬🇧 EN' : '🇷🇸 SR'}
        </motion.button>
      ))}
    </div>
  )
}
