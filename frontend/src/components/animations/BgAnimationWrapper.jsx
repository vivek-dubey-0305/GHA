/**
 * BgAnimationWrapper — Reusable Background Animation Component
 * Features:
 * - Animated hexagon rings (rotating in opposite directions)
 * - Animated grid background
 * - Large background text
 * - Fully configurable via props
 * 
 * Usage:
 * <BgAnimationWrapper
 *   bgText="COURSES"
 *   accentColor="#f5c518"
 *   svgSize="52%"
 *   showGrid={true}
 * />
 */

export default function BgAnimationWrapper({
  bgText = "GHA",
  accentColor = "#f5c518",
  svgSize = "52%",
  showGrid = true,
  svgOpacity = 0.12,
  containerClass = ""
}) {
  // Animation durations for hexagons (alternating direction)
  const hexDurations = [
    { duration: "40s", direction: "0to360" },  // outer, 0→360
    { duration: "30s", direction: "360to0" },  // reverse
    { duration: "20s", direction: "0to360" },  // reverse
    { duration: "15s", direction: "360to0" },  // reverse
  ];

  return (
    <>
      {/* Animated grid background */}
      {showGrid && (
        <div
          className="bg-anim-grid"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage: `
              linear-gradient(${accentColor}22 1px, transparent 1px),
              linear-gradient(90deg, ${accentColor}22 1px, transparent 1px)
            `.replace(/\s+/g, " "),
            backgroundSize: "80px 80px",
            animation: "bgAnimGridShift 20s linear infinite",
          }}
        />
      )}

      {/* Large background text */}
      <div
        className="bg-anim-text"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(80px, 14vw, 200px)",
          color: "transparent",
          WebkitTextStroke: `1px ${accentColor}0A`,
          whiteSpace: "nowrap",
          letterSpacing: "8px",
          pointerEvents: "none",
          zIndex: 0,
          animation: "bgAnimTextDrift 25s ease-in-out infinite alternate",
        }}
        aria-hidden="true"
      >
        {bgText}
      </div>

      {/* Animated hexagon SVG */}
      <svg
        className="bg-anim-svg"
        viewBox="0 0 500 400"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: svgSize,
          height: "100%",
          opacity: svgOpacity,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient id="bgAnimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform="translate(250,200)">
          {/* Hexagon 1 - Largest */}
          <polygon
            points="0,-160 139,-80 139,80 0,160 -139,80 -139,-80"
            fill="none"
            stroke="url(#bgAnimGradient)"
            strokeWidth="0.8"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur={hexDurations[0].duration}
              repeatCount="indefinite"
            />
          </polygon>

          {/* Hexagon 2 */}
          <polygon
            points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55"
            fill="none"
            stroke="url(#bgAnimGradient)"
            strokeWidth="1"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360"
              to="0"
              dur={hexDurations[1].duration}
              repeatCount="indefinite"
            />
          </polygon>

          {/* Hexagon 3 */}
          <polygon
            points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32"
            fill="none"
            stroke="url(#bgAnimGradient)"
            strokeWidth="1.2"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur={hexDurations[2].duration}
              repeatCount="indefinite"
            />
          </polygon>

          {/* Center pulsing circle */}
          <circle r="8" fill={accentColor} opacity="0.7">
            <animate
              attributeName="r"
              values="8;13;8"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Orbital dot */}
          <circle r="3" fill={accentColor} opacity="0.5">
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              path="M0,0 A110,110 0 1,1 0.1,0"
            />
          </circle>
        </g>
      </svg>

      {/* CSS Animations */}
      <style>{`
        @keyframes bgAnimGridShift {
          from { background-position: 0 0, 0 0; }
          to   { background-position: 80px 80px, 80px 80px; }
        }
        @keyframes bgAnimTextDrift {
          from { transform: translate(-50%, -50%) scale(1); }
          to   { transform: translate(-50%, -52%) scale(1.04); }
        }
      `}</style>
    </>
  );
}


/**
 * BgAnimationWrapper — Reusable Background Animation Component
 *
 * Context-aware: renders a different animated SVG based on bgText value.
 *
 *   "COURSE" / "COURSES"         → Animated open book with smooth page flip + rising particles
 *   "INSTRUCTOR" / "INSTRUCTORS" → Animated instructor: swinging pointer arm + board write/erase
 *   "PATH" / "PATHS"             → Animated winding road with moving dashes + swaying tree
 *   default (any other bgText)    → Rotating concentric hexagon rings (original behavior)
 *
 * Usage:
 *   <BgAnimationWrapper
 *     bgText="COURSES"
 *     accentColor="#f5c518"
 *     svgSize="48%"
 *     showGrid={false}
 *     svgOpacity={0.08}
 *   />
 */

// ─────────────────────────────────────────────────────────────────────────────
// 📖  BOOK  (COURSE / COURSES)
//   - Open book with left + right page outlines and spine arcs
//   - Right page lines fade out/in; a rect sweeps right→spine→left (page flip)
//   - A bright edge line highlights the folded page during the turn
//   - 5 small particles float upward around the book
// ─────────────────────────────────────────────────────────────────────────────
// function BookAnimSVG({ accentColor, svgStyle }) {
//   const c = accentColor;

//   const particles = [
//     { cx: 148, cy: 103, r: 2.5, dur: "2.2s", begin: "0s"   },
//     { cx: 195, cy:  88, r: 1.8, dur: "1.9s", begin: "0.6s" },
//     { cx: 310, cy:  90, r: 2.0, dur: "2.5s", begin: "0.3s" },
//     { cx: 358, cy: 105, r: 1.5, dur: "2.0s", begin: "1.1s" },
//     { cx: 250, cy:  77, r: 2.0, dur: "1.7s", begin: "0.8s" },
//   ];

//   // Varying line widths on each page to look like natural text
//   const leftX2s  = [236, 238, 224, 212, 202];
//   const rightX2s = [352, 354, 340, 328, 318];

//   return (
//     <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>

//       {/* Drop shadow beneath book */}
//       <ellipse cx="250" cy="298" rx="133" ry="11" fill={c} opacity="0.12" />

//       {/* ── Left page outline ── */}
//       <path
//         d="M128,118 Q128,108 140,108 L248,108 L248,286 L128,286 Z"
//         fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" opacity="0.75"
//       />

//       {/* ── Right page outline ── */}
//       <path
//         d="M252,108 L360,108 Q372,108 372,118 L372,286 L252,286 Z"
//         fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" opacity="0.75"
//       />

//       {/* ── Spine bottom arc ── */}
//       <path
//         d="M128,286 Q250,304 372,286"
//         fill="none" stroke={c} strokeWidth="3" opacity="0.75"
//       />

//       {/* ── Spine top dip ── */}
//       <path
//         d="M248,108 Q250,102 252,108"
//         fill="none" stroke={c} strokeWidth="3" opacity="0.75"
//       />

//       {/* ── Left page content lines (static) ── */}
//       {leftX2s.map((x2, i) => (
//         <line
//           key={`ll${i}`}
//           x1="148" y1={146 + i * 25}
//           x2={x2}  y2={146 + i * 25}
//           stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.68"
//         />
//       ))}

//       {/* ── Right page lines: fade out while flipping, then fade back in ── */}
//       {rightX2s.map((x2, i) => (
//         <line
//           key={`rl${i}`}
//           x1="264" y1={146 + i * 25}
//           x2={x2}  y2={146 + i * 25}
//           stroke={c} strokeWidth="2.5" strokeLinecap="round"
//         >
//           <animate
//             attributeName="opacity"
//             values="0.68;0.68;0;0;0.68;0.68"
//             keyTimes="0;0.28;0.43;0.57;0.72;1"
//             dur="1.5s" repeatCount="indefinite" begin={`${i * 0.04}s`}
//           />
//         </line>
//       ))}

//       {/* ── Flip page rect ──
//             Phase 1 (0 → 0.46 s): starts full-width on right, collapses to width=0 at spine
//             Phase 2 (0.46 → 0.54 s): invisible — x jumps across, width grows on left
//             Phase 3 (0.54 → 1.4 s): full-width on left (new page)
//             Reset in last ~0.09 s while opacity=0 so jump is invisible
//       ── */}
//       <rect y="109" height="176" rx="2" fill={c}>
//         <animate
//           attributeName="x"
//           values="252;252;250;130;130;252"
//           keyTimes="0;0.05;0.46;0.54;0.94;1"
//           dur="1.5s" repeatCount="indefinite"
//         />
//         <animate
//           attributeName="width"
//           values="118;118;0;120;120;118"
//           keyTimes="0;0.05;0.46;0.54;0.94;1"
//           dur="1.5s" repeatCount="indefinite"
//         />
//         <animate
//           attributeName="opacity"
//           values="0;0.07;0.32;0.32;0.07;0"
//           keyTimes="0;0.05;0.46;0.54;0.94;1"
//           dur="1.5s" repeatCount="indefinite"
//         />
//       </rect>

//       {/* ── Spine edge highlight — the visible folded page-edge sweeping across ── */}
//       <line y1="111" y2="283" stroke={c} strokeWidth="2.5" strokeLinecap="round">
//         <animate
//           attributeName="x1"
//           values="370;370;250;250;250;370"
//           keyTimes="0;0.04;0.46;0.54;0.94;1"
//           dur="1.5s" repeatCount="indefinite"
//         />
//         <animate
//           attributeName="x2"
//           values="370;370;250;250;250;370"
//           keyTimes="0;0.04;0.46;0.54;0.94;1"
//           dur="1.5s" repeatCount="indefinite"
//         />
//         <animate
//           attributeName="opacity"
//           values="0;0.35;0.95;0.95;0.35;0"
//           keyTimes="0;0.04;0.46;0.54;0.94;1"
//           dur="1.5s" repeatCount="indefinite"
//         />
//       </line>

//       {/* ── Floating particles ── */}
//       {particles.map((p, i) => (
//         <circle key={`p${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={c}>
//           <animate
//             attributeName="cy"
//             values={`${p.cy};${p.cy - 62}`}
//             dur={p.dur} repeatCount="indefinite" begin={p.begin}
//           />
//           <animate
//             attributeName="opacity"
//             values="0;0.8;0"
//             dur={p.dur} repeatCount="indefinite" begin={p.begin}
//           />
//         </circle>
//       ))}

//     </svg>
//   );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // 👨‍🏫  INSTRUCTOR  (INSTRUCTOR / INSTRUCTORS)
// //   - Whiteboard with rounded top-right corner + stand
// //   - Three text lines that draw (left→right) then erase, staggered
// //   - Person: head bobs gently, shoulders, torso, legs
// //   - Left arm rotates around shoulder — pointer tip sweeps up/down on board
// // ─────────────────────────────────────────────────────────────────────────────
// function InstructorAnimSVG({ accentColor, svgStyle }) {
//   const c = accentColor;

//   const boardLines = [
//     { y: 160, maxX: 258, begin: "0s"    },
//     { y: 184, maxX: 245, begin: "0.55s" },
//     { y: 208, maxX: 225, begin: "1.10s" },
//   ];

//   return (
//     <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>

//       {/* ── Whiteboard (rounded top-right only, matching reference image) ── */}
//       <path
//         d="M92,118 L265,118 Q278,118 278,131 L278,252 L92,252 Z"
//         fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" opacity="0.78"
//       />

//       {/* Board stand */}
//       <line x1="185" y1="252" x2="185" y2="283"
//         stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.60" />
//       <line x1="162" y1="283" x2="208" y2="283"
//         stroke={c} strokeWidth="2"   strokeLinecap="round" opacity="0.50" />

//       {/* ── Board text: each line draws from left, holds, then erases ── */}
//       {boardLines.map((ln, i) => (
//         <line
//           key={`bl${i}`}
//           x1="112" y1={ln.y}
//           x2="112" y2={ln.y}
//           stroke={c} strokeWidth="2.5" strokeLinecap="round"
//         >
//           {/* draw: x2 grows 112 → maxX */}
//           <animate
//             attributeName="x2"
//             values={`112;${ln.maxX};${ln.maxX};112;112`}
//             keyTimes="0;0.22;0.68;0.82;1"
//             dur="3.2s" repeatCount="indefinite" begin={ln.begin}
//           />
//           {/* visibility */}
//           <animate
//             attributeName="opacity"
//             values="0.8;0.8;0.8;0;0"
//             keyTimes="0;0.22;0.68;0.82;1"
//             dur="3.2s" repeatCount="indefinite" begin={ln.begin}
//           />
//         </line>
//       ))}

//       {/* ── Person ── */}

//       {/* Head — gentle upward bob */}
//       <circle cx="338" cy="163" r="24"
//         fill="none" stroke={c} strokeWidth="3" opacity="0.82"
//       >
//         <animate
//           attributeName="cy"
//           values="163;160;163"
//           keyTimes="0;0.5;1"
//           dur="2.2s" repeatCount="indefinite"
//           calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
//         />
//       </circle>

//       {/* Neck */}
//       <line x1="338" y1="187" x2="338" y2="200"
//         stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.78" />

//       {/* Shoulders */}
//       <line x1="302" y1="210" x2="374" y2="210"
//         stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.78" />

//       {/* Torso */}
//       <line x1="338" y1="210" x2="338" y2="262"
//         stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.75" />

//       {/* ── Pointing arm group — rotates around left shoulder (302, 210) ── */}
//       <g>
//         <animateTransform
//           attributeName="transform" type="rotate"
//           values="-14 302 210;10 302 210;-14 302 210"
//           keyTimes="0;0.5;1"
//           dur="2s" repeatCount="indefinite"
//           calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
//         />
//         {/* Upper arm: shoulder → elbow */}
//         <line x1="302" y1="210" x2="262" y2="206"
//           stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
//         {/* Pointer stick: elbow → tip (resting against board) */}
//         <line x1="262" y1="206" x2="246" y2="206"
//           stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
//       </g>

//       {/* Hanging arm (right side) */}
//       <line x1="374" y1="210" x2="378" y2="260"
//         stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.75" />

//       {/* Legs */}
//       <line x1="338" y1="262" x2="320" y2="318"
//         stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
//       <line x1="338" y1="262" x2="356" y2="318"
//         stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.75" />

//     </svg>
//   );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // 🛤  PATH  (PATH / PATHS)
// //   - Large circle ring clipping all inner content
// //   - Ground fill + horizon line
// //   - Winding road with converging edges; center-line dashes animate toward viewer
// //   - Tree (hill + trunk + leaf oval + veins) sways around its base
// // ─────────────────────────────────────────────────────────────────────────────
// function PathAnimSVG({ accentColor, svgStyle }) {
//   const c = accentColor;

//   return (
//     <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
//       <defs>
//         <clipPath id="pathCircClip">
//           <circle cx="250" cy="200" r="150" />
//         </clipPath>
//       </defs>

//       {/* ── Outer circle ring ── */}
//       <circle cx="250" cy="200" r="155"
//         fill="none" stroke={c} strokeWidth="4.5" opacity="0.85" />

//       <g clipPath="url(#pathCircClip)">

//         {/* Sky (subtle tint) */}
//         <rect x="100" y="50" width="300" height="200" fill={c} opacity="0.05" />

//         {/* Ground fill */}
//         <rect x="100" y="250" width="300" height="105" fill={c} opacity="0.70" />

//         {/* Horizon line */}
//         <line x1="100" y1="250" x2="400" y2="250"
//           stroke={c} strokeWidth="1.8" opacity="0.55" />

//         {/* Road surface — slightly lower opacity than surrounding ground, so it reads lighter */}
//         <path
//           d="M 222,352 Q 226,300 240,252 L 260,252 Q 274,300 278,352 Z"
//           fill={c} opacity="0.28"
//         />

//         {/* Road left edge */}
//         <path d="M 222,352 Q 226,300 240,252"
//           fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.92" />

//         {/* Road right edge */}
//         <path d="M 278,352 Q 274,300 260,252"
//           fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.92" />

//         {/* Centre dashes — animated from horizon toward viewer (forward-motion illusion) */}
//         <line
//           x1="250" y1="255"
//           x2="250" y2="352"
//           stroke={c} strokeWidth="3" strokeLinecap="round"
//           strokeDasharray="15 13" opacity="0.72"
//         >
//           <animate
//             attributeName="stroke-dashoffset"
//             values="0;28"
//             dur="0.75s" repeatCount="indefinite"
//           />
//         </line>

//         {/* ── Tree group — sways ±2-3° around its base ── */}
//         <g>
//           <animateTransform
//             attributeName="transform" type="rotate"
//             values="-2 314 252;3 314 252;-2 314 252"
//             keyTimes="0;0.5;1"
//             dur="3.5s" repeatCount="indefinite"
//             calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
//           />

//           {/* Small hill at tree base */}
//           <ellipse cx="314" cy="252" rx="30" ry="8" fill={c} opacity="0.85" />

//           {/* Trunk */}
//           <rect x="310" y="214" width="8" height="40" rx="2" fill={c} opacity="0.90" />

//           {/* Leaf canopy (oval) */}
//           <ellipse cx="314" cy="196" rx="18" ry="22" fill={c} opacity="0.90" />

//           {/* Centre vein */}
//           <line x1="314" y1="214" x2="314" y2="177"
//             stroke="rgba(0,0,0,0.28)" strokeWidth="1.5" />
//           {/* Side veins */}
//           <line x1="314" y1="204" x2="300" y2="195" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
//           <line x1="314" y1="204" x2="328" y2="195" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
//           <line x1="314" y1="194" x2="301" y2="186" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
//           <line x1="314" y1="194" x2="327" y2="186" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
//         </g>

//       </g>
//     </svg>
//   );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // ⬡  DEFAULT — Rotating concentric hexagon rings (original behavior)
// // ─────────────────────────────────────────────────────────────────────────────
// function HexagonAnimSVG({ accentColor, svgStyle }) {
//   const c = accentColor;

//   return (
//     <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
//       <defs>
//         <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor={c} stopOpacity="0.8" />
//           <stop offset="100%" stopColor={c} stopOpacity="0" />
//         </linearGradient>
//       </defs>

//       <g transform="translate(250,200)">

//         {/* Outer ring — clockwise 40 s */}
//         <polygon
//           points="0,-160 139,-80 139,80 0,160 -139,80 -139,-80"
//           fill="none" stroke="url(#hexGrad)" strokeWidth="0.8"
//         >
//           <animateTransform attributeName="transform" type="rotate"
//             from="0" to="360" dur="40s" repeatCount="indefinite" />
//         </polygon>

//         {/* Middle ring — counter-clockwise 30 s */}
//         <polygon
//           points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55"
//           fill="none" stroke="url(#hexGrad)" strokeWidth="1"
//         >
//           <animateTransform attributeName="transform" type="rotate"
//             from="360" to="0" dur="30s" repeatCount="indefinite" />
//         </polygon>

//         {/* Inner ring — clockwise 20 s */}
//         <polygon
//           points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32"
//           fill="none" stroke="url(#hexGrad)" strokeWidth="1.2"
//         >
//           <animateTransform attributeName="transform" type="rotate"
//             from="0" to="360" dur="20s" repeatCount="indefinite" />
//         </polygon>

//         {/* Centre pulse */}
//         <circle r="8" fill={c} opacity="0.7">
//           <animate attributeName="r" values="8;13;8" dur="3.5s" repeatCount="indefinite" />
//         </circle>

//         {/* Orbital dot */}
//         <circle r="3" fill={c} opacity="0.5">
//           <animateMotion dur="9s" repeatCount="indefinite"
//             path="M0,0 A110,110 0 1,1 0.1,0" />
//         </circle>

//       </g>
//     </svg>
//   );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // Main export
// // ─────────────────────────────────────────────────────────────────────────────
// export default function BgAnimationWrapper({
//   bgText        = "GHA",
//   accentColor   = "#f5c518",
//   svgSize       = "52%",
//   showGrid      = true,
//   svgOpacity    = 0.12,
//   containerClass = "",
// }) {
//   const key          = bgText.toUpperCase().trim();
//   const isCourse     = key === "COURSE"     || key === "COURSES";
//   const isInstructor = key === "INSTRUCTOR" || key === "INSTRUCTORS";
//   const isPath       = key === "PATH"       || key === "PATHS";

//   const svgStyle = {
//     position:      "absolute",
//     right:          0,
//     top:           "50%",
//     transform:     "translateY(-50%)",
//     width:          svgSize,
//     height:        "100%",
//     opacity:        svgOpacity,
//     pointerEvents: "none",
//     zIndex:         1,
//     overflow:      "visible",
//   };

//   return (
//     <>
//       {/* ── Animated grid background ── */}
//       {showGrid && (
//         <div
//           style={{
//             position: "absolute",
//             inset: 0,
//             zIndex: 0,
//             backgroundImage: `
//               linear-gradient(${accentColor}22 1px, transparent 1px),
//               linear-gradient(90deg, ${accentColor}22 1px, transparent 1px)
//             `.replace(/\s+/g, " "),
//             backgroundSize: "80px 80px",
//             animation: "bgAnimGridShift 20s linear infinite",
//           }}
//         />
//       )}

//       {/* ── Large background text ── */}
//       <div
//         style={{
//           position:        "absolute",
//           top:             "50%",
//           left:            "50%",
//           transform:       "translate(-50%, -50%)",
//           fontFamily:      "'Bebas Neue', sans-serif",
//           fontSize:        "clamp(80px, 14vw, 200px)",
//           color:           "transparent",
//           WebkitTextStroke:`1px ${accentColor}0A`,
//           whiteSpace:      "nowrap",
//           letterSpacing:   "8px",
//           pointerEvents:   "none",
//           zIndex:           0,
//           animation:       "bgAnimTextDrift 25s ease-in-out infinite alternate",
//         }}
//         aria-hidden="true"
//       >
//         {bgText}
//       </div>

//       {/* ── Context-aware animated SVG ── */}
//       {isCourse     && <BookAnimSVG       accentColor={accentColor} svgStyle={svgStyle} />}
//       {isInstructor && <InstructorAnimSVG accentColor={accentColor} svgStyle={svgStyle} />}
//       {isPath       && <PathAnimSVG       accentColor={accentColor} svgStyle={svgStyle} />}
//       {!isCourse && !isInstructor && !isPath && (
//         <HexagonAnimSVG accentColor={accentColor} svgStyle={svgStyle} />
//       )}

//       {/* ── CSS — only div-level animations (grid shift + text drift) ── */}
//       <style>{`
//         @keyframes bgAnimGridShift {
//           from { background-position: 0 0, 0 0; }
//           to   { background-position: 80px 80px, 80px 80px; }
//         }
//         @keyframes bgAnimTextDrift {
//           from { transform: translate(-50%, -50%) scale(1);    }
//           to   { transform: translate(-50%, -52%) scale(1.04); }
//         }
//       `}</style>
//     </>
//   );
// }