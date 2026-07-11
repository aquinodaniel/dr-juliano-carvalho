import { useEffect, useMemo, useState } from "react";

interface PremiumChainLoaderProps {
  pct?: number;
  className?: string;
}

const BUILDING_COUNT = 10;

/**
 * City-lights loader: alternating houses & buildings light their windows
 * (warm gold glow) as pct advances. At 100% the whole skyline blazes and
 * a warm halo pulses out, then the cycle loops.
 */
export function PremiumChainLoader({ pct = 0, className = "" }: PremiumChainLoaderProps) {
  const filled = Math.min(BUILDING_COUNT, Math.floor((pct / 100) * BUILDING_COUNT));
  const finale = pct >= 99;

  const [round, setRound] = useState(0);
  useEffect(() => {
    if (!finale) return;
    const id = setTimeout(() => setRound((r) => r + 1), 1600);
    return () => clearTimeout(id);
  }, [finale, round]);

  // sparkle "keys / lights" flying out on finale
  const sparks = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => {
        const a = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 160;
        return {
          id: i,
          dx: Math.cos(a) * dist,
          dy: Math.sin(a) * dist * 0.6 - 20,
          delay: Math.random() * 0.2,
          size: 1.5 + Math.random() * 3,
        };
      }),
    [round],
  );

  const step = 46;
  const startX = 30;

  return (
    <div className={`relative w-full ${className}`}>
      <svg viewBox="0 0 500 160" className="w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="bldStone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.42 0.02 260)" />
            <stop offset="100%" stopColor="oklch(0.22 0.03 260)" />
          </linearGradient>
          <linearGradient id="bldStoneHot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.05 260)" />
            <stop offset="100%" stopColor="oklch(0.30 0.04 260)" />
          </linearGradient>
          <linearGradient id="bldRoof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.35 0.04 30)" />
            <stop offset="100%" stopColor="oklch(0.22 0.04 30)" />
          </linearGradient>
          <linearGradient id="bldRoofHot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.13 55)" />
            <stop offset="100%" stopColor="oklch(0.38 0.12 40)" />
          </linearGradient>
          <radialGradient id="bldWindow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff5c9" />
            <stop offset="60%" stopColor="oklch(0.82 0.18 82)" />
            <stop offset="100%" stopColor="oklch(0.55 0.16 60)" />
          </radialGradient>
          <radialGradient id="bldHalo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="35%" stopColor="oklch(1 0.2 82)" stopOpacity="0.9" />
            <stop offset="70%" stopColor="oklch(0.75 0.2 55)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="bldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* ground line */}
        <line
          x1="10"
          y1="128"
          x2="490"
          y2="128"
          stroke="oklch(0.30 0.03 260)"
          strokeWidth="1"
        />

        {/* warm halo under lit portion */}
        {filled > 0 && (
          <ellipse
            cx={startX + (filled - 0.5) * step}
            cy={126}
            rx={filled * 26}
            ry={30}
            fill="url(#bldHalo)"
            opacity={finale ? 0.75 : 0.35}
            filter="url(#bldGlow)"
          />
        )}

        {/* Skyline */}
        <g>
          {Array.from({ length: BUILDING_COUNT }).map((_, i) => {
            const cx = startX + i * step;
            const lit = i < filled || finale;
            return i % 2 === 0 ? (
              <House key={i} cx={cx} lit={lit} pulsing={i === filled && !finale} />
            ) : (
              <Building key={i} cx={cx} lit={lit} pulsing={i === filled && !finale} />
            );
          })}
        </g>

        {/* Finale sparkles */}
        {finale && (
          <g key={round} transform="translate(250 100)">
            <circle r="6" fill="url(#bldHalo)">
              <animate attributeName="r" values="0;160" dur="1s" fill="freeze" />
              <animate attributeName="opacity" values="0.9;0" dur="1s" fill="freeze" />
            </circle>
            {sparks.map((s) => (
              <circle
                key={s.id}
                r={s.size}
                fill="#fff5c9"
                opacity="0"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0 0; ${s.dx} ${s.dy}`}
                  dur="1.2s"
                  begin={`${s.delay}s`}
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  keyTimes="0;0.2;1"
                  dur="1.2s"
                  begin={`${s.delay}s`}
                  fill="freeze"
                />
              </circle>
            ))}
          </g>
        )}
      </svg>

      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60" />
        <span className="font-mono text-xl font-bold tabular-nums text-primary tracking-widest">
          {String(Math.round(pct)).padStart(2, "0")}%
        </span>
        <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/60" />
      </div>
    </div>
  );
}

function Window({ x, y, w, h, lit }: { x: number; y: number; w: number; h: number; lit: boolean }) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={0.6}
      fill={lit ? "url(#bldWindow)" : "oklch(0.16 0.02 260)"}
      stroke="oklch(0.1 0.02 260)"
      strokeWidth="0.4"
      style={{ transition: "fill .4s" }}
    />
  );
}

function House({ cx, lit, pulsing }: { cx: number; lit: boolean; pulsing: boolean }) {
  const bodyFill = lit ? "url(#bldStoneHot)" : "url(#bldStone)";
  const roofFill = lit ? "url(#bldRoofHot)" : "url(#bldRoof)";
  return (
    <g
      transform={`translate(${cx} 128)`}
      style={pulsing ? { animation: "houseBlink 1s ease-in-out infinite" } : undefined}
    >
      {/* body */}
      <rect
        x={-14}
        y={-32}
        width={28}
        height={32}
        fill={bodyFill}
        stroke="oklch(0.1 0.02 260)"
        strokeWidth="0.6"
        style={{ transition: "fill .4s" }}
      />
      {/* roof */}
      <path
        d="M -18 -32 L 0 -48 L 18 -32 Z"
        fill={roofFill}
        stroke="oklch(0.1 0.02 260)"
        strokeWidth="0.6"
        style={{ transition: "fill .4s" }}
      />
      {/* chimney */}
      <rect x={6} y={-46} width={4} height={7} fill={roofFill} stroke="oklch(0.1 0.02 260)" strokeWidth="0.4" />
      {/* windows */}
      <Window x={-10} y={-26} w={6} h={6} lit={lit} />
      <Window x={4} y={-26} w={6} h={6} lit={lit} />
      {/* door */}
      <rect
        x={-3}
        y={-14}
        width={6}
        height={14}
        fill={lit ? "oklch(0.55 0.14 55)" : "oklch(0.18 0.02 260)"}
        stroke="oklch(0.1 0.02 260)"
        strokeWidth="0.4"
        style={{ transition: "fill .4s" }}
      />
      {/* door knob */}
      {lit && <circle cx={1.4} cy={-7} r={0.5} fill="#fff5c9" />}
    </g>
  );
}

function Building({ cx, lit, pulsing }: { cx: number; lit: boolean; pulsing: boolean }) {
  const bodyFill = lit ? "url(#bldStoneHot)" : "url(#bldStone)";
  // deterministic pattern of lit windows per building
  const rows = 5;
  const cols = 3;
  return (
    <g
      transform={`translate(${cx} 128)`}
      style={pulsing ? { animation: "houseBlink 1s ease-in-out infinite" } : undefined}
    >
      {/* body */}
      <rect
        x={-13}
        y={-64}
        width={26}
        height={64}
        fill={bodyFill}
        stroke="oklch(0.1 0.02 260)"
        strokeWidth="0.6"
        style={{ transition: "fill .4s" }}
      />
      {/* rooftop cap */}
      <rect
        x={-15}
        y={-66}
        width={30}
        height={3}
        fill="oklch(0.20 0.03 260)"
        stroke="oklch(0.1 0.02 260)"
        strokeWidth="0.4"
      />
      {/* antenna */}
      <line x1={0} y1={-66} x2={0} y2={-74} stroke="oklch(0.35 0.04 260)" strokeWidth="0.8" />
      <circle cx={0} cy={-74} r={0.8} fill={lit ? "#ff5533" : "oklch(0.3 0.03 260)"} />
      {/* windows grid */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const wx = -10 + c * 7;
          const wy = -60 + r * 11;
          // some windows randomly dark even when lit — city vibe
          const isLit = lit && !((r * cols + c) % 7 === 3);
          return <Window key={`${r}-${c}`} x={wx} y={wy} w={5} h={7} lit={isLit} />;
        }),
      )}
    </g>
  );
}
