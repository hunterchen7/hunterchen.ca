import React from "react";

// Zdog-inspired pseudo-3D: isometric faces with different shading,
// chunky rounded strokes, and baked-in SVG animations.
// Depth offset: roughly (7, -4) for consistent isometric angle.

function WorkWatermark() {
  return (
    <svg viewBox="0 0 120 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* MacBook screen — back panel (3D depth) */}
      <path d="M88,8 L94,4 L94,48 L88,52 Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16,8 L22,4 L94,4 L88,8 Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2.5" />
      {/* Screen — front face */}
      <rect x="16" y="8" width="72" height="44" rx="3" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.06" />
      {/* Screen inset */}
      <rect x="21" y="13" width="62" height="34" rx="2" fill="currentColor" opacity="0.1" />
      {/* Code line 1 — appears */}
      <line x1="26" y1="20" x2="54" y2="20" stroke="currentColor" strokeWidth="2.5">
        <animate attributeName="x2" values="26;54;54" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1" dur="4s" repeatCount="indefinite" />
      </line>
      {/* Code line 2 — indented, appears after line 1 */}
      <line x1="30" y1="26" x2="62" y2="26" stroke="currentColor" strokeWidth="2.5">
        <animate attributeName="x2" values="30;62;62" dur="4s" begin="0.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1" dur="4s" begin="0.6s" repeatCount="indefinite" />
      </line>
      {/* Code line 3 — indented more */}
      <line x1="30" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="2.5">
        <animate attributeName="x2" values="30;48;48" dur="4s" begin="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1" dur="4s" begin="1.2s" repeatCount="indefinite" />
      </line>
      {/* Code line 4 */}
      <line x1="26" y1="38" x2="44" y2="38" stroke="currentColor" strokeWidth="2.5">
        <animate attributeName="x2" values="26;44;44" dur="4s" begin="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1" dur="4s" begin="1.8s" repeatCount="indefinite" />
      </line>
      {/* Blinking cursor — moves down with each line */}
      <rect x="26" y="18" width="2.5" height="6" rx="1" fill="currentColor">
        <animate attributeName="x" values="26;54;62;48;44;26" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y" values="18;18;24;30;36;18" dur="4s" repeatCount="indefinite" keyTimes="0;0.15;0.35;0.55;0.75;1" />
        <animate attributeName="opacity" values="1;1;0;1;1;0;1;1;0;1" dur="0.8s" repeatCount="indefinite" />
      </rect>
      {/* Hinge */}
      <line x1="14" y1="54" x2="90" y2="54" stroke="currentColor" strokeWidth="3" />
      {/* Keyboard base — front face */}
      <path d="M10,54 L94,54 L94,62 L10,62 Z" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="2.5" />
      {/* Keyboard base — right side face */}
      <path d="M94,54 L100,50 L100,58 L94,62 Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2.5" />
      {/* Keyboard base — top face (wedge taper) */}
      <path d="M10,54 L94,54 L100,50 L16,50 Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
      {/* Trackpad */}
      <rect x="42" y="56" width="20" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function ProjectsWatermark() {
  // Isometric 4x4 chessboard
  const ox = 50, oy = 12;
  const rx = 9, ry = 4.5, dx = -9, dy = 4.5;
  const N = 4, depth = 6;

  const px = (r: number, c: number) => ox + c * rx + r * dx;
  const py = (r: number, c: number) => oy + c * ry + r * dy;
  const sq = (r: number, c: number) =>
    `M${px(r,c)},${py(r,c)} L${px(r,c+1)},${py(r,c+1)} L${px(r+1,c+1)},${py(r+1,c+1)} L${px(r+1,c)},${py(r+1,c)} Z`;
  const cx = (r: number, c: number) => ox + (c + 0.5) * rx + (r + 0.5) * dx;
  const cy = (r: number, c: number) => oy + (c + 0.5) * ry + (r + 0.5) * dy;

  // Animated piece: slides from (3,0) to (1,2)
  const from = { x: cx(3, 0), y: cy(3, 0) };
  const to = { x: cx(1, 2), y: cy(1, 2) };
  const tx = to.x - from.x, ty = to.y - from.y;

  return (
    <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Board depth — front-left face */}
      <path d={`M${px(N,0)},${py(N,0)} L${px(N,N)},${py(N,N)} L${px(N,N)},${py(N,N)+depth} L${px(N,0)},${py(N,0)+depth} Z`}
        fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" />
      {/* Board depth — front-right face */}
      <path d={`M${px(0,N)},${py(0,N)} L${px(N,N)},${py(N,N)} L${px(N,N)},${py(N,N)+depth} L${px(0,N)},${py(0,N)+depth} Z`}
        fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="2" />
      {/* Board surface */}
      <path d={`M${px(0,0)},${py(0,0)} L${px(0,N)},${py(0,N)} L${px(N,N)},${py(N,N)} L${px(N,0)},${py(N,0)} Z`}
        fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="2.5" />
      {/* Dark squares */}
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) =>
          (r + c) % 2 === 1 ? <path key={`${r}-${c}`} d={sq(r, c)} fill="currentColor" opacity="0.2" /> : null
        )
      )}
      {/* Grid lines */}
      {Array.from({ length: N - 1 }, (_, i) => (
        <g key={i + 1}>
          <line x1={px(0,i+1)} y1={py(0,i+1)} x2={px(N,i+1)} y2={py(N,i+1)} stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
          <line x1={px(i+1,0)} y1={py(i+1,0)} x2={px(i+1,N)} y2={py(i+1,N)} stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
        </g>
      ))}
      {/* King at (1,2) */}
      <g>
        <ellipse cx={cx(1,2)} cy={cy(1,2)} rx="5" ry="2.5" fill="currentColor" opacity="0.35" />
        <rect x={cx(1,2)-3} y={cy(1,2)-12} width="6" height="12" rx="2.5" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="2" />
        <line x1={cx(1,2)} y1={cy(1,2)-15} x2={cx(1,2)} y2={cy(1,2)-11} stroke="currentColor" strokeWidth="2.5" />
        <line x1={cx(1,2)-2.5} y1={cy(1,2)-13} x2={cx(1,2)+2.5} y2={cy(1,2)-13} stroke="currentColor" strokeWidth="2" />
      </g>
      {/* Pawn at (2,1) */}
      <g>
        <ellipse cx={cx(2,1)} cy={cy(2,1)} rx="4" ry="2" fill="currentColor" opacity="0.3" />
        <circle cx={cx(2,1)} cy={cy(2,1)-5} r="3.5" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="2" />
      </g>
      {/* Animated knight — slides from (3,0) to (1,2) */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values={`0,0; ${tx},${ty}; ${tx},${ty}; 0,0`}
          dur="5s" repeatCount="indefinite" keyTimes="0;0.25;0.75;1" />
        <ellipse cx={from.x} cy={from.y} rx="4" ry="2" fill="currentColor" opacity="0.3" />
        <path d={`M${from.x-3},${from.y} L${from.x-3},${from.y-8} L${from.x},${from.y-11} L${from.x+3},${from.y-8} L${from.x+3},${from.y} Z`}
          fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="2" />
        <circle cx={from.x} cy={from.y-9} r="2" fill="currentColor" opacity="0.5" />
      </g>
    </svg>
  );
}

function HobbiesWatermark() {
  return (
    <svg viewBox="0 0 120 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Camera body — right side face */}
      <path d="M90,30 L90,65 L98,60 L98,25 Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2.5" />
      {/* Camera body — top face */}
      <path d="M22,30 L90,30 L98,25 L30,25 Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2.5" />
      {/* Camera body — front face */}
      <rect x="22" y="30" width="68" height="35" rx="6" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.06" />
      {/* Viewfinder bump — 3D block on top */}
      <path d="M38,25 L38,18 L62,18 L62,25" stroke="currentColor" strokeWidth="2.5" fill="currentColor" opacity="0.1" />
      <path d="M62,18 L68,14 L68,21 L62,25" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="2" />
      <path d="M38,18 L44,14 L68,14 L62,18" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
      {/* Lens — outer ring */}
      <circle cx="56" cy="48" r="14" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.08" />
      {/* Lens — middle ring */}
      <circle cx="56" cy="48" r="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {/* Lens — inner glass */}
      <circle cx="56" cy="48" r="6" fill="currentColor" opacity="0.2" />
      {/* Lens glint */}
      <circle cx="53" cy="45" r="2" fill="currentColor" opacity="0.5" />
      {/* Lens aperture blades — rotating */}
      <g>
        <path d="M56,42 L59,44 L56,46 L53,44 Z" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M50,48 L52,45 L54,48 L52,51 Z" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <path d="M58,48 L60,45 L62,48 L60,51 Z" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <animateTransform attributeName="transform" type="rotate" from="0 56 48" to="360 56 48" dur="20s" repeatCount="indefinite" />
      </g>
      {/* Flash — top left with periodic fire */}
      <rect x="28" y="20" width="6" height="5" rx="1.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.4;0.4;0.4;1;0.4" dur="3s" repeatCount="indefinite" keyTimes="0;0.85;0.9;0.93;1" />
      </rect>
      {/* Grip texture — left side */}
      <line x1="28" y1="36" x2="28" y2="58" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <line x1="32" y1="36" x2="32" y2="58" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      {/* Shutter button — 3D circle on top */}
      <circle cx="72" cy="25" r="3.5" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="72" cy="24" rx="3.5" ry="2" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function HackathonsWatermark() {
  return (
    <svg viewBox="0 0 100 120" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Rocket body — shadow/right half (darker) */}
      <path d="M50,12 C54,22 62,38 62,58 L50,58 Z" fill="currentColor" opacity="0.28" />
      {/* Rocket body — highlight/left half (lighter) */}
      <path d="M50,12 C46,22 38,38 38,58 L50,58 Z" fill="currentColor" opacity="0.12" />
      {/* Rocket body outline */}
      <path d="M50,12 C50,12 36,34 36,58 L64,58 C64,34 50,12 50,12 Z" stroke="currentColor" strokeWidth="3.5" />
      {/* Nose highlight */}
      <path d="M46,20 Q44,30 42,40" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      {/* Window — 3D ring */}
      <circle cx="50" cy="38" r="7" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="50" cy="38" r="4" fill="currentColor" opacity="0.15" />
      {/* Window glint */}
      <circle cx="48" cy="36" r="1.5" fill="currentColor" opacity="0.5" />
      {/* Left fin — two faces */}
      <path d="M36,48 L24,64 L36,58 Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="3" />
      {/* Right fin — two faces (darker = further from light) */}
      <path d="M64,48 L76,64 L64,58 Z" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="3" />
      {/* Nozzle — 3D trapezoid */}
      <path d="M40,58 L38,66 L62,66 L60,58" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="3" />
      {/* Flame center — pulsing */}
      <ellipse cx="50" cy="82" rx="6" ry="12" fill="currentColor" opacity="0.35">
        <animate attributeName="ry" values="12;15;10;14;12" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.5;0.25;0.45;0.35" dur="0.6s" repeatCount="indefinite" />
      </ellipse>
      {/* Flame left */}
      <ellipse cx="44" cy="76" rx="4" ry="8" fill="currentColor" opacity="0.25">
        <animate attributeName="ry" values="8;6;10;7;8" dur="0.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0.15;0.35;0.2;0.25" dur="0.5s" repeatCount="indefinite" />
      </ellipse>
      {/* Flame right */}
      <ellipse cx="56" cy="76" rx="4" ry="8" fill="currentColor" opacity="0.25">
        <animate attributeName="ry" values="8;10;6;9;8" dur="0.55s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0.35;0.15;0.3;0.25" dur="0.55s" repeatCount="indefinite" />
      </ellipse>
      {/* Sparks */}
      <circle cx="46" cy="96" r="2" fill="currentColor">
        <animate attributeName="opacity" values="0.4;0;0.3;0;0.4" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="cy" values="96;100;96" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="54" cy="94" r="1.5" fill="currentColor">
        <animate attributeName="opacity" values="0;0.35;0;0.3;0" dur="0.7s" repeatCount="indefinite" />
        <animate attributeName="cy" values="94;99;94" dur="0.7s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function HelloWatermark() {
  return (
    <svg viewBox="0 0 120 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Bubble — right side face (depth) */}
      <path d="M86,12 L92,8 L92,52 L86,56 Z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2.5" />
      {/* Bubble — top face */}
      <path d="M14,12 L20,8 L92,8 L86,12 Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2.5" />
      {/* Bubble — front face */}
      <rect x="14" y="12" width="72" height="44" rx="12" stroke="currentColor" strokeWidth="3.5" fill="currentColor" opacity="0.06" />
      {/* Bubble tail — 3D extruded */}
      <path d="M32,56 L24,72 L44,54" stroke="currentColor" strokeWidth="3.5" fill="currentColor" opacity="0.12" />
      <path d="M24,72 L30,68 L44,54" fill="currentColor" opacity="0.25" />
      {/* Typing dot 1 — bouncing */}
      <circle cx="36" cy="34" r="5" fill="currentColor" opacity="0.7">
        <animate attributeName="cy" values="34;29;34" dur="1.2s" begin="0s" repeatCount="indefinite" />
      </circle>
      {/* Typing dot 2 — bouncing (staggered) */}
      <circle cx="50" cy="34" r="5" fill="currentColor" opacity="0.7">
        <animate attributeName="cy" values="34;29;34" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
      </circle>
      {/* Typing dot 3 — bouncing (staggered more) */}
      <circle cx="64" cy="34" r="5" fill="currentColor" opacity="0.7">
        <animate attributeName="cy" values="34;29;34" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export const CARD_WATERMARKS: Record<string, React.ReactNode> = {
  "1": <WorkWatermark />,
  "3": <ProjectsWatermark />,
  "2": <HobbiesWatermark />,
  "4": <HackathonsWatermark />,
  "5": <HelloWatermark />,
};
