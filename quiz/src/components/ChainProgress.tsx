import { useMemo } from "react";

interface BreakingChainProps {
  /** Number of active cycles to hint at, only used for shard count seed */
  seed?: number;
  className?: string;
}

/**
 * Realistic chain of interlocked links snapping in the middle.
 * Uses layered drawing order (H → V → H → V) with tiny x overlaps to imply
 * that each vertical link truly threads through its horizontal neighbours.
 */
export function BreakingChain({ seed = 4, className = "" }: BreakingChainProps) {
  const shards = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * 220,
        dy: -40 - Math.random() * 110,
        rot: (Math.random() - 0.5) * 900,
        delay: (Math.random() * 0.4) + (i % 3) * 0.05,
        size: 3 + Math.random() * 6,
      })),
    [seed],
  );

  // A single realistic link. rotate=0 → horizontal (long axis on X).
  const Link = ({
    cx,
    cy = 100,
    rotate = 0,
  }: {
    cx: number;
    cy?: number;
    rotate?: number;
  }) => (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
      {/* Cast shadow below */}
      <ellipse cx="3" cy="6" rx="36" ry="15" fill="#000" opacity="0.5" filter="url(#chainBlur)" />
      {/* Outer body — thick metallic torus */}
      <path
        d="M -34 0
           a 34 15 0 1 0 68 0
           a 34 15 0 1 0 -68 0
           M -22 0
           a 22 6 0 1 1 44 0
           a 22 6 0 1 1 -44 0 Z"
        fill="url(#linkBody)"
        fillRule="evenodd"
        stroke="oklch(0.12 0 0)"
        strokeWidth="1"
      />
      {/* Outer top gloss */}
      <path
        d="M -30 -9 Q 0 -18 30 -9"
        fill="none"
        stroke="oklch(1 0 0 / 0.75)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M -16 -12 Q 0 -15 16 -12"
        fill="none"
        stroke="oklch(1 0 0 / 1)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Outer bottom shade */}
      <path
        d="M -30 9 Q 0 15 30 9"
        fill="none"
        stroke="oklch(0.2 0 0 / 0.8)"
        strokeWidth="1.5"
      />
      {/* Inner hole rim gloss */}
      <path d="M -20 -4 Q 0 -8 20 -4" fill="none" stroke="oklch(0.75 0.01 90 / 0.7)" strokeWidth="0.8" />
      <path d="M -20 4 Q 0 7 20 4" fill="none" stroke="oklch(0.05 0 0 / 0.9)" strokeWidth="0.8" />
    </g>
  );

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        viewBox="0 0 500 200"
        className="w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="linkBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.92 0.015 90)" />
            <stop offset="18%" stopColor="oklch(0.75 0.02 90)" />
            <stop offset="42%" stopColor="oklch(0.35 0.01 90)" />
            <stop offset="60%" stopColor="oklch(0.55 0.015 90)" />
            <stop offset="85%" stopColor="oklch(0.3 0.01 90)" />
            <stop offset="100%" stopColor="oklch(0.15 0 0)" />
          </linearGradient>
          <radialGradient id="snapFlash" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="25%" stopColor="oklch(1 0.2 85)" stopOpacity="1" />
            <stop offset="55%" stopColor="oklch(0.72 0.22 45)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="chainBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* LEFT half — 2 interlocked links. Drawn in overlap order so the
            vertical (rotated) link visually threads through the horizontal. */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; -22 8; -22 8; 0 0"
            keyTimes="0; 0.4; 0.9; 1"
            dur="2.6s"
            repeatCount="indefinite"
          />
          <Link cx={140} rotate={0} />
          <Link cx={185} rotate={90} />
          <Link cx={230} rotate={0} />
        </g>

        {/* RIGHT half */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 22 8; 22 8; 0 0"
            keyTimes="0; 0.4; 0.9; 1"
            dur="2.6s"
            repeatCount="indefinite"
          />
          <Link cx={270} rotate={0} />
          <Link cx={315} rotate={90} />
          <Link cx={360} rotate={0} />
        </g>

        {/* SNAP burst at center */}
        <g transform="translate(250 100)">
          <circle r="10" fill="url(#snapFlash)">
            <animate attributeName="r" values="0;70;0" keyTimes="0;0.4;1" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.4;1" dur="2.6s" repeatCount="indefinite" />
          </circle>
          {/* Radial spark lines */}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const x2 = Math.cos(a) * 55;
            const y2 = Math.sin(a) * 55;
            return (
              <line
                key={i}
                x1="0"
                y1="0"
                x2={x2}
                y2={y2}
                stroke="oklch(1 0.15 80)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0"
              >
                <animate attributeName="opacity" values="0;0.9;0" keyTimes="0;0.42;0.6" dur="2.6s" repeatCount="indefinite" />
              </line>
            );
          })}
          {/* Shards */}
          {shards.map((s) => (
            <rect
              key={s.id}
              x={-s.size / 2}
              y={-s.size / 2}
              width={s.size}
              height={s.size / 2.5}
              fill="url(#linkBody)"
              stroke="oklch(0.1 0 0)"
              strokeWidth="0.4"
              opacity="0"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0; ${s.dx} ${s.dy}; ${s.dx * 1.3} ${s.dy + 140}`}
                keyTimes="0;0.5;1"
                dur="2.6s"
                begin={`${s.delay}s`}
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                values={`0; ${s.rot}; ${s.rot * 1.3}`}
                keyTimes="0;0.5;1"
                dur="2.6s"
                begin={`${s.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.15;0.75;1"
                dur="2.6s"
                begin={`${s.delay}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>
      </svg>
    </div>
  );
}
