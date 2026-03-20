/**
 * Drumko logo component.
 *
 * Props:
 *   variant  - 'full' (icon + wordmark) | 'icon' (icon only)
 *   size     - 'sm' | 'md' | 'lg'
 *   dark     - invert text colour for use on dark/coloured backgrounds
 *   className - extra wrapper class
 */
export default function Logo({ variant = 'full', size = 'md', dark = false, className = '' }) {
  const iconSize = { sm: 32, md: 44, lg: 60 }[size]
  const fontSize = { sm: 18, md: 26, lg: 36 }[size]
  const gap      = { sm: 8,  md: 10, lg: 14 }[size]

  const textColour = dark ? '#FFFFFF' : '#1C1917'

  return (
    <div className={`inline-flex items-center select-none ${className}`} style={{ gap }}>
      {/* ── Icon ───────────────────────────────────────────────────── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="drumko-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>

        {/* Claymorphism shadow */}
        <rect x="3" y="7" width="58" height="57" rx="18" fill="#C2410C" opacity="0.35" />

        {/* Background */}
        <rect x="0" y="0" width="62" height="62" rx="18" fill="url(#drumko-bg)" />

        {/* Top highlight */}
        <ellipse cx="31" cy="10" rx="22" ry="6" fill="rgba(255,255,255,0.22)" />

        {/* Car body */}
        <rect x="7" y="35" width="50" height="18" rx="7" fill="white" />

        {/* Car roof */}
        <rect x="13" y="22" width="38" height="17" rx="8" fill="white" />

        {/* Window left */}
        <rect x="16" y="25" width="13" height="11" rx="4" fill="#38BDF8" opacity="0.9" />

        {/* Window right */}
        <rect x="33" y="25" width="13" height="11" rx="4" fill="#38BDF8" opacity="0.9" />

        {/* A-pillar */}
        <rect x="30" y="25" width="4" height="11" fill="white" />

        {/* Headlight */}
        <rect x="54" y="39" width="5" height="5" rx="2.5" fill="#FDE68A" />

        {/* Tail light */}
        <rect x="5" y="39" width="5" height="5" rx="2.5" fill="#FCA5A5" />

        {/* Wheel left */}
        <circle cx="18" cy="53" r="7" fill="#292524" />
        <circle cx="18" cy="53" r="3" fill="#78716C" />

        {/* Wheel right */}
        <circle cx="46" cy="53" r="7" fill="#292524" />
        <circle cx="46" cy="53" r="3" fill="#78716C" />

        {/* Door seam */}
        <line x1="32" y1="35" x2="32" y2="51" stroke="#F0EDEC" strokeWidth="1.5" />
      </svg>

      {/* ── Wordmark ─────────────────────────────────────────────── */}
      {variant === 'full' && (
        <span
          style={{
            fontFamily: 'Fredoka, system-ui, sans-serif',
            fontSize,
            fontWeight: 600,
            color: textColour,
            lineHeight: 1,
            letterSpacing: '0.01em',
          }}
        >
          drumko
        </span>
      )}
    </div>
  )
}
