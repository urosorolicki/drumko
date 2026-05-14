import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const C = {
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  text: '#1C1917',
  muted: '#78716C',
  border: '#E7E5E4',
  surface: '#FAFAF9',
  white: '#FFFFFF',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  blue: '#0EA5E9',
  blueBg: '#F0F9FF',
  red: '#EF4444',
  redBg: '#FEF2F2',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    padding: 36,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: `2px solid ${C.orange}`,
  },
  headerLeft: { flex: 1 },
  tripName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    marginBottom: 3,
  },
  tripRoute: {
    fontSize: 10,
    color: C.muted,
  },
  headerBadge: {
    backgroundColor: C.orangeLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  badgeLabel: { fontSize: 7, color: C.orange, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.orange, marginTop: 1 },
  // Section
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 7,
    paddingBottom: 4,
    borderBottom: `1px solid ${C.border}`,
  },
  // Stats row
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  statBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    padding: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.text },
  statLabel: { fontSize: 7, color: C.muted, marginTop: 2 },
  // Stops
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: `1px solid ${C.border}`,
  },
  stopDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.orangeLight,
    border: `1.5px solid ${C.orange}`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  stopIndex: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.orange },
  stopContent: { flex: 1 },
  stopName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  stopNote: { fontSize: 8, color: C.muted, marginTop: 2, lineHeight: 1.4 },
  stopMeta: { fontSize: 7, color: C.muted, marginTop: 2 },
  // Endpoint (start/end)
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: `1px solid ${C.border}`,
  },
  endpointDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  endpointLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
  endpointName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  // Packing
  packingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  packingCat: {
    width: '48%',
    backgroundColor: C.surface,
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    padding: 7,
    marginBottom: 4,
  },
  packingCatTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottom: `1px solid ${C.border}`,
  },
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  packingCheck: {
    width: 9,
    height: 9,
    borderRadius: 2,
    border: `1px solid ${C.border}`,
    marginRight: 5,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  packingCheckFilled: {
    backgroundColor: C.green,
    border: `1px solid ${C.green}`,
  },
  packingCheckMark: { fontSize: 6, color: C.white, fontFamily: 'Helvetica-Bold' },
  packingItemText: { fontSize: 8, color: C.text },
  packingItemTextDone: { fontSize: 8, color: C.muted },
  // Budget
  budgetSummary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  budgetBox: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  budgetLabel: { fontSize: 7, color: C.muted, marginBottom: 2 },
  budgetAmount: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottom: `1px solid ${C.border}`,
  },
  expenseLeft: { flex: 1 },
  expenseName: { fontSize: 8.5, color: C.text },
  expenseCat: { fontSize: 7, color: C.muted, marginTop: 1 },
  expenseAmount: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${C.border}`,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.muted },
  footerBrand: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.orange },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtKm(m) {
  if (!m) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(0)} km` : `${Math.round(m)} m`
}

function fmtDuration(sec) {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

const CAT_LABELS = {
  fuel: 'Gorivo', accommodation: 'Smeštaj', food: 'Hrana',
  activities: 'Aktivnosti', other: 'Ostalo',
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export function TripPDFDocument({ trip }) {
  const stops = trip.stops || []
  const packingList = trip.packingList || []
  const expenses = trip.budget?.expenses || []
  const currency = trip.budget?.currency || 'RSD'
  const totalBudget = trip.budget?.total || 0
  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const days = trip.startDate && trip.endDate
    ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1
    : null

  // Group packing by category
  const packingByCat = packingList.reduce((acc, item) => {
    const cat = item.category || 'Ostalo'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const packedCount = packingList.filter(i => i.checked).length

  return (
    <Document title={trip.name} author="Drumko" subject="Putovanje">
      {/* ── Page 1: Overview + Route ── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.tripName}>{trip.name}</Text>
            <Text style={s.tripRoute}>
              {trip.startCity?.name?.split(',')[0]} → {trip.endCity?.name?.split(',')[0]}
            </Text>
            {trip.startDate && (
              <Text style={[s.tripRoute, { marginTop: 3 }]}>
                {formatDate(trip.startDate)}{trip.endDate ? ` — ${formatDate(trip.endDate)}` : ''}
              </Text>
            )}
          </View>
          <View style={s.headerBadge}>
            <Text style={s.badgeLabel}>drumko.app</Text>
            {days && <Text style={s.badgeValue}>{days}d</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pregled putovanja</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{days || '—'}</Text>
              <Text style={s.statLabel}>Dana</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{stops.length}</Text>
              <Text style={s.statLabel}>Stajanja</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{(trip.adults || 1) + (trip.children || 0)}</Text>
              <Text style={s.statLabel}>Putnika</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{fmtKm(trip.route?.totalDistance)}</Text>
              <Text style={s.statLabel}>Distanca</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{fmtDuration(trip.route?.totalDuration)}</Text>
              <Text style={s.statLabel}>Vožnja</Text>
            </View>
          </View>
        </View>

        {/* Route */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ruta</Text>

          {/* Start */}
          <View style={s.endpointRow}>
            <View style={[s.endpointDot, { backgroundColor: C.green }]}>
              <Text style={s.endpointLabel}>A</Text>
            </View>
            <View>
              <Text style={[s.endpointName, { color: C.green }]}>Polazak</Text>
              <Text style={s.stopNote}>{trip.startCity?.name || '—'}</Text>
            </View>
          </View>

          {/* Stops */}
          {stops.map((stop, i) => (
            <View key={stop.id || i} style={s.stopRow}>
              <View style={s.stopDot}>
                <Text style={s.stopIndex}>{i + 1}</Text>
              </View>
              <View style={s.stopContent}>
                <Text style={s.stopName}>{stop.name}</Text>
                {stop.note ? <Text style={s.stopNote}>{stop.note}</Text> : null}
                {stop.arrivalTime ? (
                  <Text style={s.stopMeta}>Dolazak: {stop.arrivalTime}</Text>
                ) : null}
              </View>
            </View>
          ))}

          {/* End */}
          <View style={[s.endpointRow, { borderBottom: 'none', marginBottom: 0 }]}>
            <View style={[s.endpointDot, { backgroundColor: C.red }]}>
              <Text style={s.endpointLabel}>B</Text>
            </View>
            <View>
              <Text style={[s.endpointName, { color: C.red }]}>Odredište</Text>
              <Text style={s.stopNote}>{trip.endCity?.name || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {trip.name} · Generisano {new Date().toLocaleDateString('sr-Latn')}
          </Text>
          <Text style={s.footerBrand}>drumko.app</Text>
        </View>
      </Page>

      {/* ── Page 2: Packing ── */}
      {packingList.length > 0 && (
        <Page size="A4" style={s.page}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.tripName}>Lista pakovanja</Text>
              <Text style={s.tripRoute}>{trip.name}</Text>
            </View>
            <View style={s.headerBadge}>
              <Text style={s.badgeLabel}>Spakovano</Text>
              <Text style={s.badgeValue}>{packedCount}/{packingList.length}</Text>
            </View>
          </View>

          <View style={s.packingGrid}>
            {Object.entries(packingByCat).map(([cat, items]) => (
              <View key={cat} style={s.packingCat}>
                <Text style={s.packingCatTitle}>{cat}</Text>
                {items.map((item, i) => (
                  <View key={item.id || i} style={s.packingItem}>
                    <View style={[s.packingCheck, item.checked && s.packingCheckFilled]}>
                      {item.checked && <Text style={s.packingCheckMark}>✓</Text>}
                    </View>
                    <Text style={item.checked ? s.packingItemTextDone : s.packingItemText}>
                      {item.name}
                      {item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={s.footer} fixed>
            <Text style={s.footerText}>{trip.name} · Lista pakovanja</Text>
            <Text style={s.footerBrand}>drumko.app</Text>
          </View>
        </Page>
      )}

      {/* ── Page 3: Budget ── */}
      {(totalBudget > 0 || expenses.length > 0) && (
        <Page size="A4" style={s.page}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.tripName}>Budžet</Text>
              <Text style={s.tripRoute}>{trip.name}</Text>
            </View>
            <View style={s.headerBadge}>
              <Text style={s.badgeLabel}>Potrošeno</Text>
              <Text style={s.badgeValue}>
                {Math.round((totalBudget > 0 ? totalSpent / totalBudget : 0) * 100)}%
              </Text>
            </View>
          </View>

          {/* Summary boxes */}
          <View style={[s.section, { marginBottom: 12 }]}>
            <Text style={s.sectionTitle}>Rezime</Text>
            <View style={s.budgetSummary}>
              <View style={[s.budgetBox, { backgroundColor: C.blueBg }]}>
                <Text style={s.budgetLabel}>Planirani budžet</Text>
                <Text style={[s.budgetAmount, { color: C.blue }]}>
                  {totalBudget.toLocaleString()} {currency}
                </Text>
              </View>
              <View style={[s.budgetBox, { backgroundColor: C.surface, border: `1px solid ${C.border}` }]}>
                <Text style={s.budgetLabel}>Potrošeno</Text>
                <Text style={[s.budgetAmount, { color: C.text }]}>
                  {Math.round(totalSpent).toLocaleString()} {currency}
                </Text>
              </View>
              <View style={[s.budgetBox, { backgroundColor: totalSpent > totalBudget ? C.redBg : C.greenBg }]}>
                <Text style={s.budgetLabel}>Ostalo</Text>
                <Text style={[s.budgetAmount, { color: totalSpent > totalBudget ? C.red : C.green }]}>
                  {Math.round(totalBudget - totalSpent).toLocaleString()} {currency}
                </Text>
              </View>
            </View>
          </View>

          {/* Expenses list */}
          {expenses.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Troškovi ({expenses.length})</Text>
              {expenses.map((exp, i) => (
                <View key={exp.id || i} style={s.expenseRow}>
                  <View style={s.expenseLeft}>
                    <Text style={s.expenseName}>{exp.name || 'Trošak'}</Text>
                    <Text style={s.expenseCat}>{CAT_LABELS[exp.category] || exp.category || 'Ostalo'}</Text>
                  </View>
                  <Text style={s.expenseAmount}>
                    {Number(exp.amount || 0).toLocaleString()} {currency}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.footer} fixed>
            <Text style={s.footerText}>{trip.name} · Budžet</Text>
            <Text style={s.footerBrand}>drumko.app</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
