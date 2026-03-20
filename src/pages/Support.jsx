import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const SUPPORT_EMAIL = 'drumko@drumko.app'
const FORMSPREE_URL = 'https://formspree.io/f/xqeyjqza'

const FAQ = [
  {
    q: 'Kako da sačuvam putovanje?',
    a: 'Prijavite se putem Google naloga i vaša putovanja se automatski čuvaju u oblaku — dostupna na svim uređajima.',
  },
  {
    q: 'Zašto se karta ne učitava?',
    a: 'Proverite internet konekciju. Ako problem ostaje, pokušajte da osvežite stranicu (F5 ili pull-to-refresh na mobilnom).',
  },
  {
    q: 'Mogu li da koristim Drumko bez registracije?',
    a: 'Da! Možete planirati rutu bez naloga, ali putovanje neće biti sačuvano. Prijavite se da biste sačuvali i pristupili putovanjima sa bilo kog uređaja.',
  },
  {
    q: 'Koje zemlje su podržane?',
    a: 'Drumko podržava sve destinacije na mapi — optimizovano je za Balkan, ali radi globalno.',
  },
  {
    q: 'Kako da dodam stanicu na rutu?',
    a: 'U koraku "Ruta i stanice", kliknite na kartu ili koristite dugme "Dodaj stanicu" u panelu sa preporukama.',
  },
  {
    q: 'Zašto preporuke mesta ne prikazuju rezultate?',
    a: 'Preporuke rade na osnovu rute — prvo izaberite polazišnu i odredišnu tačku, pa će se preporuke pojaviti automatski.',
  },
]

function FaqItem({ q, a, i }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="border border-border rounded-2xl overflow-hidden bg-surface"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer hover:bg-background transition-colors"
      >
        <span className="text-sm font-semibold text-text">{q}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted leading-relaxed border-t border-border pt-3">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Support() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject || 'Podrška - Drumko',
          message: form.message,
        }),
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="bg-surface border-b-2 border-border sticky top-0 z-50 shadow-[0_2px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-border bg-background hover:border-primary/40 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-text leading-none">Podrška</h1>
            <p className="text-xs text-muted mt-0.5">Drumko help center</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center shadow-[0_4px_0_rgba(249,115,22,0.15)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Kako možemo da pomognemo?</h2>
          <p className="text-muted text-sm max-w-sm mx-auto">
            Pogledajte česta pitanja ili nam pišite — odgovaramo u roku od 24h.
          </p>
        </motion.div>

        {/* Quick contact links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
              ),
              label: 'Email',
              value: SUPPORT_EMAIL,
              href: `mailto:${SUPPORT_EMAIL}`,
              color: 'text-primary',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              ),
              label: 'Radno vreme',
              value: 'Pon–Pet, 9–17h',
              color: 'text-secondary-dark',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.2 2 2 0 012.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>
                </svg>
              ),
              label: 'Odgovor za',
              value: 'do 24 sata',
              color: 'text-success',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              {item.href ? (
                <a
                  href={item.href}
                  className="flex items-center gap-3 p-4 bg-surface border-2 border-border rounded-2xl hover:border-primary/40 transition-colors cursor-pointer group"
                >
                  <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                  <div>
                    <p className="text-xs text-muted font-medium">{item.label}</p>
                    <p className="text-sm font-bold text-text">{item.value}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-surface border-2 border-border rounded-2xl">
                  <span className={item.color}>{item.icon}</span>
                  <div>
                    <p className="text-xs text-muted font-medium">{item.label}</p>
                    <p className="text-sm font-bold text-text">{item.value}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <section>
          <h3 className="text-lg font-bold text-text mb-4">Česta pitanja</h3>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} i={i} />
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section>
          <h3 className="text-lg font-bold text-text mb-1">Pišite nam</h3>
          <p className="text-sm text-muted mb-5">Poruka stiže direktno na naš inbox — odgovaramo u roku od 24h.</p>

          <AnimatePresence mode="wait">
            {status === 'sent' ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-success/10 border-2 border-success/30 rounded-2xl p-8 text-center"
              >
                <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
                <p className="font-bold text-success text-lg mb-1">Poruka je poslata!</p>
                <p className="text-sm text-muted">Odgovorićemo na vaš email u roku od 24h.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 text-sm text-muted hover:text-text underline cursor-pointer"
                >
                  Pošalji novu poruku
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="bg-surface border-2 border-border rounded-2xl p-5 sm:p-6 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Ime</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Vaše ime"
                      className="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="vasa@adresa.com"
                      className="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Tema</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="O čemu se radi?"
                    className="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Poruka</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Opišite problem ili pitanje što detaljnije..."
                    className="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-xs text-danger font-semibold text-center">
                    Greška pri slanju. Pokušajte ponovo ili nas kontaktirajte direktno na {SUPPORT_EMAIL}.
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-clay w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Slanje...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                      Pošalji poruku
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-muted pb-4 flex items-center justify-center gap-2 flex-wrap">
          <span>© {new Date().getFullYear()} Drumko</span>
          <span>·</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary transition-colors">{SUPPORT_EMAIL}</a>
          <span>·</span>
          <Link to="/privacy" className="hover:text-primary transition-colors">Politika privatnosti</Link>
        </div>

      </main>
    </motion.div>
  )
}
