import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'sr',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'sr' : 'en' })),
    }),
    { name: 'trip-planner-language' }
  )
)

export default useLanguageStore
