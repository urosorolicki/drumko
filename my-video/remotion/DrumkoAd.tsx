import {
  AbsoluteFill,
  Audio,
  Sequence,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

// ── Brand colors ──────────────────────────────────────────────────────────────
const C = {
  primary: "#F97316",
  primaryDark: "#EA580C",
  primaryShadow: "#C2410C",
  success: "#22C55E",
  blue: "#38BDF8",
  dark: "#1C1917",
  text: "#292524",
  muted: "#78716C",
  white: "#FFFFFF",
  bg: "#FAFAF9",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}
function fadeIn(frame: number, start: number, duration = 18) {
  return clamp(interpolate(frame, [start, start + duration], [0, 1]));
}
function slideUp(frame: number, start: number, fps: number, stiffness = 110) {
  const s = spring({ frame: frame - start, fps, config: { stiffness, damping: 16 } });
  return { transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`, opacity: s };
}
function slideRight(frame: number, start: number, fps: number) {
  const s = spring({ frame: frame - start, fps, config: { stiffness: 120, damping: 18 } });
  return { transform: `translateX(${interpolate(s, [0, 1], [-80, 0])}px)`, opacity: s };
}
function pop(frame: number, start: number, fps: number, stiffness = 220) {
  const s = spring({ frame: frame - start, fps, config: { stiffness, damping: 20 } });
  return { transform: `scale(${s})`, opacity: s };
}

// ── Drumko logo components ────────────────────────────────────────────────────
function DrumkoCar({ size = 62, uid = "a" }: { size?: number; uid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={`car-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="3" y="7" width="58" height="57" rx="18" fill={C.primaryShadow} opacity={0.35} />
      <rect x="0" y="0" width="62" height="62" rx="18" fill={`url(#car-bg-${uid})`} />
      <ellipse cx="31" cy="10" rx="22" ry="6" fill="rgba(255,255,255,0.22)" />
      <rect x="7" y="35" width="50" height="18" rx="7" fill="white" />
      <rect x="13" y="22" width="38" height="17" rx="8" fill="white" />
      <rect x="16" y="25" width="13" height="11" rx="4" fill={C.blue} opacity={0.9} />
      <rect x="33" y="25" width="13" height="11" rx="4" fill={C.blue} opacity={0.9} />
      <rect x="30" y="25" width="4" height="11" fill="white" />
      <rect x="54" y="39" width="5" height="5" rx="2.5" fill="#FDE68A" />
      <rect x="5" y="39" width="5" height="5" rx="2.5" fill="#FCA5A5" />
      <circle cx="18" cy="53" r="7" fill={C.dark} />
      <circle cx="18" cy="53" r="3" fill={C.muted} />
      <circle cx="46" cy="53" r="7" fill={C.dark} />
      <circle cx="46" cy="53" r="3" fill={C.muted} />
      <line x1="32" y1="35" x2="32" y2="51" stroke="#F0EDEC" strokeWidth="1.5" />
    </svg>
  );
}

function DrumkoWordmark({ size = 48, color = C.dark }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: size,
        fontWeight: 900,
        color,
        letterSpacing: -2,
        lineHeight: 1,
      }}
    >
      drumko
    </span>
  );
}

// ── Scene 1 — Intro (0–92f) ───────────────────────────────────────────────────
function SceneIntro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Car drives in from the right with bounce
  const carSpring = spring({ frame, fps, config: { stiffness: 70, damping: 13 } });
  const carX = interpolate(carSpring, [0, 1], [700, 0]);
  const carOpacity = clamp(interpolate(frame, [0, 8], [0, 1]));

  // Speed lines (visible while car is arriving)
  const linesOpacity = clamp(interpolate(frame, [0, 6, 28, 38], [0, 0.9, 0.9, 0]));

  const wordmarkStyle = slideUp(frame, 26, fps, 130);
  const taglineOpacity = fadeIn(frame, 48, 18);
  const dotOpacity = fadeIn(frame, 40, 14);

  const speedLines = [
    { width: 160, top: "43%", opacity: 1.0 },
    { width: 100, top: "47%", opacity: 0.65 },
    { width: 130, top: "51%", opacity: 0.45 },
    { width: 70,  top: "40%", opacity: 0.3 },
    { width: 55,  top: "54%", opacity: 0.2 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: C.dark,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.14) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 70%)`,
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Speed lines */}
      {speedLines.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            right: "54%",
            top: l.top,
            width: l.width,
            height: 3,
            borderRadius: 2,
            background: `rgba(249,115,22,${l.opacity})`,
            opacity: linesOpacity,
          }}
        />
      ))}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Car drives in */}
        <div
          style={{
            transform: `translateX(${carX}px)`,
            opacity: carOpacity,
          }}
        >
          <DrumkoCar size={200} uid="intro" />
        </div>

        {/* Wordmark */}
        <div style={{ marginTop: 40, ...wordmarkStyle }}>
          <DrumkoWordmark size={140} color={C.white} />
        </div>

        {/* Accent dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            marginTop: 18,
            opacity: dotOpacity,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === 1 ? 40 : 12,
                height: 8,
                borderRadius: 4,
                background: i === 1 ? C.primary : "rgba(249,115,22,0.35)",
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontSize: 44,
            fontWeight: 600,
            color: "rgba(255,255,255,0.65)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginTop: 36,
            opacity: taglineOpacity,
            letterSpacing: -0.5,
          }}
        >
          Planiraj put. Bez stresa.
        </p>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 2 — Problem (92–195f) ───────────────────────────────────────────────
const PROBLEMS = [
  "Koja pumpa ide uz put?",
  "Gde da se zaustavim?",
  "Koliko para za put?",
];

function SceneProblem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleStyle = slideUp(frame, 5, fps);

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "0 80px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 920 }}>
        <div style={titleStyle}>
          <p
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: C.text,
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.2,
              letterSpacing: -1.5,
              margin: "0 0 52px",
            }}
          >
            Duga vožnja
            <br />
            <span style={{ color: C.primary }}>bez plana?</span>
          </p>
        </div>

        {PROBLEMS.map((text, i) => {
          const s = slideRight(frame, 22 + i * 18, fps);
          // Pulse the icon
          const iconPulse = 1 + 0.06 * Math.sin(((frame - 40 - i * 12) / 20) * Math.PI);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                marginBottom: 32,
                ...s,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(249,115,22,0.1)",
                  border: `2px solid rgba(249,115,22,0.25)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: `scale(${iconPulse})`,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p
                style={{
                  fontSize: 46,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 3 — Route (195–320f) ────────────────────────────────────────────────
const ROUTE_PATH = "M 270 80 C 320 200, 180 320, 240 440 C 290 540, 210 640, 260 760";
const ROUTE_LEN = 820;

const STOPS = [
  { cx: 270, cy: 80,  label: "Beograd",    color: C.success },
  { cx: 222, cy: 430, label: "Novi Pazar", color: C.primary },
  { cx: 260, cy: 760, label: "Budva",      color: C.primaryDark },
];

function MapSVG({ routeProgress }: { routeProgress: number }) {
  const frame = useCurrentFrame();
  const dashOffset = interpolate(routeProgress, [0, 1], [ROUTE_LEN, 0]);

  return (
    <svg width="540" height="860" viewBox="0 0 540 860" style={{ position: "absolute", top: 0, left: 0 }}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="540" height="860" fill="url(#grid)" />

      {/* Shadow route */}
      <path d={ROUTE_PATH} fill="none" stroke="rgba(249,115,22,0.15)" strokeWidth="10" strokeLinecap="round" />
      {/* Animated route */}
      <path
        d={ROUTE_PATH}
        fill="none"
        stroke={C.primary}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={ROUTE_LEN}
        strokeDashoffset={dashOffset}
      />

      {/* Stop markers with pulse rings */}
      {STOPS.map((s, i) => {
        const showAt = i / (STOPS.length - 1);
        if (routeProgress < showAt - 0.04) return null;

        // Pulsing ring - loops every 50 frames after the stop appears
        const stopAppearFrame = showAt * 95; // approx when it appears
        const localF = Math.max(0, frame - stopAppearFrame);
        const pulse = (localF % 50) / 50;
        const pulseR = interpolate(pulse, [0, 1], [14, 36]);
        const pulseOpacity = interpolate(pulse, [0, 1], [0.5, 0]);

        return (
          <g key={i}>
            <circle cx={s.cx} cy={s.cy} r={pulseR} fill={s.color} opacity={pulseOpacity} />
            <circle cx={s.cx} cy={s.cy} r={20} fill={s.color} opacity={0.15} />
            <circle cx={s.cx} cy={s.cy} r={11} fill={s.color} />
            <circle cx={s.cx} cy={s.cy} r={5} fill={C.white} />
          </g>
        );
      })}
    </svg>
  );
}

function SceneRoute() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneStyle = pop(frame, 5, fps, 160);
  const routeProgress = interpolate(frame, [18, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "column",
        padding: "80px 60px 100px",
      }}
    >
      <div style={slideUp(frame, 0, fps)}>
        <p
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: C.text,
            fontFamily: "system-ui, -apple-system, sans-serif",
            textAlign: "center",
            margin: 0,
            letterSpacing: -1,
          }}
        >
          Unesi start i cilj —
          <br />
          <span style={{ color: C.primary }}>ruta se crta sama.</span>
        </p>
      </div>

      <div style={{ position: "relative", ...phoneStyle }}>
        <div
          style={{
            width: 540,
            height: 860,
            borderRadius: 52,
            background: C.white,
            boxShadow: "0 40px 120px rgba(0,0,0,0.18), 0 8px 32px rgba(0,0,0,0.08)",
            border: "10px solid #E7E5E4",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: 44,
              background: "rgba(250,250,249,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid #E7E5E4",
            }}
          >
            <div style={{ width: 120, height: 20, borderRadius: 10, background: C.dark }} />
          </div>

          <div style={{ position: "relative", flex: 1 }}>
            <MapSVG routeProgress={routeProgress} />
            {STOPS.map((s, i) => {
              const showAt = i / (STOPS.length - 1);
              if (routeProgress < showAt - 0.04) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: s.cx + 26,
                    top: s.cy - 16,
                    background: C.white,
                    border: `1.5px solid ${s.color}40`,
                    borderRadius: 10,
                    padding: "6px 14px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 4 — Features (320–430f) ─────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Pametne pauze",
    desc: "Pumpe, restorani i odmarališta uz rutu",
    color: C.primary,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    title: "Lista za pakovanje",
    desc: "Generisana po dužini puta",
    color: C.success,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Budžet putovanja",
    desc: "Gorivo, smeštaj i hrana — sve na jednom mestu",
    color: "#3B82F6",
  },
];

function SceneFeatures() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: C.dark,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "80px 70px",
        gap: 36,
      }}
    >
      <div style={slideUp(frame, 4, fps)}>
        <p
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: C.white,
            fontFamily: "system-ui, -apple-system, sans-serif",
            textAlign: "center",
            margin: 0,
            letterSpacing: -1.5,
            lineHeight: 1.2,
          }}
        >
          Sve što ti treba
          <br />
          <span style={{ color: C.primary }}>na jednom mestu.</span>
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {FEATURES.map((feat, i) => {
          const s = spring({ frame: frame - (14 + i * 18), fps, config: { stiffness: 130, damping: 18 } });
          // Subtle shimmer on card top border
          const shimmer = interpolate(
            Math.sin(((frame - i * 10) / 40) * Math.PI),
            [-1, 1],
            [0.08, 0.22]
          );
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                background: "rgba(255,255,255,0.06)",
                border: `1.5px solid rgba(255,255,255,${shimmer})`,
                borderRadius: 28,
                padding: "32px 40px",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: `${feat.color}18`,
                  border: `1.5px solid ${feat.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {feat.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: C.white, fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: -0.5 }}>
                  {feat.title}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 28, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 5 — CTA (430–540f) ──────────────────────────────────────────────────
function SceneCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoStyle = pop(frame, 8, fps, 200);
  const wordmarkStyle = slideUp(frame, 25, fps, 140);
  const taglineOpacity = fadeIn(frame, 42, 20);
  const urlOpacity = fadeIn(frame, 60, 18);
  const btnStyle = pop(frame, 72, fps, 180);

  // Pulsing glow ring behind logo
  const glowScale = 1 + 0.07 * Math.sin((frame / fps) * Math.PI * 1.8);
  const glowOpacity = clamp(fadeIn(frame, 8, 20)) * (0.5 + 0.15 * Math.sin((frame / fps) * Math.PI * 1.8));

  // 3 orbiting dots around the logo
  const orbitR = 160;
  const orbitDots = [0, 1, 2].map((i) => {
    const angle = ((frame / fps) * 0.9 + (i * Math.PI * 2) / 3) % (Math.PI * 2);
    const opacity = clamp(fadeIn(frame, 15 + i * 8, 18)) * 0.5;
    return {
      x: Math.cos(angle) * orbitR,
      y: Math.sin(angle) * orbitR * 0.35, // flattened ellipse
      opacity,
    };
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
                             radial-gradient(circle at 70% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "0 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Glow ring + orbiting dots */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Pulsing glow */}
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              transform: `scale(${glowScale})`,
              opacity: glowOpacity,
            }}
          />
          {/* Orbiting dots */}
          {orbitDots.map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: C.white,
                transform: `translate(${d.x}px, ${d.y}px)`,
                opacity: d.opacity,
              }}
            />
          ))}

          {/* Car logo */}
          <div style={logoStyle}>
            <DrumkoCar size={180} uid="cta" />
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ marginTop: 36, ...wordmarkStyle }}>
          <DrumkoWordmark size={130} color={C.white} />
        </div>

        <p
          style={{
            fontSize: 46,
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: "28px 0 0",
            opacity: taglineOpacity,
            letterSpacing: -0.5,
          }}
        >
          Besplatno. Počni odmah.
        </p>

        <p
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: "16px 0 0",
            opacity: urlOpacity,
          }}
        >
          drumko.app
        </p>

        <div
          style={{
            marginTop: 56,
            background: C.white,
            borderRadius: 24,
            padding: "28px 72px",
            boxShadow: "0 8px 0 rgba(0,0,0,0.12), 0 16px 40px rgba(0,0,0,0.15)",
            ...btnStyle,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: 800,
              color: C.primary,
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: -0.5,
            }}
          >
            Kreiraj prvi put
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Transition fade ───────────────────────────────────────────────────────────
function Fade({ direction }: { direction: "out" | "in" }) {
  const frame = useCurrentFrame();
  const opacity =
    direction === "out"
      ? interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : interpolate(frame, [0, 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#000", opacity, pointerEvents: "none" }} />;
}

// ── Root composition (540 frames = 18s @ 30fps) ───────────────────────────────
export const DrumkoAd: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Background music */}
      <Audio
        src={staticFile("sounds/utope-rhythmic-reverie.mp3")}
        volume={0.55}
        startFrom={0}
      />

      <Sequence from={0} durationInFrames={92} name="Intro">
        <SceneIntro />
      </Sequence>
      <Sequence from={80} durationInFrames={12} name="Fade 1">
        <Fade direction="out" />
      </Sequence>

      <Sequence from={92} durationInFrames={103} name="Problem">
        <SceneProblem />
      </Sequence>
      <Sequence from={183} durationInFrames={12} name="Fade 2">
        <Fade direction="out" />
      </Sequence>

      <Sequence from={195} durationInFrames={125} name="Route">
        <SceneRoute />
      </Sequence>
      <Sequence from={308} durationInFrames={12} name="Fade 3">
        <Fade direction="out" />
      </Sequence>

      <Sequence from={320} durationInFrames={110} name="Features">
        <SceneFeatures />
      </Sequence>
      <Sequence from={418} durationInFrames={12} name="Fade 4">
        <Fade direction="out" />
      </Sequence>

      <Sequence from={430} durationInFrames={110} name="CTA">
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
