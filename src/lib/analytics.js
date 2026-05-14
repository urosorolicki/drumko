import { supabase } from './supabase'

const SESSION_KEY = 'drumko-session-id'
const MAX_BATCH = 10
const FLUSH_MS = 4000

let queue = []
let timer = null

function getSessionId() {
  let id = null
  try { id = localStorage.getItem(SESSION_KEY) } catch (_) {}
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)
    try { localStorage.setItem(SESSION_KEY, id) } catch (_) {}
  }
  return id
}

async function flush() {
  if (!queue.length) return
  const batch = queue
  queue = []
  if (timer) { clearTimeout(timer); timer = null }

  const sessionId = getSessionId()
  let userId = null
  try {
    const { data } = await supabase.auth.getUser()
    userId = data?.user?.id ?? null
  } catch (_) {}

  const rows = batch.map(e => ({
    session_id: sessionId,
    user_id: userId,
    event_type: e.type,
    payload: e.payload,
  }))

  supabase.from('events').insert(rows).then(({ error }) => {
    if (error && import.meta.env.DEV) {
      console.warn('analytics flush:', error.message)
    }
  })
}

export function track(type, payload = {}) {
  if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DISABLE === '1') return
  if (!type) return
  queue.push({ type, payload })
  if (queue.length >= MAX_BATCH) {
    flush()
    return
  }
  if (!timer) timer = setTimeout(flush, FLUSH_MS)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
