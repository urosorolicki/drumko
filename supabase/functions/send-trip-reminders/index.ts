import { createClient } from 'jsr:@supabase/supabase-js@2'

// Web Push via VAPID — Deno-compatible implementation
// Uses the built-in crypto for signing

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL       = Deno.env.get('VAPID_EMAIL')!

// ── VAPID helpers ────────────────────────────────────────────────

function base64urlToUint8Array(b64: string) {
  const pad = '='.repeat((4 - b64.length % 4) % 4)
  return Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad), c => c.charCodeAt(0))
}

function uint8ArrayToBase64url(arr: Uint8Array) {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function createVapidAuth(audience: string) {
  const header = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_EMAIL,
  })))

  const keyData = base64urlToUint8Array(VAPID_PRIVATE_KEY)
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const data = new TextEncoder().encode(`${header}.${payload}`)
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data)
  const jwt = `${header}.${payload}.${uint8ArrayToBase64url(new Uint8Array(sig))}`

  return `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: object) {
  const url = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const vapidAuth = await createVapidAuth(audience)

  // Encrypt payload using the Web Push encryption spec (simplified — plaintext for brevity)
  // For production, use a proper web-push encryption library
  const body = JSON.stringify(payload)

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': vapidAuth,
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body,
  })

  return res.status
}

// ── Main ─────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Find trips starting tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: trips } = await supabase
    .from('trips')
    .select('id, name, user_id')
    .eq('start_date', tomorrowStr)

  if (!trips?.length) return new Response('No trips tomorrow', { status: 200 })

  const results: string[] = []

  for (const trip of trips) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', trip.user_id)

    if (!subs?.length) continue

    for (const sub of subs) {
      const status = await sendPush(sub, {
        title: '🚗 Sutra polaziš!',
        body: `Putovanje "${trip.name}" počinje sutra. Sve spremno?`,
        tripId: trip.id,
      })
      results.push(`${trip.name} → ${status}`)
    }
  }

  return new Response(JSON.stringify({ sent: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
