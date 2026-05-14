/**
 * drumko-ad-5 — "Dark Cinematic" (15s / 450 frames)
 * Premium tamni dizajn, spore elegantne animacije, neon akcenti.
 * Za premium feel Instagram Reels.
 */
import {
  AbsoluteFill, Audio, Sequence, spring, interpolate,
  useCurrentFrame, useVideoConfig, staticFile,
} from "remotion";

const C = {
  primary: "#F97316", primaryDark: "#EA580C", primaryShadow: "#C2410C",
  success: "#22C55E", blue: "#38BDF8",
  dark: "#0C0A09", darkMid: "#1C1917", text: "#292524", muted: "#78716C",
  white: "#FFFFFF", surface: "#1C1917",
};

function clamp(v: number) { return Math.max(0, Math.min(1, v)); }
function fadeIn(frame: number, start: number, dur = 20) {
  return clamp(interpolate(frame, [start, start + dur], [0, 1]));
}
function sp(frame: number, start: number, fps: number, stiffness = 80, damping = 16) {
  return spring({ frame: frame - start, fps, config: { stiffness, damping } });
}

function DrumkoCar({ size = 62, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={`cg5-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C" /><stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="58" height="57" rx="18" fill={C.primaryShadow} opacity={0.35} />
      <rect x="0" y="0" width="62" height="62" rx="18" fill={`url(#cg5-${uid})`} />
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

// ── Scene 1 — Logo reveal (0–110f) ────────────────────────────────────────
function SceneLogoReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow build-up glow
  const glowOpacity = clamp(interpolate(frame, [0, 60], [0, 1]));
  const glowScale = interpolate(frame, [0, 80], [0.4, 1.2], { extrapolateRight: "clamp" });

  // Car slowly zooms from tiny
  const carScale = sp(frame, 5, fps, 55, 14);
  const carOpacity = clamp(interpolate(frame, [5, 30], [0, 1]));

  // Wordmark reveals character by character via clip
  const wordOpacity = fadeIn(frame, 45, 30);
  const wordY = interpolate(sp(frame, 45, fps, 70, 16), [0, 1], [40, 0]);

  // Tagline
  const tagOpacity = fadeIn(frame, 72, 22);

  // Floating particles
  const particles = [
    { x: 200, y: 700, r: 3, delay: 10 },
    { x: 820, y: 400, r: 2, delay: 20 },
    { x: 150, y: 1200, r: 4, delay: 5 },
    { x: 900, y: 1400, r: 2, delay: 30 },
    { x: 500, y: 300, r: 3, delay: 15 },
    { x: 650, y: 1600, r: 2, delay: 25 },
  ];

  return (
    <AbsoluteFill style={{ background: C.dark, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {/* Floating particles */}
      {particles.map((p, i) => {
        const pOpacity = clamp(interpolate(frame - p.delay, [0, 25], [0, 0.4]));
        const pY = interpolate(frame - p.delay, [0, 110], [0, -30]);
        return (
          <div key={i} style={{
            position: "absolute", left: p.x, top: p.y + pY,
            width: p.r * 2, height: p.r * 2, borderRadius: "50%",
            background: C.primary, opacity: pOpacity,
          }} />
        );
      })}

      {/* Glow ring behind logo */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(249,115,22,${0.18 * glowOpacity}) 0%, transparent 70%)`,
        transform: `scale(${glowScale})`,
      }} />
      {/* Second outer glow */}
      <div style={{
        position: "absolute", width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(249,115,22,${0.06 * glowOpacity}) 0%, transparent 65%)`,
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `scale(${carScale})`, opacity: carOpacity }}>
          <DrumkoCar size={220} uid="rev" />
        </div>

        <div style={{ transform: `translateY(${wordY}px)`, opacity: wordOpacity, marginTop: 44 }}>
          <p style={{ fontSize: 148, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -6, margin: 0, lineHeight: 1 }}>
            drumko
          </p>
        </div>

        <p style={{ fontSize: 32, fontWeight: 500, color: "rgba(255,255,255,0.45)", fontFamily: "system-ui, sans-serif", margin: "20px 0 0", opacity: tagOpacity, letterSpacing: 2, textTransform: "uppercase" }}>
          Planiraj. Vozi. Uživaj.
        </p>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 2 — Dark feature cards (110–290f) ───────────────────────────────
const DARK_FEATURES = [
  { icon: "📍", label: "Pauze uz rutu", value: "Pumpe & restorani", color: C.primary },
  { icon: "✅", label: "Lista pakovanja", value: "Auto-generisana", color: C.success },
  { icon: "💰", label: "Budžet putovanja", value: "Gorivo, hrana, smeštaj", color: "#60A5FA" },
];

function SceneDarkFeatures() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerS = sp(frame, 5, fps, 90, 16);

  return (
    <AbsoluteFill style={{ background: C.dark, alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "80px 64px" }}>
      {/* Subtle grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ transform: `translateY(${interpolate(headerS, [0, 1], [30, 0])}px)`, opacity: headerS, marginBottom: 60, textAlign: "center" }}>
          <p style={{ fontSize: 58, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -2, margin: 0, lineHeight: 1.15 }}>
            Sve što ti treba<br />
            <span style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              na jednom mestu.
            </span>
          </p>
        </div>

        {DARK_FEATURES.map((feat, i) => {
          const s = sp(frame, 22 + i * 22, fps, 100, 16);
          const glowPulse = 0.08 + 0.04 * Math.sin(((frame - i * 15) / 35) * Math.PI);

          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 36,
              background: `rgba(255,255,255,0.04)`,
              border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `3px solid ${feat.color}`,
              borderRadius: 24, padding: "36px 44px", marginBottom: 24,
              boxShadow: `0 0 30px ${feat.color}${Math.round(glowPulse * 255).toString(16).padStart(2, "0")}`,
              transform: `translateX(${interpolate(s, [0, 1], [-70, 0])}px)`,
              opacity: s,
            }}>
              <div style={{ width: 80, height: 80, borderRadius: 22, background: `${feat.color}14`, border: `1.5px solid ${feat.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 40 }}>
                {feat.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 42, fontWeight: 800, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>{feat.label}</p>
                <p style={{ margin: "6px 0 0", fontSize: 32, color: `${feat.color}cc`, fontFamily: "system-ui, sans-serif" }}>{feat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 3 — CTA dark (290–450f) ────────────────────────────────────────
function SceneCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = sp(frame, 5, fps, 100, 16);
  const btnS = sp(frame, 60, fps, 180, 20);
  const glowOpacity = clamp(fadeIn(frame, 5, 30)) * (0.6 + 0.2 * Math.sin((frame / 25) * Math.PI));
  const glowScale = 1 + 0.06 * Math.sin((frame / 22) * Math.PI);

  const lineOpacity = fadeIn(frame, 80, 20);

  return (
    <AbsoluteFill style={{ background: C.dark, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {/* Outer glow */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(249,115,22,${0.12 * glowOpacity}) 0%, transparent 70%)`,
        transform: `scale(${glowScale})`,
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Orange ring */}
        <div style={{
          width: 260, height: 260, borderRadius: "50%",
          border: `3px solid rgba(249,115,22,${0.3 * glowOpacity})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${glowScale}) translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
          opacity: s,
        }}>
          <DrumkoCar size={180} uid="cta5" />
        </div>

        <p style={{ fontSize: 128, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -5, margin: "36px 0 0", lineHeight: 1, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)` }}>
          drumko
        </p>

        <p style={{ fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.55)", fontFamily: "system-ui, sans-serif", margin: "16px 0 0", opacity: fadeIn(frame, 40, 18), letterSpacing: -0.5 }}>
          Besplatno. Počni odmah.
        </p>

        <p style={{ fontSize: 34, fontWeight: 500, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui, sans-serif", margin: "10px 0 0", opacity: fadeIn(frame, 55, 18) }}>
          drumko.app
        </p>

        {/* Divider */}
        <div style={{ width: interpolate(lineOpacity, [0, 1], [0, 400]), height: 1, background: "rgba(255,255,255,0.12)", margin: "44px auto 44px", opacity: lineOpacity }} />

        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          borderRadius: 24, padding: "30px 80px",
          boxShadow: `0 0 40px rgba(249,115,22,0.4), 0 8px 0 rgba(0,0,0,0.25)`,
          transform: `scale(${btnS})`, opacity: btnS,
        }}>
          <p style={{ margin: 0, fontSize: 42, fontWeight: 800, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>
            Kreiraj put →
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Fade() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#000", opacity, pointerEvents: "none" }} />;
}

export const DrumkoAd5: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("sounds/utope-i-woke-up-in-a-dream.mp3")} volume={0.6} />
    <Sequence from={0} durationInFrames={122} name="Logo Reveal"><SceneLogoReveal /></Sequence>
    <Sequence from={110} durationInFrames={12} name="Fade 1"><Fade /></Sequence>
    <Sequence from={122} durationInFrames={178} name="Dark Features"><SceneDarkFeatures /></Sequence>
    <Sequence from={290} durationInFrames={12} name="Fade 2"><Fade /></Sequence>
    <Sequence from={302} durationInFrames={148} name="CTA"><SceneCTA /></Sequence>
  </AbsoluteFill>
);
