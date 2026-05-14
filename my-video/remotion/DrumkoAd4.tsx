/**
 * drumko-ad-4 — "Before & After" (13s / 390 frames)
 * Problem (dark/red) → rešenje (zeleno) kontrast format.
 * Klasičan before/after koji dobro radi na socijalnim mrežama.
 */
import {
  AbsoluteFill, Audio, Sequence, spring, interpolate,
  useCurrentFrame, useVideoConfig, staticFile,
} from "remotion";

const C = {
  primary: "#F97316", primaryDark: "#EA580C", primaryShadow: "#C2410C",
  success: "#22C55E", blue: "#38BDF8", red: "#EF4444",
  dark: "#1C1917", text: "#292524", muted: "#78716C",
  white: "#FFFFFF", bg: "#FAFAF9",
};

function clamp(v: number) { return Math.max(0, Math.min(1, v)); }
function fadeIn(frame: number, start: number, dur = 16) {
  return clamp(interpolate(frame, [start, start + dur], [0, 1]));
}
function sp(frame: number, start: number, fps: number, stiffness = 130, damping = 18) {
  return spring({ frame: frame - start, fps, config: { stiffness, damping } });
}

function DrumkoCar({ size = 62, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={`cg4-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C" /><stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="58" height="57" rx="18" fill={C.primaryShadow} opacity={0.35} />
      <rect x="0" y="0" width="62" height="62" rx="18" fill={`url(#cg4-${uid})`} />
      <ellipse cx="31" cy="10" rx="22" ry="6" fill="rgba(255,255,255,0.22)" />
      <rect x="7" y="35" width="50" height="18" rx="7" fill="white" />
      <rect x="13" y="22" width="38" height="17" rx="8" fill="white" />
      <rect x="16" y="25" width="13" height="11" rx="4" fill={C.blue} opacity={0.9} />
      <rect x="33" y="25" width="13" height="11" rx="4" fill={C.blue} opacity={0.9} />
      <rect x="30" y="25" width="4" height="11" fill="white" />
      <rect x="54" y="39" width="5" height="5" rx="2.5" fill="#FDE68A" />
      <rect x="5" y="39" width="5" height="5" rx="2.5" fill="#FCA5A5" />
      <circle cx="18" cy="53" r="7" fill={C.dark} /><circle cx="18" cy="53" r="3" fill={C.muted} />
      <circle cx="46" cy="53" r="7" fill={C.dark} /><circle cx="46" cy="53" r="3" fill={C.muted} />
      <line x1="32" y1="35" x2="32" y2="51" stroke="#F0EDEC" strokeWidth="1.5" />
    </svg>
  );
}

// ── Scene 1 — BEFORE (0–140f) ──────────────────────────────────────────────
const BEFORE_ITEMS = [
  "Prošao pored pumpe",
  "Zaboravio čarape",
  "Ostao bez para na pola puta",
];

function SceneBefore() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = sp(frame, 2, fps, 160, 16);

  // Shake effect on title (frustration)
  const shake = frame > 10 && frame < 60
    ? 4 * Math.sin(frame * 1.8) * Math.exp(-(frame - 10) / 30)
    : 0;

  return (
    <AbsoluteFill style={{ background: "#18100F", justifyContent: "center", flexDirection: "column", padding: "0 72px" }}>
      {/* Red noise overlay */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px) translateX(${shake}px)`, opacity: titleS, marginBottom: 52 }}>
          <p style={{ fontSize: 52, fontWeight: 800, color: "rgba(255,255,255,0.45)", fontFamily: "system-ui, sans-serif", letterSpacing: -1, margin: "0 0 8px" }}>
            Pre drumka...
          </p>
          <p style={{ fontSize: 76, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", lineHeight: 1.1, letterSpacing: -2.5, margin: 0 }}>
            Svaki put<br /><span style={{ color: C.red }}>isti haos.</span>
          </p>
        </div>

        {BEFORE_ITEMS.map((item, i) => {
          const s = sp(frame, 24 + i * 16, fps, 140, 18);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 24, marginBottom: 28,
              transform: `translateX(${interpolate(s, [0, 1], [-80, 0])}px)`,
              opacity: s,
            }}>
              {/* Red X */}
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <p style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.75)", fontFamily: "system-ui, sans-serif", margin: 0, letterSpacing: -0.5 }}>{item}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Flash transition (140–160f) ────────────────────────────────────────────
function SceneFlash() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5, 15, 20], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: C.white, opacity, pointerEvents: "none" }} />;
}

// ── Scene 2 — AFTER (160–320f) ────────────────────────────────────────────
const AFTER_ITEMS = [
  { text: "Pumpa uz rutu — uvek", color: C.success },
  { text: "Lista za pakovanje — gotova", color: C.success },
  { text: "Budžet planiran unapred", color: C.success },
];

function SceneAfter() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = sp(frame, 2, fps, 160, 16);

  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", flexDirection: "column", padding: "0 72px" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.06) 0%, transparent 70%)" }} />
      {/* Green top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${C.success}, #16A34A)` }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`, opacity: titleS, marginBottom: 52 }}>
          <p style={{ fontSize: 52, fontWeight: 800, color: C.muted, fontFamily: "system-ui, sans-serif", letterSpacing: -1, margin: "0 0 8px" }}>
            Sa drumko...
          </p>
          <p style={{ fontSize: 76, fontWeight: 900, color: C.text, fontFamily: "system-ui, sans-serif", lineHeight: 1.1, letterSpacing: -2.5, margin: 0 }}>
            Svaki put<br /><span style={{ color: C.success }}>pod kontrolom.</span>
          </p>
        </div>

        {AFTER_ITEMS.map((item, i) => {
          const s = sp(frame, 22 + i * 16, fps, 140, 18);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 24, marginBottom: 28,
              transform: `translateX(${interpolate(s, [0, 1], [-80, 0])}px)`,
              opacity: s,
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p style={{ fontSize: 40, fontWeight: 700, color: C.text, fontFamily: "system-ui, sans-serif", margin: 0, letterSpacing: -0.5 }}>{item.text}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── CTA (320–390f) ─────────────────────────────────────────────────────────
function SceneCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(frame, 4, fps, 190, 22);
  const btnS = sp(frame, 28, fps, 200, 22);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.1) 0%, transparent 60%)` }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `scale(${s})`, opacity: s }}><DrumkoCar size={160} uid="cta4" /></div>
        <p style={{ fontSize: 110, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -4, margin: "28px 0 0", lineHeight: 1 }}>drumko</p>
        <p style={{ fontSize: 44, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontFamily: "system-ui, sans-serif", margin: "20px 0 0", opacity: fadeIn(frame, 18, 14), letterSpacing: -0.5 }}>
          Besplatno. Počni odmah.
        </p>
        <p style={{ fontSize: 34, fontWeight: 500, color: "rgba(255,255,255,0.6)", fontFamily: "system-ui, sans-serif", margin: "12px 0 0", opacity: fadeIn(frame, 28, 14) }}>drumko.app</p>
        <div style={{ marginTop: 44, background: C.white, borderRadius: 22, padding: "26px 64px", boxShadow: "0 8px 0 rgba(0,0,0,0.12)", transform: `scale(${btnS})`, opacity: btnS }}>
          <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: C.primary, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>Kreiraj prvi put</p>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Fade() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#000", opacity, pointerEvents: "none" }} />;
}

export const DrumkoAd4: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("sounds/utope-rhythmic-reverie.mp3")} volume={0.5} startFrom={60} />
    <Sequence from={0} durationInFrames={150} name="Before"><SceneBefore /></Sequence>
    <Sequence from={140} durationInFrames={20} name="Flash"><SceneFlash /></Sequence>
    <Sequence from={152} durationInFrames={168} name="After"><SceneAfter /></Sequence>
    <Sequence from={310} durationInFrames={10} name="Fade"><Fade /></Sequence>
    <Sequence from={320} durationInFrames={70} name="CTA"><SceneCTA /></Sequence>
  </AbsoluteFill>
);
