import { useState, useRef, useCallback } from 'react'
import { sampleRoutePoints } from '../utils/geoUtils'

const ENDPOINT = 'https://api.geoapify.com/v2/places'

/** Approximate spacing between circle queries along the route */
const SAMPLE_INTERVAL_KM = 80

/** Radius in metres around each sample point */
const CIRCLE_RADIUS_M = 15000

/**
 * Map our app category keys → Geoapify category codes.
 * https://apidocs.geoapify.com/docs/places/#categories
 */
const CATEGORY_MAP = {
  fuel:        'service.vehicle.fuel',
  car_wash:    'service.vehicle.car_wash',
  rest_area:   'leisure.park',
  picnic_site: 'leisure.picnic.picnic_site',
  restaurant:  'catering.restaurant',
  fast_food:   'catering.fast_food',
  cafe:        'catering.cafe',
  hotel:       'accommodation.hotel',
  motel:       'accommodation.motel',
  hostel:      'accommodation.hostel',
  camp_site:   'accommodation.hut',
  attraction:  'tourism.attraction',
  viewpoint:   'tourism.attraction.viewpoint',
  museum:      'entertainment.museum',
  supermarket: 'commercial.supermarket',
  pharmacy:    'healthcare.pharmacy',
}

/**
 * Reverse map: Geoapify category prefix → our app category key.
 * Ordered from most-specific to least-specific so shorter prefixes don't
 * swallow longer ones.
 */
const REVERSE_MAP = Object.entries(CATEGORY_MAP)
  .sort((a, b) => b[1].length - a[1].length) // longest prefix first

function geoapifyCatToAppCat(featureCategories = []) {
  for (const [appKey, geoPrefix] of REVERSE_MAP) {
    if (featureCategories.some((c) => c === geoPrefix || c.startsWith(geoPrefix + '.'))) {
      return appKey
    }
  }
  return 'stop'
}

function mapFeature(feature) {
  const props = feature.properties
  if (!props?.name) return null

  const [lng, lat] = feature.geometry.coordinates
  if (lat == null || lng == null) return null

  return {
    id: props.place_id || `${lat.toFixed(5)}-${lng.toFixed(5)}`,
    name: props.name,
    lat,
    lng,
    category: geoapifyCatToAppCat(props.categories),
  }
}

export default function useGeoapify() {
  const [pois, setPois] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const abortRef = useRef(null)

  const fetchPOIs = useCallback(async (routeGeometry, categoryKeys) => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY

    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('Geoapify API key nije podešen. Dodaj VITE_GEOAPIFY_API_KEY u .env fajl.')
      setPois([])
      setLoading(false)
      return null
    }

    if (!routeGeometry?.length || !categoryKeys?.length) {
      setPois([])
      return null
    }

    // Cancel any previous in-flight requests
    if (abortRef.current) {
      abortRef.current.forEach((c) => c.abort())
    }

    setLoading(true)
    setError(null)

    try {
      // Build Geoapify category string
      const geoCats = [...new Set(
        categoryKeys.map((k) => CATEGORY_MAP[k]).filter(Boolean)
      )].join(',')

      // Sample the route — one circle query per sample point
      const samplePoints = sampleRoutePoints(routeGeometry, SAMPLE_INTERVAL_KM)

      // Create one AbortController per request
      const controllers = samplePoints.map(() => new AbortController())
      abortRef.current = controllers

      // Fire all requests in parallel
      const responses = await Promise.all(
        samplePoints.map((pt, i) => {
          const url = new URL(ENDPOINT)
          url.searchParams.set('categories', geoCats)
          url.searchParams.set('filter', `circle:${pt.lng},${pt.lat},${CIRCLE_RADIUS_M}`)
          url.searchParams.set('limit', '100')
          url.searchParams.set('apiKey', apiKey)

          return fetch(url.toString(), { signal: controllers[i].signal })
            .then((r) => {
              if (r.status === 429) throw new Error('Rate limit reached — try again in a moment.')
              if (!r.ok) throw new Error(`Geoapify error: ${r.status}`)
              return r.json()
            })
            .catch((err) => {
              if (err.name === 'AbortError') return null
              throw err
            })
        })
      )

      // Merge, deduplicate by id, drop nulls
      const seen = new Set()
      const merged = []

      for (const res of responses) {
        if (!res?.features) continue
        for (const feature of res.features) {
          const poi = mapFeature(feature)
          if (!poi || seen.has(poi.id)) continue
          seen.add(poi.id)
          merged.push(poi)
        }
      }

      setPois(merged)
      return merged
    } catch (err) {
      if (err.name === 'AbortError') return null
      setError(err.message || 'Greška pri učitavanju mesta')
      setPois([])
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchPOIs, pois, loading, error }
}
