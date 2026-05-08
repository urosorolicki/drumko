import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'

const ADMIN_EMAIL = 'uros.orolicki@themercury.ai'

const CATEGORIES = [
  { value: 'rest_area',  label: 'Odmaralište' },
  { value: 'attraction', label: 'Atrakcija' },
  { value: 'viewpoint',  label: 'Vidikovac' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'cafe',       label: 'Kafić' },
  { value: 'hotel',      label: 'Hotel' },
  { value: 'park',       label: 'Park' },
  { value: 'museum',     label: 'Muzej' },
  { value: 'stop',       label: 'Stanica' },
]

const EMPTY_FORM = {
  name: '', description: '', lat: '', lng: '',
  category: 'rest_area', image_url: '', website: '',
  tags: '', rating: '', is_active: true,
}

export default function Admin() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const loading = useAuthStore(s => s.loading)

  const [stops, setStops] = useState([])
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true })
  }, [loading, isAdmin])

  const loadStops = useCallback(async () => {
    setFetching(true)
    const { data, error } = await supabase
      .from('curated_stops')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setStops(data || [])
    setFetching(false)
  }, [])

  useEffect(() => {
    if (isAdmin) loadStops()
  }, [isAdmin])

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function startEdit(stop) {
    setEditId(stop.id)
    setForm({
      name:        stop.name || '',
      description: stop.description || '',
      lat:         String(stop.lat),
      lng:         String(stop.lng),
      category:    stop.category || 'rest_area',
      image_url:   stop.image_url || '',
      website:     stop.website || '',
      tags:        (stop.tags || []).join(', '),
      rating:      stop.rating != null ? String(stop.rating) : '',
      is_active:   stop.is_active ?? true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (!form.name.trim() || isNaN(lat) || isNaN(lng)) {
      setError('Ime, lat i lng su obavezna polja.')
      return
    }
    setSaving(true)
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      lat, lng,
      category:    form.category,
      image_url:   form.image_url.trim() || null,
      website:     form.website.trim() || null,
      tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      rating:      form.rating !== '' ? parseFloat(form.rating) : null,
      is_active:   form.is_active,
    }
    let err
    if (editId) {
      ;({ error: err } = await supabase.from('curated_stops').update(payload).eq('id', editId))
    } else {
      ;({ error: err } = await supabase.from('curated_stops').insert(payload))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(editId ? 'Stanica ažurirana!' : 'Stanica dodata!')
    setTimeout(() => setSuccess(null), 3000)
    cancelEdit()
    loadStops()
  }

  async function handleToggleActive(stop) {
    await supabase.from('curated_stops').update({ is_active: !stop.is_active }).eq('id', stop.id)
    loadStops()
  }

  async function handleDelete(id) {
    if (!window.confirm('Obriši stanicu? Ovo se ne može poništiti.')) return
    await supabase.from('curated_stops').delete().eq('id', id)
    loadStops()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" /></div>
  }
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="header-glass sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-border bg-surface/80 flex items-center justify-center text-muted hover:text-text transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-base font-bold text-text flex-1">Admin — Kurirane Stanice</h1>
          <span className="text-xs font-semibold text-muted bg-stone-100 px-2 py-1 rounded-lg">
            {stops.length} stanica
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Feedback */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`px-4 py-3 rounded-xl text-sm font-semibold ${
                error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {error || success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <div className="bg-surface rounded-2xl p-5" style={{ border: '1.5px solid rgba(249,115,22,0.15)', boxShadow: '0 4px 0 rgba(249,115,22,0.08)' }}>
          <h2 className="text-sm font-bold text-text mb-4">
            {editId ? 'Uredi stanicu' : 'Nova stanica'}
          </h2>
          <form onSubmit={handleSave} className="space-y-3">
            {/* Row: name + category */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Ime *</label>
                <input
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="Zlatibor"
                  required
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Kategorija</label>
                <select
                  value={form.category}
                  onChange={e => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text focus:outline-none focus:border-primary transition-colors"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Opis</label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={2}
                placeholder="Kratki opis za putnike..."
                className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Row: lat + lng + rating */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Lat *</label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={e => handleChange('lat', e.target.value)}
                  placeholder="43.7279"
                  required
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Lng *</label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={e => handleChange('lng', e.target.value)}
                  placeholder="19.6935"
                  required
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Ocena (0–5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={e => handleChange('rating', e.target.value)}
                  placeholder="4.5"
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Slika URL</label>
              <input
                value={form.image_url}
                onChange={e => handleChange('image_url', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="preview"
                  className="mt-2 w-full h-28 object-cover rounded-xl"
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
            </div>

            {/* Row: website + tags */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Website</label>
                <input
                  value={form.website}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Tagovi (zareza)</label>
                <input
                  value={form.tags}
                  onChange={e => handleChange('tags', e.target.value)}
                  placeholder="planina, odmor, priroda"
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => handleChange('is_active', !form.is_active)}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-success' : 'bg-stone-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-semibold text-text">Aktivna stanica</span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {editId ? 'Sačuvaj izmene' : 'Dodaj stanicu'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-5 py-3 border-2 border-border rounded-xl text-sm font-semibold text-muted hover:text-text hover:border-stone-300 transition-colors cursor-pointer"
                >
                  Otkaži
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Stop list */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Sve stanice</p>
          {fetching ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stops.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted">Nema stanica — dodaj prvu gore.</p>
          ) : (
            <div className="space-y-2">
              {stops.map(stop => (
                <div
                  key={stop.id}
                  className={`bg-surface rounded-2xl p-3 flex items-center gap-3 transition-opacity ${!stop.is_active ? 'opacity-50' : ''}`}
                  style={{ border: '1.5px solid rgba(226,232,240,0.9)', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
                >
                  {stop.image_url && (
                    <img
                      src={stop.image_url}
                      alt={stop.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text truncate">{stop.name}</p>
                    <p className="text-[10px] text-muted font-semibold">
                      {CATEGORIES.find(c => c.value === stop.category)?.label ?? stop.category}
                      {stop.rating != null && ` · ★ ${Number(stop.rating).toFixed(1)}`}
                      {' · '}{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(stop)}
                      title={stop.is_active ? 'Deaktiviraj' : 'Aktiviraj'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                        stop.is_active ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-stone-100 text-muted hover:bg-stone-200'
                      }`}
                    >
                      {stop.is_active ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => startEdit(stop)}
                      className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                      title="Uredi"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(stop.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                      title="Obriši"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
