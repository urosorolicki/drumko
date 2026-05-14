/**
 * drumko-ad-3 — "Feature Spotlights" (15s / 450 frames)
 * Svaka funkcija dobija sopstveni full-screen momenat.
 * Minimalistički, usredsređen na vrednost proizvoda.
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
function fadeIn(frame: number, start: number, dur = 16) {
  return clamp(interpolate(frame, [start, start + dur], [0, 1]));
}
function sp(frame: number, start: number, fps: number, stiffness = 130, damping = 18) {
  return spring({ frame: frame - start, fps, config: { stiffness, damping } });
}
function slideUp(frame: number, start: number, fps: number) {
  const s = sp(frame, start, fps, 120, 16);
  return { transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`, opacity: s };
}

function DrumkoCar({ size = 62, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={`cg3-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C" /><stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="58" height="57" rx="18" fill={C.primaryShadow} opacity={0.35} />
      <rect x="0" y="0" width="62" height="62" rx="18" fill={`url(#cg3-${uid})`} />
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

// ── Intro (0–70f) ──────────────────────────────────────────────────────────
function SceneIntro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const carS = sp(frame, 2, fps, 190, 20);
  const wordS = sp(frame, 20, fps, 140, 16);

  return (
    <AbsoluteFill style={{ background: C.dark, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.13) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <div style={{ transform: `scale(${carS})`, opacity: carS }}>
          <DrumkoCar size={180} uid="i3" />
        </div>
        <div style={{ transform: `translateY(${interpolate(wordS, [0, 1], [30, 0])}px)`, opacity: wordS }}>
          <p style={{ fontSize: 120, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -4, margin: 0, lineHeight: 1 }}>drumko</p>
          <p style={{ fontSize: 40, fontWeight: 500, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui, sans-serif", margin: "14px 0 0", letterSpacing: -0.5, textAlign: "center" }}>
            Tvoj saputnik na putu
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Feature Card Scene ─────────────────────────────────────────────────────
interface FeatureSceneProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  subtext: string;
  accentColor: string;
  bgFrom: string;
  bgTo: string;
}

function FeatureScene({ icon, title, desc, subtext, accentColor, bgFrom, bgTo }: FeatureSceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Big icon pops in
  const iconS = sp(frame, 5, fps, 180, 20);
  // Title slides up
  const titleSt = slideUp(frame, 22, fps);
  // Desc fades
  const descOpacity = fadeIn(frame, 40, 18);
  // Subtext (stat or detail) fades
  const subOpacity = fadeIn(frame, 60, 18);
  // Bottom bar grows
  const barWidth = interpolate(sp(frame, 50, fps, 100, 18), [0, 1], [0, 100]);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${bgFrom} 0%, ${bgTo} 100%)`, alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "0 80px" }}>
      {/* Radial glow */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`, top: "30%", left: "50%", transform: "translate(-50%,-50%)" }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Icon circle */}
        <div style={{ width: 200, height: 200, borderRadius: 56, background: `${accentColor}18`, border: `3px solid ${accentColor}35`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${iconS})`, opacity: iconS, marginBottom: 52 }}>
          {icon}
        </div>

        <div style={titleSt}>
          <p style={{ fontSize: 72, fontWeight: 900, color: C.text, fontFamily: "system-ui, sans-serif", letterSpacing: -2.5, margin: 0, lineHeight: 1 }}>{title}</p>
        </div>

        <p style={{ fontSize: 42, fontWeight: 500, color: C.muted, fontFamily: "system-ui, sans-serif", margin: "24px 0 0", opacity: descOpacity, lineHeight: 1.4, letterSpacing: -0.5 }}>{desc}</p>

        <div style={{ marginTop: 48, background: `${accentColor}15`, border: `1.5px solid ${accentColor}30`, borderRadius: 20, padding: "22px 48px", opacity: subOpacity }}>
          <p style={{ margin: 0, fontSize: 40, fontWeight: 700, color: accentColor, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>{subtext}</p>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 60, width: 600, height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${barWidth}%`, background: accentColor, borderRadius: 3 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── CTA (400–450f) ─────────────────────────────────────────────────────────
function SceneCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(frame, 5, fps, 180, 20);
  const btnS = sp(frame, 25, fps, 200, 22);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 50% 35%, rgba(255,255,255,0.1) 0%, transparent 55%)` }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `scale(${s})`, opacity: s }}><DrumkoCar size={160} uid="cta3" /></div>
        <p style={{ fontSize: 110, fontWeight: 900, color: C.white, fontFamily: "system-ui, sans-serif", letterSpacing: -4, margin: "28px 0 0", lineHeight: 1 }}>drumko</p>
        <p style={{ fontSize: 38, fontWeight: 500, color: "rgba(255,255,255,0.7)", fontFamily: "system-ui, sans-serif", margin: "16px 0 0", opacity: fadeIn(frame, 20, 15) }}>drumko.app</p>
        <div style={{ marginTop: 44, background: C.white, borderRadius: 22, padding: "26px 64px", boxShadow: "0 8px 0 rgba(0,0,0,0.12)", transform: `scale(${btnS})`, opacity: btnS }}>
          <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: C.primary, fontFamily: "system-ui, sans-serif", letterSpacing: -0.5 }}>Isprobaj besplatno</p>
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

export const DrumkoAd3: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("sounds/utope-nature.mp3")} volume={0.55} />

    <Sequence from={0} durationInFrames={72} name="Intro"><SceneIntro /></Sequence>
    <Sequence from={62} durationInFrames={10} name="Fade 1"><Fade /></Sequence>

    {/* Feature 1 — Pauze */}
    <Sequence from={72} durationInFrames={120} name="Feature 1">
      <FeatureScene
        icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>}
        title="Pametne pauze"
        desc={"Pumpe, restorani i odmarališta\nuz tvoju rutu"}
        subtext="Uvek znaš gde da staneš"
        accentColor={C.primary}
        bgFrom="#FFF7ED"
        bgTo={C.bg}
      />
    </Sequence>
    <Sequence from={182} durationInFrames={10} name="Fade 2"><Fade /></Sequence>

    {/* Feature 2 — Lista */}
    <Sequence from={192} durationInFrames={110} name="Feature 2">
      <FeatureScene
        icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
        title="Lista za pakovanje"
        desc={"Automatski generisana\npo dužini puta"}
        subtext="Nikad više zaboravljenih stvari"
        accentColor={C.success}
        bgFrom="#F0FDF4"
        bgTo={C.bg}
      />
    </Sequence>
    <Sequence from={292} durationInFrames={10} name="Fade 3"><Fade /></Sequence>

    {/* Feature 3 — Budžet */}
    <Sequence from={302} durationInFrames={110} name="Feature 3">
      <FeatureScene
        icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
        title="Budžet putovanja"
        desc={"Gorivo, smeštaj, hrana —\nsve na jednom mestu"}
        subtext="Planiraš pare unapred"
        accentColor="#3B82F6"
        bgFrom="#EFF6FF"
        bgTo={C.bg}
      />
    </Sequence>
    <Sequence from={402} durationInFrames={10} name="Fade 4"><Fade /></Sequence>

    <Sequence from={412} durationInFrames={38} name="CTA"><SceneCTA /></Sequence>
  </AbsoluteFill>
);
