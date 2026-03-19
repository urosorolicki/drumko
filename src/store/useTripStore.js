import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Helper: generate a unique ID
// ---------------------------------------------------------------------------
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

// ---------------------------------------------------------------------------
// Demo seed data
// ---------------------------------------------------------------------------
const createDemoTrip = () => ({
  id: uid(),
  name: 'Letovanje 2025 \u{1F30A}',
  startDate: '2025-07-15',
  endDate: '2025-07-22',
  adults: 2,
  children: 2,
  startCity: { name: 'Beograd', lat: 44.7866, lng: 20.4489 },
  endCity: { name: 'Split', lat: 43.5081, lng: 16.4402 },
  stops: [
    {
      id: uid(),
      name: 'Novi Sad',
      lat: 45.2671,
      lng: 19.8335,
      note: 'Poseta Petrovaradinskoj tvrdjavi',
      arrivalTime: '2025-07-15T10:00:00',
      type: 'city',
    },
    {
      id: uid(),
      name: 'Zagreb',
      lat: 45.815,
      lng: 15.9819,
      note: 'Rucak i razgledanje centra',
      arrivalTime: '2025-07-16T14:00:00',
      type: 'city',
    },
  ],
  packingList: [
    // Clothes
    { id: uid(), category: 'Odeca', name: 'Majice (x5)', checked: true },
    { id: uid(), category: 'Odeca', name: 'Sorts (x3)', checked: true },
    { id: uid(), category: 'Odeca', name: 'Kupaci kostim', checked: false },
    { id: uid(), category: 'Odeca', name: 'Sandale', checked: false },
    // Toiletries
    { id: uid(), category: 'Toalet', name: 'Krema za suncanje SPF50', checked: true },
    { id: uid(), category: 'Toalet', name: 'Cetkica za zube', checked: false },
    { id: uid(), category: 'Toalet', name: 'Sampon', checked: true },
    // Electronics
    { id: uid(), category: 'Elektronika', name: 'Punjac za telefon', checked: true },
    { id: uid(), category: 'Elektronika', name: 'Power bank', checked: false },
    { id: uid(), category: 'Elektronika', name: 'Slusalice', checked: true },
    // Documents
    { id: uid(), category: 'Dokumenta', name: 'Licna karta / pasos', checked: true },
    { id: uid(), category: 'Dokumenta', name: 'Zdravstvena knjizica', checked: false },
    { id: uid(), category: 'Dokumenta', name: 'Vozacka dozvola', checked: true },
    // Other
    { id: uid(), category: 'Ostalo', name: 'Rucnici za plazu', checked: false },
    { id: uid(), category: 'Ostalo', name: 'Naocare za sunce', checked: true },
  ],
  budget: {
    total: 150000,
    currency: 'RSD',
    categories: {
      fuel: 40000,
      accommodation: 50000,
      food: 35000,
      activities: 15000,
      other: 10000,
    },
    expenses: [
      {
        id: uid(),
        name: 'Gorivo do Novog Sada',
        amount: 4500,
        category: 'fuel',
        date: '2025-07-15',
      },
      {
        id: uid(),
        name: 'Rucak u Zagrebu',
        amount: 3200,
        category: 'food',
        date: '2025-07-16',
      },
      {
        id: uid(),
        name: 'Hotel Marjan Split (3 noci)',
        amount: 42000,
        category: 'accommodation',
        date: '2025-07-17',
      },
      {
        id: uid(),
        name: 'Izlet na Hvar',
        amount: 8000,
        category: 'activities',
        date: '2025-07-19',
      },
      {
        id: uid(),
        name: 'Gorivo Zagreb - Split',
        amount: 6500,
        category: 'fuel',
        date: '2025-07-17',
      },
    ],
  },
  route: {
    geometry: null,
    totalDistance: 0,
    totalDuration: 0,
  },
});

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
const useTripStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────
      trips: [],
      activeTripId: null,

      // ── Trip CRUD ──────────────────────────────────────────────────────
      addTrip: (trip) =>
        set((state) => ({
          trips: [
            ...state.trips,
            { ...trip, id: trip.id || uid() },
          ],
        })),

      updateTrip: (id, updates) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTrip: (id) =>
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== id),
          activeTripId: state.activeTripId === id ? null : state.activeTripId,
        })),

      setActiveTrip: (id) => set({ activeTripId: id }),

      getTrip: (id) => get().trips.find((t) => t.id === id),

      // ── Stop management ────────────────────────────────────────────────
      addStop: (tripId, stop) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, stops: [...t.stops, { ...stop, id: stop.id || uid() }] }
              : t
          ),
        })),

      removeStop: (tripId, stopId) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) }
              : t
          ),
        })),

      reorderStops: (tripId, stops) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, stops } : t
          ),
        })),

      updateStop: (tripId, stopId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  stops: t.stops.map((s) =>
                    s.id === stopId ? { ...s, ...updates } : s
                  ),
                }
              : t
          ),
        })),

      // ── Packing list ───────────────────────────────────────────────────
      togglePackingItem: (tripId, itemId) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  packingList: t.packingList.map((i) =>
                    i.id === itemId ? { ...i, checked: !i.checked } : i
                  ),
                }
              : t
          ),
        })),

      addPackingItem: (tripId, item) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  packingList: [
                    ...t.packingList,
                    { ...item, id: item.id || uid() },
                  ],
                }
              : t
          ),
        })),

      removePackingItem: (tripId, itemId) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  packingList: t.packingList.filter((i) => i.id !== itemId),
                }
              : t
          ),
        })),

      setPackingList: (tripId, list) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, packingList: list } : t
          ),
        })),

      // ── Budget ─────────────────────────────────────────────────────────
      updateBudget: (tripId, budgetUpdates) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, budget: { ...t.budget, ...budgetUpdates } }
              : t
          ),
        })),

      addExpense: (tripId, expense) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  budget: {
                    ...t.budget,
                    expenses: [
                      ...t.budget.expenses,
                      { ...expense, id: expense.id || uid() },
                    ],
                  },
                }
              : t
          ),
        })),

      removeExpense: (tripId, expenseId) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  budget: {
                    ...t.budget,
                    expenses: t.budget.expenses.filter(
                      (e) => e.id !== expenseId
                    ),
                  },
                }
              : t
          ),
        })),

      // ── Route ──────────────────────────────────────────────────────────
      updateRoute: (tripId, routeData) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, route: { ...t.route, ...routeData } }
              : t
          ),
        })),

      // ── Seed ───────────────────────────────────────────────────────────
      seedDemoData: () => {
        const { trips } = get();
        if (trips.length === 0) {
          const demo = createDemoTrip();
          set({ trips: [demo], activeTripId: demo.id });
        }
      },
    }),
    {
      name: 'trip-planner-storage',
      onRehydrateStorage: () => (state) => {
        // After rehydration, seed demo data if the store is empty.
        if (state && state.trips.length === 0) {
          state.seedDemoData();
        }
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// Raw store (for non-React usage: store.getState(), store.subscribe(), etc.)
export const store = useTripStore;

// React hook (default)
export default useTripStore;
