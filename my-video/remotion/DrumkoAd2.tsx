/**
 * drumko-ad-2 — "Fast Hook" (10s / 300 frames)
 * Ultra-brz, direktno u problem, bez uvodne scene.
 * Idealno za prvih 3s TikTok hook.
 */
import {
  AbsoluteFill, Audio, Sequence, spring, interpolate,
  useCurrentFrame, useVideoConfig, staticFile,
} from "remotion";

const C = {
  primary: "#F97316", primaryDark: "#EA580C", primaryShadow: "#C2410C",
  success: "#22C55E", blue: "#38BDF8",
  dark: "#1C1917", text: "#292524", muted: "#78716C",
  white: "#FFFFFF", bg: "#FAFAF9",
};

function clamp(v: number) { return Math.max(0, Math.min(1, v)); }
function fadeIn(frame: number, start: number, dur = 15) {
  return clamp(interpolate(frame, [start, start + dur], [0, 1]));
}
function sp(frame: number, start: number, fps: number, stiffness = 130, damping = 18) {
  return spring({ frame: frame - start, fps, config: { stiffness, damping } });
}

function DrumkoCar({ size = 62, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={`cg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C" /><stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="58" height="57" rx="18" fill={C.primaryShadow} opacity={0.35} />
      <rect x="0" y="0" width="62" height="62" rx="18" fill={`url(#cg-${uid})`} />
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

// ── Scene 1 — Hook (0–90f) ─────────────────────────────────────────────────
const QUESTIONS = [
  "Gde da stanem na putu?",
  "Koliko goriva treba?",
  "Šta da povedem sa sobom?",
];

function SceneHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = sp(frame, 0, fps, 160, 16);
  const titleStyle = {
    transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
    opacity: titleS,
  };

  return (
    <AbsoluteFill style={{ background: C.dark, justifyContent: "center", flexDirection: "column", padding: "0 72px" }}>
      {/* Dot grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.12) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={titleStyle}>
          <p style={{ fontSize: 68, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", lineHeight: 1.15, letterSpacing: -2, margin: "0 0 48px" }}>
            Planiraš<br /><span style={{ color: C.primary }}>put?</span>
          </p>
        </div>

        {QUESTIONS.map((q, i) => {
          const s = sp(frame, 12 + i * 14, fps, 140, 18);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 22, marginBottom: 28,
              transform: `translateX(${interpolate(s, [0, 1], [-90, 0])}px)`,
              opacity: s,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(249,115,22,0.15)", border: "1.5px solid rgba(249,115,22,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p style={{ fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "system-ui, sans-serif", margin: 0, letterSpacing: -0.5 }}>{q}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 2 — Solution (90–220f) ───────────────────────────────────────────
const PILLS = [
  { label: "Pametne pauze", color: C.primary },
  { label: "Lista za pakovanje", color: C.success },
  { label: "Budžet putovanja", color: "#3B82F6" },
];

function SceneSolution() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const carS = sp(frame, 4, fps, 200, 22);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(145deg, #FFF7ED 0%, ${C.bg} 100%)`, alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "0 72px" }}>
      {/* Orange accent stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})` }} />

      <div style={{ transform: `scale(${carS})`, opacity: carS, marginBottom: 32 }}>
        <DrumkoCar size={120} uid="sol" />
      </div>

      <div style={{ ...{ transform: `translateY(${interpolate(sp(frame, 18, fps), [0, 1], [30, 0])}px)`, opacity: sp(frame, 18, fps) }, textAlign: "center", marginBottom: 52 }}>
        <p style={{ fontSize: 72, fontWeight: 900, color: C.text, fontFamily: "system-ui, sans-serif", letterSpacing: -2.5, margin: 0, lineHeight: 1 }}>
          drumko<span style={{ color: C.primary }}>.</span>
        </p>
        <p style={{ fontSize: 36, fontWeight: 600, color: C.muted, fontFamily: "system-ui, sans-serif", margin: "12px 0 0", letterSpacing: -0.3 }}>
          Sve odgovore na jednom mestu.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        {PILLS.map((p, i) => {
          const s = sp(frame, 28 + i * 16, fps, 150, 18);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 20,
              background: `${p.color}10`, border: `1.5px solid ${p.color}35`,
              borderRadius: 20, padding: "22px 32px",
              transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`,
              opacity: s,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 38, fontWeight: 700, color: C.text, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>{p.label}</p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 3 — CTA (220–300f) ───────────────────────────────────────────────
function SceneCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(frame, 5, fps, 180, 20);
  const btnS = sp(frame, 30, fps, 200, 22);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0 }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.1) 0%, transparent 60%)` }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `scale(${s})`, opacity: s }}>
          <DrumkoCar size={160} uid="cta2" />
        </div>
        <p style={{ fontSize: 110, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -4, margin: "28px 0 0", lineHeight: 1 }}>drumko</p>
        <p style={{ fontSize: 38, fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "system-ui, sans-serif", margin: "20px 0 0", opacity: fadeIn(frame, 22, 15) }}>drumko.app</p>
        <div style={{ marginTop: 44, background: C.white, borderRadius: 22, padding: "26px 64px", boxShadow: "0 8px 0 rgba(0,0,0,0.12), 0 16px 36px rgba(0,0,0,0.15)", transform: `scale(${btnS})`, opacity: btnS }}>
          <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: C.primary, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>Kreiraj prvi put →</p>
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

export const DrumkoAd2: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("sounds/utope-rhythmic-reverie.mp3")} volume={0.55} />
    <Sequence from={0} durationInFrames={100} name="Hook"><SceneHook /></Sequence>
    <Sequence from={90} durationInFrames={10} name="Fade 1"><Fade /></Sequence>
    <Sequence from={100} durationInFrames={130} name="Solution"><SceneSolution /></Sequence>
    <Sequence from={220} durationInFrames={10} name="Fade 2"><Fade /></Sequence>
    <Sequence from={230} durationInFrames={70} name="CTA"><SceneCTA /></Sequence>
  </AbsoluteFill>
);
