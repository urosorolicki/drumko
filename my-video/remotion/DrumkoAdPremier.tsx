/**
 * drumko-premier — "Born for the Road" (18s / 540 frames)
 *
 * Concept: Road movie trailer. Brutalist block typography, cinematic
 * white-flash cuts, full-screen canvas (no phone mockup), aggressive
 * spring physics. Design: Vibrant & Block-based per ui-ux-pro-max.
 *
 * Scenes:
 *  0–80    Hook       "PLANIRAŠ PUT?"  — words slam in from opposite sides
 *  80–170  Chaos      3 rapid problem panels (26f each)
 *  165–172 Flash      7-frame white flash
 *  172–270 Brand      Orange bg, car + wordmark explosion
 *  270–415 Features   3 bold full-screen feature cards (48f each)
 *  415–470 Route      Full-screen animated route drawing
 *  470–540 CTA        Final CTA — button, URL, outro
 */
import {
  AbsoluteFill, Audio, Sequence, spring, interpolate,
  useCurrentFrame, useVideoConfig, staticFile,
} from "remotion";

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  black:   "#0D0D0D",
  orange:  "#F97316",
  dark:    "#EA580C",
  shadow:  "#C2410C",
  yellow:  "#FBBF24",
  white:   "#FFFFFF",
  offwhite:"#FAFAF9",
  muted:   "#78716C",
  blue:    "#38BDF8",
  green:   "#22C55E",
  red:     "#EF4444",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function cl(v: number) { return Math.max(0, Math.min(1, v)); }
function fi(frame: number, start: number, dur = 15) {
  return cl(interpolate(frame, [start, start + dur], [0, 1]));
}
/** Aggressive spring — high stiffness for punchy snap */
function snap(frame: number, start: number, fps: number, stiff = 320, damp = 24) {
  return spring({ frame: frame - start, fps, config: { stiffness: stiff, damping: damp } });
}
/** Smooth spring — lower stiffness for elegant feel */
function smooth(frame: number, start: number, fps: number) {
  return spring({ frame: frame - start, fps, config: { stiffness: 70, damping: 15 } });
}

// ── Drumko Car (inlined SVG) ───────────────────────────────────────────────
function Car({ size = 62, uid = "a", invert = false }: { size?: number; uid?: string; invert?: boolean }) {
  const bodyColor = invert ? C.black : C.white;
  const bgTop = invert ? C.white : "#FB923C";
  const bgBot = invert ? C.offwhite : C.dark;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bgTop} /><stop offset="100%" stopColor={bgBot} />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="58" height="57" rx="18" fill={invert ? "rgba(0,0,0,0.2)" : C.shadow} opacity={0.35} />
      <rect x="0" y="0" width="62" height="62" rx="18" fill={`url(#g-${uid})`} />
      <ellipse cx="31" cy="10" rx="22" ry="6" fill="rgba(255,255,255,0.22)" />
      <rect x="7" y="35" width="50" height="18" rx="7" fill={bodyColor} />
      <rect x="13" y="22" width="38" height="17" rx="8" fill={bodyColor} />
      <rect x="16" y="25" width="13" height="11" rx="4" fill={C.blue} opacity={0.9} />
      <rect x="33" y="25" width="13" height="11" rx="4" fill={C.blue} opacity={0.9} />
      <rect x="30" y="25" width="4" height="11" fill={bodyColor} />
      <rect x="54" y="39" width="5" height="5" rx="2.5" fill="#FDE68A" />
      <rect x="5" y="39" width="5" height="5" rx="2.5" fill="#FCA5A5" />
      <circle cx="18" cy="53" r="7" fill={C.black} /><circle cx="18" cy="53" r="3" fill={C.muted} />
      <circle cx="46" cy="53" r="7" fill={C.black} /><circle cx="46" cy="53" r="3" fill={C.muted} />
      <line x1="32" y1="35" x2="32" y2="51" stroke={invert ? "rgba(255,255,255,0.15)" : "#F0EDEC"} strokeWidth="1.5" />
    </svg>
  );
}

// ── Scene 1 — HOOK (0–80f) ────────────────────────────────────────────────
// "PLANIRAŠ" slams from top, "PUT?" slams from bottom. Max brutalist scale.
function SceneHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Word 1 comes from top
  const w1 = snap(frame, 2, fps, 380, 28);
  const w1y = interpolate(w1, [0, 1], [-400, 0]);

  // Word 2 comes from bottom
  const w2 = snap(frame, 16, fps, 340, 26);
  const w2y = interpolate(w2, [0, 1], [400, 0]);

  // Car sneaks in bottom right
  const carS = smooth(frame, 40, fps);
  const carOpacity = fi(frame, 40, 20);

  // Orange underline bar grows
  const barW = interpolate(snap(frame, 28, fps, 120, 18), [0, 1], [0, 900]);

  // Particle flash on beat (frame 30)
  const flashOpacity = cl(interpolate(frame, [28, 30, 34], [0, 0.25, 0]));

  return (
    <AbsoluteFill style={{ background: C.black, overflow: "hidden" }}>
      {/* Grain texture via repeating gradient */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)`,
      }} />

      {/* Beat flash */}
      <div style={{ position: "absolute", inset: 0, background: C.orange, opacity: flashOpacity, pointerEvents: "none" }} />

      {/* PLANIRAŠ */}
      <div style={{
        position: "absolute", top: "18%", left: 0, right: 0, textAlign: "center",
        transform: `translateY(${w1y}px)`, opacity: w1,
      }}>
        <span style={{
          fontSize: 186, fontWeight: 900, color: C.white,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -8, lineHeight: 1, display: "block",
        }}>
          PLANIRAŠ
        </span>
      </div>

      {/* Orange bar */}
      <div style={{
        position: "absolute", top: "52%", left: "50%",
        transform: "translateX(-50%)",
        width: barW, height: 12, background: C.orange, borderRadius: 6,
      }} />

      {/* PUT? */}
      <div style={{
        position: "absolute", bottom: "16%", left: 0, right: 0, textAlign: "center",
        transform: `translateY(${w2y}px)`, opacity: w2,
      }}>
        <span style={{
          fontSize: 210, fontWeight: 900, color: C.orange,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -10, lineHeight: 1, display: "block",
        }}>
          PUT?
        </span>
      </div>

      {/* Car — bottom right watermark */}
      <div style={{
        position: "absolute", bottom: 60, right: 60,
        transform: `scale(${carS})`, opacity: carOpacity * 0.6,
      }}>
        <Car size={80} uid="hook" />
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 2 — CHAOS panels (80–170f) ─────────────────────────────────────
// 3 rapid word panels, each 28 frames. Alternating dark/white bg.
const CHAOS = [
  { word: "PUMPA?",    sub: "gde je sledeća?", bg: C.black, fg: C.orange, sfg: "rgba(255,255,255,0.4)" },
  { word: "NOĆENJE?", sub: "ima li mesta?",    bg: C.orange, fg: C.black, sfg: "rgba(0,0,0,0.5)" },
  { word: "PARA?",    sub: "hoće li stići?",   bg: C.black, fg: C.white, sfg: C.orange },
];

function ChaosPanel({ word, sub, bg, fg, sfg, localFrame, fps }: {
  word: string; sub: string; bg: string; fg: string; sfg: string; localFrame: number; fps: number;
}) {
  const s = snap(localFrame, 0, fps, 400, 30);
  const wordY = interpolate(s, [0, 1], [200, 0]);
  const subOpacity = fi(localFrame, 8, 10);

  return (
    <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ transform: `translateY(${wordY}px)`, opacity: s, textAlign: "center" }}>
        <span style={{
          fontSize: 172, fontWeight: 900, color: fg,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -7, lineHeight: 1, display: "block",
        }}>
          {word}
        </span>
        <span style={{
          fontSize: 48, fontWeight: 600, color: sfg,
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "block", marginTop: 16, opacity: subOpacity, letterSpacing: -0.5,
        }}>
          {sub}
        </span>
      </div>
    </AbsoluteFill>
  );
}

function SceneChaos() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panel = Math.min(2, Math.floor(frame / 30));
  const c = CHAOS[panel]!;

  return <ChaosPanel {...c} localFrame={frame % 30} fps={fps} />;
}

// ── Flash frame (165–172f) ────────────────────────────────────────────────
function SceneFlash() {
  const frame = useCurrentFrame();
  // Sharp spike: full white then fade
  const opacity = cl(interpolate(frame, [0, 1, 5, 7], [0, 1, 1, 0]));
  return <AbsoluteFill style={{ background: C.white, opacity, pointerEvents: "none" }} />;
}

// ── Scene 3 — BRAND EXPLOSION (172–270f) ─────────────────────────────────
function SceneBrand() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Explosive pop for car
  const carS = snap(frame, 0, fps, 500, 32);
  // Wordmark slides from left
  const wordX = interpolate(snap(frame, 12, fps, 280, 24), [0, 1], [-800, 0]);
  const wordOpacity = snap(frame, 12, fps, 280, 24);
  // Tagline fades
  const tagOpacity = fi(frame, 38, 18);
  // Orange ring expands
  const ringScale = interpolate(smooth(frame, 0, fps), [0, 1], [0.2, 1]);
  const ringOpacity = cl(interpolate(frame, [0, 8, 60, 98], [0, 0.35, 0.35, 0]));

  return (
    <AbsoluteFill style={{ background: C.orange, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)`,
        backgroundSize: "52px 52px",
      }} />

      {/* Expanding ring */}
      <div style={{
        position: "absolute", width: 900, height: 900, borderRadius: "50%",
        border: `6px solid rgba(255,255,255,0.25)`,
        transform: `scale(${ringScale})`, opacity: ringOpacity,
      }} />

      {/* Car pops in */}
      <div style={{ transform: `scale(${carS})`, opacity: carS, marginBottom: 36 }}>
        <Car size={220} uid="brand" invert />
      </div>

      {/* drumko wordmark slides from left */}
      <div style={{ transform: `translateX(${wordX}px)`, opacity: wordOpacity }}>
        <span style={{
          fontSize: 168, fontWeight: 900, color: C.white,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: -7, lineHeight: 1, display: "block",
          textShadow: "0 8px 0 rgba(0,0,0,0.15)",
        }}>
          drumko
        </span>
      </div>

      <p style={{
        fontSize: 48, fontWeight: 600, color: "rgba(255,255,255,0.85)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        margin: "20px 0 0", opacity: tagOpacity, letterSpacing: -0.5,
        textAlign: "center",
      }}>
        Jedan klik. Sve rešeno.
      </p>
    </AbsoluteFill>
  );
}

// ── Scene 4 — FEATURE CARDS (270–415f) ───────────────────────────────────
// 3 cards × 48f. Full screen, bold, no phone mockup.
const FEAT_DATA = [
  {
    bg: C.black, accent: C.orange, num: "01",
    title: "PAUZE\nUZ RUTU",
    desc: "Pumpe, restorani i odmarališta\ntačno uz tvoj put",
    icon: (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.6">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    bg: "#F0FDF4", accent: C.green, num: "02",
    title: "LISTA\nPAKOVANJA",
    desc: "Auto-generisana lista\npo dužini puta",
    icon: (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.6">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    bg: "#0F172A", accent: "#60A5FA", num: "03",
    title: "BUDŽET\nPUTOVANJA",
    desc: "Gorivo, smeštaj, hrana —\nsve na jednom mestu",
    icon: (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.6">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
];

function FeatureCard({ feat, localFrame, fps }: { feat: typeof FEAT_DATA[0]; localFrame: number; fps: number }) {
  const isLight = feat.bg.startsWith("#F");
  const textColor = isLight ? C.black : C.white;
  const mutedColor = isLight ? "#374151" : "rgba(255,255,255,0.55)";

  const numS = snap(localFrame, 0, fps, 350, 26);
  const iconS = snap(localFrame, 6, fps, 320, 24);
  const titleY = interpolate(snap(localFrame, 10, fps, 280, 22), [0, 1], [80, 0]);
  const titleOp = snap(localFrame, 10, fps, 280, 22);
  const descOp = fi(localFrame, 24, 14);
  const lineW = interpolate(snap(localFrame, 18, fps, 150, 18), [0, 1], [0, 700]);

  return (
    <AbsoluteFill style={{ background: feat.bg, padding: "100px 80px", justifyContent: "space-between", flexDirection: "column" }}>
      {/* Large background number */}
      <div style={{
        position: "absolute", right: 60, top: 80,
        fontSize: 320, fontWeight: 900, color: `${feat.accent}12`,
        fontFamily: "system-ui, sans-serif", lineHeight: 1, letterSpacing: -15,
        transform: `translateY(${interpolate(numS, [0, 1], [100, 0])}px)`,
        opacity: numS, userSelect: "none",
      }}>
        {feat.num}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: 130, height: 130, borderRadius: 36,
          background: `${feat.accent}15`, border: `2px solid ${feat.accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${iconS})`, opacity: iconS,
        }}>
          {feat.icon}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Accent line */}
        <div style={{ width: lineW, height: 5, background: feat.accent, borderRadius: 3, marginBottom: 32 }} />

        {/* Title — with line breaks */}
        <div style={{ transform: `translateY(${titleY}px)`, opacity: titleOp }}>
          <p style={{
            fontSize: 110, fontWeight: 900, color: textColor,
            fontFamily: "system-ui, sans-serif", letterSpacing: -4,
            lineHeight: 1, margin: 0, whiteSpace: "pre-line",
          }}>
            {feat.title}
          </p>
        </div>

        <p style={{
          fontSize: 40, fontWeight: 500, color: mutedColor,
          fontFamily: "system-ui, sans-serif", margin: "24px 0 0",
          opacity: descOp, lineHeight: 1.4, whiteSpace: "pre-line",
        }}>
          {feat.desc}
        </p>
      </div>
    </AbsoluteFill>
  );
}

function SceneFeatures() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const idx = Math.min(2, Math.floor(frame / 48));
  const feat = FEAT_DATA[idx]!;
  return <FeatureCard feat={feat} localFrame={frame % 48} fps={fps} />;
}

// ── Scene 5 — ROUTE (415–470f) ────────────────────────────────────────────
// Full-screen route (not inside phone) with city labels slamming in.
const ROUTE_PATH = "M 540 100 C 640 300, 380 480, 460 720 C 530 920, 400 1100, 490 1380 C 550 1560, 450 1680, 540 1820";
const ROUTE_LEN = 2000;
const FULL_STOPS = [
  { x: 540, y: 100,  label: "BEOGRAD",     color: C.green },
  { x: 440, y: 720,  label: "NOVI PAZAR",  color: C.orange },
  { x: 540, y: 1820, label: "BUDVA",       color: C.yellow },
];

function SceneRoute() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [5, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dashOffset = interpolate(progress, [0, 1], [ROUTE_LEN, 0]);
  const titleS = snap(frame, 0, fps, 200, 20);

  return (
    <AbsoluteFill style={{ background: C.black, overflow: "hidden" }}>
      {/* Faint dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.1) 1px, transparent 1px)`,
        backgroundSize: "70px 70px",
      }} />

      {/* Full-screen SVG route */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {/* Shadow */}
        <path d={ROUTE_PATH} fill="none" stroke="rgba(249,115,22,0.12)" strokeWidth="14" strokeLinecap="round" />
        {/* Main route */}
        <path
          d={ROUTE_PATH} fill="none" stroke={C.orange} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={ROUTE_LEN} strokeDashoffset={dashOffset}
        />
        {/* Stop dots */}
        {FULL_STOPS.map((s, i) => {
          const showAt = i / (FULL_STOPS.length - 1);
          if (progress < showAt - 0.05) return null;
          const pulse = (frame * 1.2 % 50) / 50;
          return (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={interpolate(pulse, [0, 1], [16, 44])} fill={s.color} opacity={interpolate(pulse, [0, 1], [0.45, 0])} />
              <circle cx={s.x} cy={s.y} r={16} fill={s.color} />
              <circle cx={s.x} cy={s.y} r={7} fill={C.white} />
            </g>
          );
        })}
      </svg>

      {/* City labels */}
      {FULL_STOPS.map((s, i) => {
        const showAt = i / (FULL_STOPS.length - 1);
        if (progress < showAt - 0.04) return null;
        const labelX = s.x > 540 ? s.x - 320 : s.x + 30;
        return (
          <div key={i} style={{
            position: "absolute", left: labelX, top: s.y - 20,
            background: "rgba(13,13,13,0.85)", border: `1.5px solid ${s.color}50`,
            borderRadius: 12, padding: "10px 22px", backdropFilter: "blur(8px)",
          }}>
            <span style={{
              fontSize: 32, fontWeight: 800, color: C.white,
              fontFamily: "system-ui, sans-serif", letterSpacing: 1,
            }}>{s.label}</span>
          </div>
        );
      })}

      {/* "TVOJA RUTA" title fades in */}
      <div style={{
        position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center",
        transform: `translateY(${interpolate(titleS, [0, 1], [50, 0])}px)`, opacity: titleS,
      }}>
        <span style={{
          fontSize: 64, fontWeight: 900, color: "rgba(255,255,255,0.25)",
          fontFamily: "system-ui, sans-serif", letterSpacing: 8, textTransform: "uppercase",
        }}>TVOJA RUTA</span>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 6 — CTA (470–540f) ──────────────────────────────────────────────
function SceneCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const carS = snap(frame, 2, fps, 400, 28);
  const wordS = snap(frame, 16, fps, 320, 24);
  const wordX = interpolate(wordS, [0, 1], [-700, 0]);
  const tagOp = fi(frame, 36, 16);
  const urlOp = fi(frame, 50, 14);
  const btnS = snap(frame, 56, fps, 280, 22);

  // Pulsing glow behind car
  const glow = 0.3 + 0.12 * Math.sin((frame / 18) * Math.PI);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(170deg, ${C.orange} 0%, #C2410C 100%)`,
      alignItems: "center", justifyContent: "center", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.14) 1px, transparent 1px)`,
        backgroundSize: "52px 52px",
      }} />
      {/* Big number BG */}
      <div style={{
        position: "absolute", bottom: -80, right: -60,
        fontSize: 580, fontWeight: 900, color: "rgba(0,0,0,0.06)",
        fontFamily: "system-ui, sans-serif", lineHeight: 1, letterSpacing: -30, userSelect: "none",
      }}>d</div>

      {/* Glow behind car */}
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,255,255,${glow}) 0%, transparent 65%)`,
        top: "20%", left: "50%", transform: "translate(-50%, -50%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 72px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Car */}
        <div style={{ transform: `scale(${carS})`, opacity: carS }}>
          <Car size={200} uid="cta-p" invert />
        </div>

        {/* drumko slams in from left */}
        <div style={{ marginTop: 32, transform: `translateX(${wordX}px)`, opacity: wordS }}>
          <span style={{
            fontSize: 160, fontWeight: 900, color: C.white,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -7, lineHeight: 1, display: "block",
            textShadow: "0 10px 0 rgba(0,0,0,0.15)",
          }}>
            drumko
          </span>
        </div>

        <p style={{
          fontSize: 50, fontWeight: 700, color: "rgba(255,255,255,0.92)",
          fontFamily: "system-ui, sans-serif",
          margin: "24px 0 0", opacity: tagOp, letterSpacing: -0.5,
        }}>
          Besplatno. Počni odmah.
        </p>

        <p style={{
          fontSize: 36, fontWeight: 500, color: "rgba(255,255,255,0.6)",
          fontFamily: "system-ui, sans-serif",
          margin: "14px 0 0", opacity: urlOp, letterSpacing: 0.5,
        }}>
          drumko.app
        </p>

        {/* CTA Button */}
        <div style={{
          marginTop: 52,
          background: C.white,
          borderRadius: 26,
          padding: "32px 88px",
          boxShadow: "0 10px 0 rgba(0,0,0,0.14), 0 20px 48px rgba(0,0,0,0.18)",
          transform: `scale(${btnS})`, opacity: btnS,
        }}>
          <span style={{
            fontSize: 46, fontWeight: 900, color: C.orange,
            fontFamily: "system-ui, sans-serif", letterSpacing: -0.5,
          }}>
            Kreiraj prvi put →
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Volume curve — fade in, peak at brand reveal, fade out ────────────────
function volumeCurve(frame: number): number {
  // Fade in first 20 frames
  const fadeIn = cl(interpolate(frame, [0, 20], [0, 1]));
  // Fade out last 15 frames
  const fadeOut = cl(interpolate(frame, [525, 540], [1, 0]));
  // Slight boost at brand reveal (frame 172–270)
  const boost = frame >= 172 && frame <= 270
    ? cl(interpolate(frame, [172, 190, 250, 270], [1, 1.25, 1.25, 1]))
    : 1;
  return fadeIn * fadeOut * 0.58 * boost;
}

// ── Root (540 frames = 18s @ 30fps) ──────────────────────────────────────
export const DrumkoAdPremier: React.FC = () => (
  <AbsoluteFill>
    <Audio
      src={staticFile("sounds/utope-rhythmic-reverie.mp3")}
      volume={volumeCurve}
      startFrom={0}
    />

    <Sequence from={0}   durationInFrames={80}  name="Hook"><SceneHook /></Sequence>

    {/* 2-frame white flash between hook and chaos */}
    <Sequence from={78}  durationInFrames={4}   name="Flash 0"><SceneFlash /></Sequence>

    <Sequence from={80}  durationInFrames={90}  name="Chaos"><SceneChaos /></Sequence>

    {/* White flash — brand explosion */}
    <Sequence from={165} durationInFrames={9}   name="Flash 1"><SceneFlash /></Sequence>

    <Sequence from={172} durationInFrames={98}  name="Brand"><SceneBrand /></Sequence>

    {/* Flash before features */}
    <Sequence from={268} durationInFrames={6}   name="Flash 2"><SceneFlash /></Sequence>

    <Sequence from={270} durationInFrames={145} name="Features"><SceneFeatures /></Sequence>

    {/* Flash before route */}
    <Sequence from={413} durationInFrames={5}   name="Flash 3"><SceneFlash /></Sequence>

    <Sequence from={415} durationInFrames={55}  name="Route"><SceneRoute /></Sequence>

    {/* Flash before CTA */}
    <Sequence from={468} durationInFrames={5}   name="Flash 4"><SceneFlash /></Sequence>

    <Sequence from={470} durationInFrames={70}  name="CTA"><SceneCTA /></Sequence>
  </AbsoluteFill>
);
