import { useMemo } from 'react'
import L from 'leaflet'
import { Marker } from 'react-leaflet'

/**
 * Creates a custom SVG icon for map markers
 * @param {'start'|'stop'|'end'|'poi'} type - Marker type
 * @param {object} options - Additional options
 * @param {number} options.number - Stop number (for stop type)
 * @param {string} options.category - POI category key
 */
function createIcon(type, options = {}) {
  const size = type === 'poi' ? [44, 44] : [36, 44]
  const anchor = type === 'poi' ? [22, 22] : [18, 44]

  let svg = ''

  switch (type) {
    case 'start':
      svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#22C55E"/>
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="rgba(0,0,0,0.1)"/>
        <circle cx="18" cy="17" r="11" fill="white"/>
        <text x="18" y="22" text-anchor="middle" font-size="13" font-weight="700" font-family="Plus Jakarta Sans,sans-serif" fill="#22C55E">A</text>
      </svg>`
      break

    case 'end':
      svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#3B82F6"/>
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="rgba(0,0,0,0.1)"/>
        <circle cx="18" cy="17" r="11" fill="white"/>
        <text x="18" y="22" text-anchor="middle" font-size="13" font-weight="700" font-family="Plus Jakarta Sans,sans-serif" fill="#3B82F6">B</text>
      </svg>`
      break

    case 'stop': {
      const num = options.number || '?'
      svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#F97316"/>
        <circle cx="18" cy="17" r="11" fill="white"/>
        <text x="18" y="22" text-anchor="middle" font-size="13" font-weight="700" font-family="Plus Jakarta Sans,sans-serif" fill="#F97316">${num}</text>
      </svg>`
      break
    }

    case 'poi': {
      const categoryColors = {
        fuel: '#78716C',
        restaurant: '#F59E0B',
        cafe: '#D97706',
        attraction: '#8B5CF6',
        park: '#22C55E',
        hotel: '#3B82F6',
      }
      const color = categoryColors[options.category] || '#F97316'
      // 44×44 touch target, visual dot centered inside
      svg = `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
          <circle cx="13" cy="13" r="11" fill="${color}" opacity="0.92"/>
          <circle cx="13" cy="13" r="5.5" fill="white"/>
        </svg>
      </div>`
      break
    }

    default:
      svg = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#F97316"/>
        <circle cx="18" cy="17" r="8" fill="white"/>
      </svg>`
  }

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, type === 'poi' ? -22 : -44],
  })
}

export default function CustomMarker({ type = 'stop', position, number, category, children, ...rest }) {
  const icon = useMemo(
    () => createIcon(type, { number, category }),
    [type, number, category]
  )

  return (
    <Marker position={position} icon={icon} {...rest}>
      {children}
    </Marker>
  )
}

export { createIcon }
