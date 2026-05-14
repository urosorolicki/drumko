import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Runtime caching ─────────────────────────────────────────────

registerRoute(
  ({ url }) => url.hostname === 'nominatim.openstreetmap.org',
  new NetworkFirst({
    cacheName: 'nominatim-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
)

registerRoute(
  ({ url }) => url.hostname === 'router.project-osrm.org',
  new NetworkFirst({
    cacheName: 'osrm-cache',
    networkTimeoutSeconds: 6,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 })],
  })
)

registerRoute(
  ({ url }) => url.hostname === 'api.geoapify.com',
  new NetworkFirst({
    cacheName: 'geoapify-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
)

registerRoute(
  ({ url }) => /^[abc]\.tile\.openstreetmap\.org$/.test(url.hostname),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [new ExpirationPlugin({ maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
)

// ── Push notifications ──────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try { data = event.data.json() }
  catch { data = { title: 'Drumko', body: event.data.text() } }

  const { title = 'Drumko', body, tripId, icon = '/favicon.svg', badge = '/favicon.svg' } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: tripId || 'drumko-notification',
      renotify: true,
      data: { tripId },
      actions: [
        { action: 'open', title: 'Otvori' },
        { action: 'dismiss', title: 'Zatvori' },
      ],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const tripId = event.notification.data?.tripId
  const url = tripId ? `/trips/${tripId}` : '/trips'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
