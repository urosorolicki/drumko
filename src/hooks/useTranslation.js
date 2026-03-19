import useLanguageStore from '../store/useLanguageStore'
import { t as dict } from '../data/translations'

/**
 * Returns a translator function t(key) that picks the current language.
 * Usage:
 *   const { t, lang } = useTranslation()
 *   t('myTrips')   // → 'My Trips' or 'Moja putovanja'
 */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language)

  function t(key) {
    const entry = dict[key]
    if (!entry) return key
    return entry[language] ?? entry.en ?? key
  }

  return { t, lang: language }
}
