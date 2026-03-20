import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const LAST_UPDATED = '20. mart 2026.'
const CONTACT_EMAIL = 'drumko@drumko.app'

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-text">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <header className="bg-surface border-b-2 border-border sticky top-0 z-50 shadow-[0_2px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-border bg-background hover:border-primary/40 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-text leading-none">Politika privatnosti</h1>
            <p className="text-xs text-muted mt-0.5">Poslednje ažuriranje: {LAST_UPDATED}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        <p className="text-sm text-muted leading-relaxed">
          Ova politika privatnosti objašnjava koje podatke Drumko prikuplja, kako ih koristi i koje su vaše mogućnosti.
          Korišćenjem aplikacije prihvatate ove uslove.
        </p>

        <Section title="1. Ko smo mi">
          <p>
            Drumko je aplikacija za planiranje putovanja dostupna na <strong className="text-text">drumko.app</strong>.
            Za sva pitanja vezana za privatnost pišite nam na{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Koje podatke prikupljamo">
          <p><strong className="text-text">Podaci naloga (ako se prijavite):</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Ime i email adresa (preuzeti od Google OAuth)</li>
            <li>Profilna slika (od Google)</li>
          </ul>
          <p className="mt-2"><strong className="text-text">Podaci putovanja:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Rute, stanice, datumi putovanja</li>
            <li>Lista za pakovanje</li>
            <li>Budžet i troškovi koje unesete</li>
          </ul>
          <p className="mt-2"><strong className="text-text">Tehnički podaci (automatski):</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Anonimni podaci o korišćenju (Vercel Analytics — bez ličnih podataka)</li>
            <li>IP adresa (kratkoročno, od strane hosting provajdera)</li>
          </ul>
        </Section>

        <Section title="3. Kako koristimo vaše podatke">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Da čuvamo i sinhronizujemo vaša putovanja između uređaja</li>
            <li>Da omogućimo prijavu putem Google naloga</li>
            <li>Da poboljšamo aplikaciju na osnovu anonimnih podataka o korišćenju</li>
          </ul>
          <p>Vaše podatke <strong className="text-text">ne prodajemo</strong> trećim stranama niti ih koristimo za oglašavanje.</p>
        </Section>

        <Section title="4. Treće strane">
          <p>Koristimo sledeće servise:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-text">Supabase</strong> — čuvanje podataka i autentifikacija (EU serveri)</li>
            <li><strong className="text-text">Google OAuth</strong> — prijava putem Google naloga</li>
            <li><strong className="text-text">Geoapify</strong> — mape i pretraga lokacija</li>
            <li><strong className="text-text">Vercel</strong> — hosting i analitika</li>
            <li><strong className="text-text">Formspree</strong> — prosleđivanje poruka podrške</li>
          </ul>
          <p>Svaki od ovih servisa ima sopstvenu politiku privatnosti.</p>
        </Section>

        <Section title="5. Čuvanje podataka">
          <p>
            Podaci putovanja se čuvaju sve dok imate nalog. Možete obrisati bilo koje putovanje u aplikaciji.
            Da obrišete nalog i sve podatke, kontaktirajte nas na{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="6. Vaša prava (GDPR)">
          <p>Ako ste u EU, imate pravo da:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Pristupite podacima koje čuvamo o vama</li>
            <li>Tražite ispravku netačnih podataka</li>
            <li>Tražite brisanje vaših podataka</li>
            <li>Prenesete vaše podatke (pravo na prenosivost)</li>
          </ul>
          <p>
            Za ostvarivanje ovih prava pišite na{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="7. Kolačići (cookies)">
          <p>
            Drumko koristi samo neophodne kolačiće za čuvanje sesije prijave.
            Ne koristimo kolačiće za praćenje ili oglašavanje.
          </p>
        </Section>

        <Section title="8. Promene politike">
          <p>
            Ako značajno promenimo ovu politiku, obavestićemo vas putem aplikacije.
            Datum poslednjeg ažuriranja uvek je vidljiv na vrhu ove stranice.
          </p>
        </Section>

        <div className="pt-4 border-t border-border text-center text-xs text-muted">
          <p>© {new Date().getFullYear()} Drumko ·{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary transition-colors">{CONTACT_EMAIL}</a>
          </p>
        </div>

      </main>
    </motion.div>
  )
}
