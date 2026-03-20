import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

// Map local camelCase trip → Supabase snake_case row
function toRow(trip, userId) {
  return {
    id: trip.id,
    user_id: userId,
    name: trip.name,
    start_date: trip.startDate,
    end_date: trip.endDate,
    adults: trip.adults,
    children: trip.children,
    start_city: trip.startCity,
    end_city: trip.endCity,
    stops: trip.stops,
    route: trip.route,
    packing_list: trip.packingList,
    budget: trip.budget,
    is_shared: trip.isShared ?? false,
    updated_at: new Date().toISOString(),
  }
}

// Map Supabase row → local camelCase trip
function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    adults: row.adults ?? 1,
    children: row.children ?? 0,
    startCity: row.start_city,
    endCity: row.end_city,
    stops: row.stops ?? [],
    route: row.route ?? { geometry: null, totalDistance: 0, totalDuration: 0 },
    packingList: row.packing_list ?? [],
    budget: row.budget ?? { total: 0, currency: 'RSD', categories: {}, expenses: [] },
    isShared: row.is_shared ?? false,
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
const useTripStore = create(
  persist(
    (set, get) => ({
      trips: [],
      activeTripId: null,

      // ── Supabase sync ──────────────────────────────────────────────────

      /** Load all trips for the logged-in user from Supabase */
      loadTrips: async (userId) => {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) { console.error('loadTrips:', error); return }
        set({ trips: data.map(fromRow) })
      },

      /** Clear local store on sign-out */
      clearTrips: () => set({ trips: [], activeTripId: null }),

      // ── Trip CRUD ──────────────────────────────────────────────────────

      addTrip: async (trip, userId) => {
        const newTrip = { ...trip, id: trip.id || uid() }
        // Optimistic local update
        set((s) => ({ trips: [newTrip, ...s.trips] }))
        // Persist to Supabase if logged in
        if (userId) {
          const { error } = await supabase.from('trips').insert(toRow(newTrip, userId))
          if (error) console.error('addTrip:', error)
        }
        return newTrip
      },

      updateTrip: async (id, updates, userId) => {
        // Optimistic local update
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
        // Persist to Supabase if logged in
        if (userId) {
          const updated = get().trips.find((t) => t.id === id)
          if (updated) {
            const { error } = await supabase
              .from('trips')
              .update(toRow(updated, userId))
              .eq('id', id)
            if (error) console.error('updateTrip:', error)
          }
        }
      },

      deleteTrip: async (id, userId) => {
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          activeTripId: s.activeTripId === id ? null : s.activeTripId,
        }))
        if (userId) {
          const { error } = await supabase.from('trips').delete().eq('id', id)
          if (error) console.error('deleteTrip:', error)
        }
      },

      setActiveTrip: (id) => set({ activeTripId: id }),
      getTrip: (id) => get().trips.find((t) => t.id === id),

      /** Toggle public sharing for a trip */
      setShared: async (tripId, shared, userId) => {
        set((s) => ({
          trips: s.trips.map((t) => t.id === tripId ? { ...t, isShared: shared } : t),
        }))
        if (userId) {
          const { error } = await supabase.from('trips').update({ is_shared: shared }).eq('id', tripId)
          if (error) console.error('setShared:', error)
        }
      },

      /** Fetch a single shared trip by id — no auth required (public RLS) */
      fetchSharedTrip: async (tripId) => {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .eq('is_shared', true)
          .single()
        if (error) return null
        return fromRow(data)
      },

      // ── Stop management ────────────────────────────────────────────────

      addStop: (tripId, stop) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, stops: [...t.stops, { ...stop, id: stop.id || uid() }] }
              : t
          ),
        })),

      removeStop: (tripId, stopId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) }
              : t
          ),
        })),

      reorderStops: (tripId, stops) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === tripId ? { ...t, stops } : t)),
        })),

      updateStop: (tripId, stopId, updates) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, stops: t.stops.map((st) => (st.id === stopId ? { ...st, ...updates } : st)) }
              : t
          ),
        })),

      // ── Packing list ───────────────────────────────────────────────────

      togglePackingItem: (tripId, itemId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, packingList: t.packingList.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) }
              : t
          ),
        })),

      addPackingItem: (tripId, item) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, packingList: [...t.packingList, { ...item, id: item.id || uid() }] }
              : t
          ),
        })),

      removePackingItem: (tripId, itemId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, packingList: t.packingList.filter((i) => i.id !== itemId) }
              : t
          ),
        })),

      setPackingList: (tripId, list) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === tripId ? { ...t, packingList: list } : t)),
        })),

      // ── Budget ─────────────────────────────────────────────────────────

      updateBudget: (tripId, budgetUpdates) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId ? { ...t, budget: { ...t.budget, ...budgetUpdates } } : t
          ),
        })),

      addExpense: (tripId, expense) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, budget: { ...t.budget, expenses: [...t.budget.expenses, { ...expense, id: expense.id || uid() }] } }
              : t
          ),
        })),

      removeExpense: (tripId, expenseId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, budget: { ...t.budget, expenses: t.budget.expenses.filter((e) => e.id !== expenseId) } }
              : t
          ),
        })),

      // ── Route ──────────────────────────────────────────────────────────

      updateRoute: (tripId, routeData) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId ? { ...t, route: { ...t.route, ...routeData } } : t
          ),
        })),
    }),
    { name: 'drumko-trips' }
  )
)

export const store = useTripStore
export default useTripStore
