import { useState, useRef, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import useNominatim from '../../hooks/useNominatim'

/**
 * Floating search bar for the map. Uses Nominatim for geocoding.
 * Restricted to Balkan + surrounding countries.
 */
export default function SearchBar({ onSelect, placeholder = 'Search location...' }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { search, results, loading, clearResults } = useNominatim({ featuretype: null })
  const map = useMap()
  const wrapperRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e) {
    const val = e.target.value
    setQuery(val)
    if (val.length >= 3) {
      search(val)
      setIsOpen(true)
    } else {
      clearResults()
      setIsOpen(false)
    }
  }

  function handleSelect(result) {
    setQuery(result.city || result.name.split(',')[0])
    setIsOpen(false)
    clearResults()

    // Fly to location
    map.flyTo([result.lat, result.lng], 13, { duration: 1.5 })

    if (onSelect) {
      onSelect(result)
    }
  }

  // Stop map events from propagating through the search bar
  function stopPropagation(e) {
    e.stopPropagation()
  }

  return (
    <div
      ref={wrapperRef}
      className="absolute top-4 left-4 z-[1000] w-72 md:w-80"
      onMouseDown={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-border shadow-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-muted" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="mt-1 bg-surface rounded-xl border border-border shadow-lg max-h-60 overflow-auto">
          {results.map((result, i) => (
            <li key={i}>
              <button
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-primary/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="font-medium">{result.city || result.name.split(',')[0]}</span>
                {result.sub && (
                  <span className="text-muted text-xs block mt-0.5 truncate">{result.sub}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
