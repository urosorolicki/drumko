import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { createRoot } from 'react-dom/client'

const CAT_COLOR = {
  rest_area:  '#22C55E',
  attraction: '#8B5CF6',
  viewpoint:  '#EC4899',
  restaurant: '#F59E0B',
  cafe:       '#D97706',
  hotel:      '#3B82F6',
  park:       '#10B981',
  museum:     '#6366F1',
  stop:       '#F97316',
}

const CAT_LABEL = {
  rest_area:  'Odmaralište',
  attraction: 'Atrakcija',
  viewpoint:  'Vidikovac',
  restaurant: 'Restoran',
  cafe:       'Kafić',
  hotel:      'Hotel',
  park:       'Park',
  museum:     'Muzej',
  stop:       'Stanica',
}

function CuratedPopupContent({ stop, onAddAsStop, onClose }) {
  const [added, setAdded] = useState(false)
  const color = CAT_COLOR[stop.category] || '#F97316'
  const catLabel = CAT_LABEL[stop.category] || stop.category

  function handleAdd(e) {
    e.stopPropagation()
    if (added) return
    onAddAsStop?.({ lat: stop.lat, lng: stop.lng, name: stop.name, category: stop.category })
    setAdded(true)
    setTimeout(() => onClose?.(), 700)
  }

  return (
    <div style={{ width: 240, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {stop.image_url && (
        <img
          src={stop.image_url}
          alt={stop.name}
          style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {catLabel}
          </span>
          {stop.rating != null && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>
              ★ {Number(stop.rating).toFixed(1)}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 5px', lineHeight: 1.3 }}>
          {stop.name}
        </h3>

        {stop.description && (
          <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: '0 0 8px' }}>
            {stop.description}
          </p>
        )}

        {stop.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {stop.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{
                fontSize: 9, fontWeight: 600,
                background: `${color}18`, color,
                padding: '2px 7px', borderRadius: 20,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {onAddAsStop && (
          <button
            onClick={handleAdd}
            style={{
              width: '100%', padding: '8px 0',
              background: added ? '#22C55E' : color,
              color: 'white', border: 'none',
              borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: added ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {added ? '✓ Dodato u rutu!' : '+ Dodaj u rutu'}
          </button>
        )}

        {stop.website && (
          <a
            href={stop.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', marginTop: 7, fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}
          >
            Više informacija →
          </a>
        )}
      </div>
    </div>
  )
}

function CuratedMarker({ map, stop, onAddAsStop }) {
  const markerRef = useRef(null)
  const popupRef = useRef(null)
  const rootRef = useRef(null)
  const onAddRef = useRef(onAddAsStop)
  useEffect(() => { onAddRef.current = onAddAsStop }, [onAddAsStop])

  useEffect(() => {
    if (!map) return

    const color = CAT_COLOR[stop.category] || '#F97316'
    const name = stop.name.length > 18 ? stop.name.slice(0, 16) + '…' : stop.name

    // Label-style marker element
    const el = document.createElement('div')
    el.style.cssText = `
      background: white;
      border-radius: 14px;
      padding: 4px 9px 4px 7px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1);
      border: 1.5px solid ${color}55;
      white-space: nowrap;
      cursor: pointer;
    `
    el.innerHTML = `
      <span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
      <span style="font-size:11px;font-weight:700;color:#1e293b;font-family:system-ui,sans-serif;">${name}</span>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `

    const popupNode = document.createElement('div')
    rootRef.current = createRoot(popupNode)

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      offset: [0, -18],
      className: 'drumko-popup',
      maxWidth: 'none',
    }).setDOMContent(popupNode)

    rootRef.current.render(
      <CuratedPopupContent
        stop={stop}
        onAddAsStop={(s) => onAddRef.current?.(s)}
        onClose={() => popupRef.current?.remove()}
      />
    )

    markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([stop.lng, stop.lat])
      .setPopup(popupRef.current)
      .addTo(map)

    popupRef.current.on('close', () => rootRef.current?.unmount())

    return () => {
      const root = rootRef.current
      rootRef.current = null
      markerRef.current?.remove()
      popupRef.current?.remove()
      setTimeout(() => { try { root?.unmount() } catch (_) {} }, 0)
    }
  }, [map, stop.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function CuratedStopLayer({ map, stops = [], onAddAsStop }) {
  if (!stops.length) return null
  return stops.map(stop => (
    <CuratedMarker key={stop.id} map={map} stop={stop} onAddAsStop={onAddAsStop} />
  ))
}
