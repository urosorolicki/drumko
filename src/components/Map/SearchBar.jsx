import { useState, useRef, useEffect } from 'react'
import useNominatim from '../../hooks/useNominatim'
import { track } from '../../lib/analytics'

export default function SearchBar({ map, onSelect, placeholder = 'Search location...' }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { search, results, loading, clearResults } = useNominatim({ featuretype: null })
  const wrapperRef = useRef(null)

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
    map?.flyTo({ center: [result.lng, result.lat], zoom: 13, duration: 1500 })
    track('custom_stop_added', {
      lat: Number(Number(result.lat).toFixed(5)),
      lng: Number(Number(result.lng).toFixed(5)),
      near_city: result.city || result.name?.split(',')[0] || null,
      source: 'search',
    })
    onSelect?.(result)
  }

  return (
    <div
      ref={wrapperRef}
      className="absolute top-3 left-3 right-3 z-[1000] sm:right-auto sm:w-72 md:w-80"
      onMouseDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
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
