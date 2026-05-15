import { useState, useEffect, useRef } from 'react'
import { fetchScoredStops } from './useCuratedStops'
import { pointAtDurationMin, kmAtDurationMin, bboxAround } from '../utils/routeSampling'
import { haversineDistance } from '../utils/geoUtils'
import { pickFromGeoapify, SLOT_RULES } from '../data/slotRules'
import { track } from '../lib/analytics'

const MIN_STOP_SPACING_MIN = 30
const MAX_STOPS_CAP = 6

function baseIntervalMinutes({ hasKids, kidsMinAge, style }) {
  if (hasKids && (kidsMinAge ?? 99) < 6)  return 90
  if (hasKids && (kidsMinAge ?? 99) < 13) return 120
  if (style === 'fast')                    return 180
  if (style === 'explore')                 return 90
  return 150
}

function clockHourAt(departureIso, minutesIntoTrip) {
  const d = departureIso ? new Date(departureIso) : new Date()
  if (Number.isNaN(d.getTime())) return 12
  return (d.getHours() + d.getMinutes() / 60 + minutesIntoTrip / 60) % 24
}

function seasonFromIso(iso) {
  const m = (iso ? new Date(iso) : new Date()).getMonth()
  if (m >= 2 && m <= 4)  return 'spring'
  if (m >= 5 && m <= 7)  return 'summer'
  if (m >= 8 && m <= 10) return 'fall'
  return 'winter'
}

function timeOfDayLabel(hour) {
  if (hour < 11) return 'morning'
  if (hour < 14) return 'lunch'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function slotTypeFor({ minutesIntoTrip, departureIso, hasKids, kidsMinAge, index }) {
  const hour = clockHourAt(departureIso, minutesIntoTrip)
  if (hour >= 11.5 && hour <= 14)  return 'meal'
  if (hour >= 18   && hour <= 20.5) return 'meal'
  if (hour < 9 && hasKids)          return 'rest'
  if (hasKids && (kidsMinAge ?? 99) < 8) return 'playground'
  // Avoid all-scenic monotony: alternate scenic / rest
  return index % 2 === 0 ? 'scenic' : 'rest'
}

function formatHour(decimalHour) {
  const h = Math.floor(decimalHour) % 24
  const m = Math.round((decimalHour - Math.floor(decimalHour)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function buildNarrative({ totalMin, stopCount, stops = [] }) {
  if (totalMin < 120) return 'Kratko putovanje — pauza nije obavezna.'
  const h = Math.floor(totalMin / 60)
  const m = Math.round(totalMin % 60)
  const durStr = m > 0 ? `${h}h ${m}min` : `${h}h`
  if (stopCount === 0) return `${durStr} vožnje — možeš odmah na put.`
  if (stops.length === 1) {
    const t = formatHour(stops[0].arrivalHour)
    return `${durStr} vožnje — predlažem pauzu oko ${t}.`
  }
  if (stops.length >= 2) {
    const t0 = formatHour(stops[0].arrivalHour)
    const t1 = formatHour(stops[stops.length - 1].arrivalHour)
    return `${durStr} vožnje — pauze oko ${t0} i ${t1}.`
  }
  return `${durStr} vožnje, predlažem ${stopCount} pauze.`
}

function geoapifyNearby(pois, center, radiusKm = 20) {
  if (!pois?.length) return []
  return pois
    .map(p => ({ ...p, _d: haversineDistance(p.lat, p.lng, center.lat, center.lng) }))
    .filter(p => p._d <= radiusKm)
    .sort((a, b) => a._d - b._d)
}

function buildAlternatesFromCurated(curated, max = 3) {
  return curated.slice(1, 1 + max).map(c => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    source: 'curated',
    copy: c.copy_sr || c.description || '',
    kidScore: c.kid_friendly_score || null,
    category: c.category,
    imageUrl: c.image_url,
  }))
}

function buildAlternatesFromGeoapify(nearby, exclude, slot, max = 3) {
  const alts = []
  const seen = new Set(exclude ? [exclude] : [])
  for (const poi of nearby) {
    if (seen.has(poi.id)) continue
    if (alts.length >= max) break
    if (SLOT_RULES[slot]?.prefer.includes(poi.category) || SLOT_RULES[slot]?.fallback.includes(poi.category)) {
      seen.add(poi.id)
      alts.push({
        id: poi.id,
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        source: 'geoapify',
        copy: SLOT_RULES[slot]?.copyTemplate(poi) ?? poi.name,
        kidScore: null,
        category: poi.category,
        imageUrl: null,
      })
    }
  }
  return alts
}

export default function useSmartStops(input = {}) {
  const {
    routeGeometry,
    totalDistanceKm,
    totalDurationSec,
    departureIso,
    adults = 1,
    kids = 0,
    kidsMinAge = null,
    style = 'easy',
    corridor = null,
    geoapifyPois = [],
  } = input

  const [suggestions, setSuggestions] = useState([])
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(false)
  const shownTrackedRef = useRef(new Set())

  useEffect(() => {
    if (!routeGeometry?.length || !totalDistanceKm || !totalDurationSec) {
      setSuggestions([])
      setNarrative('')
      return
    }

    let cancelled = false

    async function build() {
      setLoading(true)

      const hasKids = kids > 0
      const totalMin = totalDurationSec / 60
      const interval = baseIntervalMinutes({ hasKids, kidsMinAge, style })
      const rawCount = Math.floor(totalMin / interval) - 1
      const stopCount = Math.max(0, Math.min(MAX_STOPS_CAP, rawCount))
      const season = seasonFromIso(departureIso)

      if (stopCount === 0) {
        if (!cancelled) {
          setSuggestions([])
          setNarrative(buildNarrative({ totalMin, stopCount, stops: [] }))
          setLoading(false)
        }
        return
      }

      const timeline = Array.from({ length: stopCount }, (_, i) =>
        ((i + 1) / (stopCount + 1)) * totalMin
      )

      const usedIds = new Set()
      const results = []

      for (let i = 0; i < timeline.length; i++) {
        const minutesIntoTrip = timeline[i]
        const point = pointAtDurationMin(routeGeometry, totalDurationSec, totalDistanceKm, minutesIntoTrip)
        const km = Math.round(kmAtDurationMin(totalDurationSec, totalDistanceKm, minutesIntoTrip))
        const slot = slotTypeFor({ minutesIntoTrip, departureIso, hasKids, kidsMinAge, index: i })
        const timeOfDay = timeOfDayLabel(clockHourAt(departureIso, minutesIntoTrip))
        const bbox = bboxAround(point, 20)

        let pick = null
        let alternates = []

        const curated = await fetchScoredStops({
          bbox, hasKids, minKidAge: kidsMinAge, timeOfDay, season, corridor,
        })
        if (cancelled) return

        const curatedFiltered = curated.filter(c => !usedIds.has(c.id))
        const slotMatch = curatedFiltered.find(c => Array.isArray(c.slot_types) && c.slot_types.includes(slot))
        const curatedPick = slotMatch || curatedFiltered[0] || null

        if (curatedPick) {
          usedIds.add(curatedPick.id)
          pick = {
            id: curatedPick.id,
            name: curatedPick.name,
            lat: curatedPick.lat,
            lng: curatedPick.lng,
            source: 'curated',
            copy: curatedPick.copy_sr || curatedPick.description || '',
            kidScore: curatedPick.kid_friendly_score || null,
            category: curatedPick.category,
            imageUrl: curatedPick.image_url,
            hasPlayground: curatedPick.has_playground || false,
            hasToilet: curatedPick.has_toilet || false,
            hasParking: curatedPick.has_parking || false,
            hasFood: curatedPick.has_food || false,
            hasShade: curatedPick.has_shade || false,
            detourMinutes: curatedPick.detour_minutes || 0,
            priceTier: curatedPick.price_tier || null,
          }
          alternates = buildAlternatesFromCurated(
            curatedFiltered.filter(c => c.id !== curatedPick.id),
            3
          )
        } else {
          const nearby = geoapifyNearby(geoapifyPois, point, 20)
          const geoPick = pickFromGeoapify(slot, nearby)
          if (geoPick && !usedIds.has(geoPick.id)) {
            usedIds.add(geoPick.id)
            pick = {
              id: geoPick.id,
              name: geoPick.name,
              lat: geoPick.lat,
              lng: geoPick.lng,
              source: 'geoapify',
              copy: SLOT_RULES[slot]?.copyTemplate(geoPick) ?? geoPick.name,
              kidScore: null,
              category: geoPick.category,
              imageUrl: null,
            }
            alternates = buildAlternatesFromGeoapify(nearby, geoPick.id, slot, 3)
          }
        }

        if (!pick) continue

        results.push({
          ...pick,
          slot,
          km,
          driveTimeMin: Math.round(minutesIntoTrip),
          cityName: pick.name,
          arrivalHour: clockHourAt(departureIso, minutesIntoTrip),
          alternates,
        })
      }

      // Anti-dup safety + minimum spacing
      const final = []
      for (const s of results) {
        if (final.length === 0) { final.push(s); continue }
        const prev = final[final.length - 1]
        if (s.driveTimeMin - prev.driveTimeMin < MIN_STOP_SPACING_MIN) continue
        if (final.some(p => p.id === s.id)) continue
        final.push(s)
      }

      if (cancelled) return

      // Track each shown suggestion exactly once per session
      for (const s of final) {
        const key = `${s.id}:${s.slot}`
        if (!shownTrackedRef.current.has(key)) {
          shownTrackedRef.current.add(key)
          track('suggestion_shown', {
            stop_id: s.id,
            source: s.source,
            slot: s.slot,
            position: s.driveTimeMin,
            in_corridor_min: corridor,
          })
        }
      }

      setSuggestions(final)
      setNarrative(buildNarrative({ totalMin, stopCount: final.length, stops: final }))
      setLoading(false)
    }

    build().catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [
    routeGeometry,
    totalDistanceKm,
    totalDurationSec,
    departureIso,
    adults,
    kids,
    kidsMinAge,
    style,
    corridor,
    geoapifyPois,
  ])

  return { suggestions, narrative, loading }
}
