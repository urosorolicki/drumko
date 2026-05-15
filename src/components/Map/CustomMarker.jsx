import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { createRoot } from 'react-dom/client'
import StopPopup from './StopPopup'

function markerSVG(type, number) {
  switch (type) {
    case 'start':
      return `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#22C55E"/>
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="rgba(0,0,0,0.08)"/>
        <circle cx="18" cy="17" r="11" fill="white"/>
        <text x="18" y="22" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui,sans-serif" fill="#22C55E">A</text>
      </svg>`
    case 'end':
      return `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#3B82F6"/>
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="rgba(0,0,0,0.08)"/>
        <circle cx="18" cy="17" r="11" fill="white"/>
        <text x="18" y="22" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui,sans-serif" fill="#3B82F6">B</text>
      </svg>`
    default: {
      const n = number ?? '?'
      return `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#F97316"/>
        <circle cx="18" cy="17" r="11" fill="white"/>
        <text x="18" y="22" text-anchor="middle" font-size="13" font-weight="700" font-family="system-ui,sans-serif" fill="#F97316">${n}</text>
      </svg>`
    }
  }
}

/**
 * HTML marker with a React-rendered popup for start / stop / end waypoints.
 * Creates one MapLibre Marker + one createRoot per instance.
 */
export default function StopMarker({ map, type, position, number, stop, index, totalStops, onRemove, onNoteChange }) {
  const markerRef = useRef(null)
  const popupRef = useRef(null)
  const rootRef = useRef(null)
  const elRef = useRef(null)

  // Create marker + popup once
  useEffect(() => {
    if (!map || !position) return

    const el = document.createElement('div')
    el.innerHTML = markerSVG(type, number)
    el.style.cssText = 'cursor:pointer;line-height:0;'
    elRef.current = el

    const popupNode = document.createElement('div')
    rootRef.current = createRoot(popupNode)

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: [0, -46],
      className: 'drumko-popup',
      maxWidth: 'none',
    }).setDOMContent(popupNode)

    markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([position.lng, position.lat])
      .setPopup(popupRef.current)
      .addTo(map)

    return () => {
      const root = rootRef.current
      rootRef.current = null
      markerRef.current?.remove()
      popupRef.current?.remove()
      // Defer unmount to avoid calling it during React's render cycle
      setTimeout(() => { try { root?.unmount() } catch (_) {} }, 0)
    }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker element when number/type changes (e.g. stops reordered)
  useEffect(() => {
    if (elRef.current) elRef.current.innerHTML = markerSVG(type, number)
  }, [type, number])

  // Update position
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLngLat([position.lng, position.lat])
    }
  }, [position?.lat, position?.lng])

  // Re-render popup content whenever relevant props change (guard: root may be null after cleanup)
  useEffect(() => {
    if (!rootRef.current) return
    rootRef.current.render(
      <StopPopup
        stop={stop}
        index={index}
        totalStops={totalStops}
        onRemove={onRemove}
        onNoteChange={onNoteChange}
        onClose={() => popupRef.current?.remove()}
      />
    )
  }, [stop, index, totalStops, onRemove, onNoteChange])

  return null
}
