import { useMemo, useState } from 'react'
import L from 'leaflet'
import { Marker, Popup, useMap } from 'react-leaflet'

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

function createCuratedIcon(stop) {
  const color = CAT_COLOR[stop.category] || '#F97316'
  const name = stop.name.length > 18 ? stop.name.slice(0, 16) + '…' : stop.name
  const w = Math.max(80, name.length * 7 + 46)
  const h = 28

  const html = `
    <div style="
      background:white;
      border-radius:14px;
      padding:4px 9px 4px 7px;
      display:inline-flex;
      align-items:center;
      gap:5px;
      box-shadow:0 2px 10px rgba(0,0,0,0.18),0 1px 3px rgba(0,0,0,0.1);
      border:1.5px solid ${color}55;
      white-space:nowrap;
      cursor:pointer;
    ">
      <span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
      <span style="font-size:11px;font-weight:700;color:#1e293b;font-family:system-ui,sans-serif;">${name}</span>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </div>`

  return L.divIcon({
    html,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    popupAnchor: [0, -h / 2 - 6],
  })
}

function CuratedStopMarker({ stop, onAddAsStop }) {
  const [added, setAdded] = useState(false)
  const map = useMap()
  const icon = useMemo(() => createCuratedIcon(stop), [stop.id, stop.name, stop.category])
  const color = CAT_COLOR[stop.category] || '#F97316'
  const catLabel = CAT_LABEL[stop.category] || stop.category

  function handleAdd(e) {
    e.stopPropagation()
    if (added) return
    onAddAsStop?.({ lat: stop.lat, lng: stop.lng, name: stop.name, category: stop.category })
    setAdded(true)
    setTimeout(() => map.closePopup(), 700)
  }

  return (
    <Marker position={[stop.lat, stop.lng]} icon={icon}>
      <Popup maxWidth={260}>
        <div style={{ width: 240, margin: '-12px -12px 0 -12px', fontFamily: 'system-ui, sans-serif' }}>
          {stop.image_url && (
            <img
              src={stop.image_url}
              alt={stop.name}
              style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block' }}
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
                  <span
                    key={tag}
                    style={{
                      fontSize: 9, fontWeight: 600,
                      background: `${color}18`, color,
                      padding: '2px 7px', borderRadius: 20,
                    }}
                  >
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
                style={{
                  display: 'block', textAlign: 'center',
                  marginTop: 7, fontSize: 11, color: '#94a3b8', textDecoration: 'none',
                }}
              >
                Više informacija →
              </a>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default function CuratedStopLayer({ stops = [], onAddAsStop }) {
  if (!stops.length) return null
  return (
    <>
      {stops.map(stop => (
        <CuratedStopMarker key={stop.id} stop={stop} onAddAsStop={onAddAsStop} />
      ))}
    </>
  )
}
