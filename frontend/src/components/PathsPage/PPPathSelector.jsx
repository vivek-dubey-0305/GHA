import ROADMAPS from "../../mock/roadmaps.js";

const CARD_SVGS = {
  webdev: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#0d0d0d"/>
      <rect x="10" y="10" width="180" height="110" rx="4" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3"/>
      <rect x="10" y="10" width="180" height="22" fill={color} opacity="0.07"/>
      <circle cx="24" cy="21" r="3.5" fill="#e74c3c"/><circle cx="34" cy="21" r="3.5" fill={color}/><circle cx="44" cy="21" r="3.5" fill="#27ae60"/>
      <text x="18" y="46" fontFamily="'Space Mono',monospace" fontSize="7" fill={color} opacity="0.7">&lt;div className="hero"&gt;</text>
      <text x="28" y="57" fontFamily="'Space Mono',monospace" fontSize="7" fill="#888" opacity="0.6">&lt;h1&gt;Hello World&lt;/h1&gt;</text>
      <text x="18" y="68" fontFamily="'Space Mono',monospace" fontSize="7" fill={color} opacity="0.7">&lt;/div&gt;</text>
      <rect x="18" y="78" width="0" height="2" fill={color} opacity="0.6">
        <animate attributeName="width" values="0;160;0" dur="2.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="18" y="86" width="0" height="2" fill={color} opacity="0.4">
        <animate attributeName="width" values="0;110;0" dur="2.5s" begin="0.4s" repeatCount="indefinite"/>
      </rect>
      <rect x="18" y="94" width="0" height="2" fill={color} opacity="0.25">
        <animate attributeName="width" values="0;80;0" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
      </rect>
    </svg>
  ),
  mobile: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#0a140d"/>
      <g transform="translate(100,65)">
        <rect x="-22" y="-50" width="44" height="90" rx="7" fill="none" stroke={color} strokeWidth="1" opacity="0.5"/>
        <rect x="-16" y="-40" width="32" height="64" rx="2" fill={color} opacity="0.04"/>
        <circle cx="0" cy="40" r="4" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5"/>
        <rect x="-7" y="-46" width="14" height="3" rx="1.5" fill={color} opacity="0.3"/>
        {[[-10,-22],[2,-22],[-10,-8],[2,-8],[-10,6],[2,6]].map(([x,y],i) => (
          <rect key={i} x={x} y={y} width="10" height="10" rx="2" fill={color} opacity={0.3 + i * 0.06}>
            <animate attributeName="opacity" values={`${0.3+i*0.06};${0.7+i*0.05};${0.3+i*0.06}`} dur={`${1.4+i*0.2}s`} begin={`${i*0.15}s`} repeatCount="indefinite"/>
          </rect>
        ))}
      </g>
    </svg>
  ),
  cybersecurity: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#140a0a"/>
      <g transform="translate(100,60)">
        <path d="M0,-42 L32,-24 L32,16 Q32,42 0,54 Q-32,42 -32,16 L-32,-24 Z" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5"/>
        <rect x="-9" y="-6" width="18" height="14" rx="2" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
        <path d="M-5,-6 L-5,-12 Q-5,-18 0,-18 Q5,-18 5,-12 L5,-6" fill="none" stroke={color} strokeWidth="1" opacity="0.7"/>
        <circle cx="0" cy="1" r="2.5" fill={color} opacity="0.7"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle r="3" fill={color} opacity="0.5">
          <animateMotion dur="5s" repeatCount="indefinite" path="M0,0 A52,42 0 1,1 0.1,0"/>
        </circle>
      </g>
      <rect x="0" y="0" width="200" height="1.5" fill={color} opacity="0.3">
        <animate attributeName="y" values="0;130;0" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
      </rect>
    </svg>
  ),
  datascience: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#0a0d14"/>
      <g transform="translate(100,65)">
        {[0,51.4,102.8,154.2,205.6,257,308.6].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          const x = Math.cos(rad) * 52, y = Math.sin(rad) * 38;
          return (
            <g key={i}>
              <line x1="0" y1="0" x2={x} y2={y} stroke={color} strokeWidth="0.5" opacity="0.3"/>
              <circle cx={x} cy={y} r="5" fill={color} opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${1.8+i*0.25}s`} repeatCount="indefinite"/>
              </circle>
            </g>
          );
        })}
        <circle r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.5">
          <animate attributeName="r" values="10;15;10" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle r="4" fill={color}/>
      </g>
    </svg>
  ),
  clouddevops: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#14100a"/>
      <g transform="translate(100,55)">
        <ellipse cx="0" cy="10" rx="55" ry="22" fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="ry" values="22;26;22" dur="3s" repeatCount="indefinite"/>
        </ellipse>
        <circle cx="-22" cy="0" r="18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3"/>
        <circle cx="22" cy="0" r="18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3"/>
        <circle cx="0" cy="-10" r="22" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3"/>
        {[-22,-8,8,22].map((x, i) => (
          <line key={i} x1={x} y1="28" x2={x} y2="38" stroke={color} strokeWidth="1" opacity="0.5">
            <animate attributeName="y1" values="28;44" dur={`${0.7+i*0.18}s`} begin={`${i*0.18}s`} repeatCount="indefinite"/>
            <animate attributeName="y2" values="38;54" dur={`${0.7+i*0.18}s`} begin={`${i*0.18}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur={`${0.7+i*0.18}s`} begin={`${i*0.18}s`} repeatCount="indefinite"/>
          </line>
        ))}
      </g>
    </svg>
  ),
  programming: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#0e0a14"/>
      <g transform="translate(100,65)">
        <text x="0" y="-18" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="22" fill={color} opacity="0">
          &lt;/&gt;
          <animate attributeName="opacity" values="0;0.8;0;0.8;0" dur="4s" repeatCount="indefinite"/>
        </text>
        <text x="0" y="8" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="16" fill={color} opacity="0">
          fn main()
          <animate attributeName="opacity" values="0;0.6;0;0.6;0" dur="4s" begin="1.4s" repeatCount="indefinite"/>
        </text>
        <text x="0" y="30" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="14" fill={color} opacity="0">
          print("GHA")
          <animate attributeName="opacity" values="0;0.7;0;0.7;0" dur="4s" begin="2.8s" repeatCount="indefinite"/>
        </text>
      </g>
    </svg>
  ),
  interview: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#080f0e"/>
      <g transform="translate(100,65)">
        <circle r="52" fill="none" stroke={color} strokeWidth="0.4" opacity="0.12"/>
        <circle r="38" fill="none" stroke={color} strokeWidth="0.6" opacity="0.2"/>
        <circle r="24" fill="none" stroke={color} strokeWidth="0.9" opacity="0.3"/>
        <circle r="12" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5"/>
        <circle r="4" fill={color} opacity="0.9"><animate attributeName="r" values="4;7;4" dur="1.5s" repeatCount="indefinite"/></circle>
        <line x1="-75" y1="-15" x2="-15" y2="0" stroke={color} strokeWidth="1.8" opacity="0.6">
          <animate attributeName="x1" values="-75;-45;-75" dur="2s" repeatCount="indefinite"/>
        </line>
        <polygon points="-15,0 -24,-5 -22,5" fill={color} opacity="0.7"/>
      </g>
    </svg>
  ),
  gamedev: (color) => (
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="#140808"/>
      <g transform="translate(100,65)">
        <rect x="-40" y="-28" width="80" height="52" rx="8" fill="none" stroke={color} strokeWidth="1" opacity="0.5"/>
        <rect x="-30" y="-22" width="60" height="40" rx="4" fill={color} opacity="0.04"/>
        {/* D-pad */}
        <rect x="-52" y="-7" width="14" height="10" rx="2" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5"/>
        <polygon points="-45,-7 -41,-14 -37,-7" fill={color} opacity="0.4"/>
        <polygon points="-45,3 -41,10 -37,3" fill={color} opacity="0.4"/>
        {/* Buttons */}
        {[[40,-15],[50,-5],[40,5],[30,-5]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill={color} opacity={0.3+i*0.1}>
            <animate attributeName="opacity" values={`${0.3+i*0.1};${0.8};${0.3+i*0.1}`} dur={`${1.2+i*0.3}s`} begin={`${i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {/* Select/Start */}
        <rect x="-8" y="-4" width="14" height="4" rx="2" fill={color} opacity="0.3"/>
        <rect x="8" y="-4" width="14" height="4" rx="2" fill={color} opacity="0.3"/>
      </g>
    </svg>
  ),
};

export default function PPPathSelector({ selectedId, onSelect }) {
  return (
    <>
      <section className="pp-selector-section">
        <div className="pp-reveal">
          <div className="pp-section-tag">Choose Your Track</div>
          <div className="pp-section-title">8 CAREER <em>PATHS</em></div>
          <p className="pp-section-sub">Select a path below to explore the full 5-level roadmap with topics, projects, and timelines.</p>
        </div>

        <div className="pp-path-grid pp-reveal">
          {ROADMAPS.map((r) => (
            <button
              key={r.id}
              className={`pp-path-card${selectedId === r.id ? " pp-path-card-active" : ""}`}
              style={{ "--path-color": r.color }}
              onClick={() => onSelect(r.id)}
            >
              <div className="pp-path-card-visual">
                {CARD_SVGS[r.id]?.(r.color)}
              </div>
              <div className="pp-path-card-body">
                <div className="pp-path-icon">{r.icon}</div>
                <div className="pp-path-name">{r.name}</div>
                <div className="pp-path-meta">
                  <span>{r.totalTopics} topics</span>
                  <span>·</span>
                  <span>{r.duration}</span>
                </div>
              </div>
              <div className="pp-path-active-bar"/>
              <div className="pp-path-hover-border"/>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        .pp-selector-section {
          position: relative; z-index: 1; padding: 0 60px 80px;
        }
        .pp-path-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 1px; background: rgba(245,197,24,0.1);
          border: 1px solid rgba(245,197,24,0.18);
          margin-top: 50px; overflow: hidden;
        }
        .pp-path-card {
          background: #111; border: none; cursor: none;
          display: flex; flex-direction: column;
          transition: background 0.3s; position: relative; overflow: hidden;
          text-align: left;
        }
        .pp-path-card:hover { background: #161616; }
        .pp-path-card-active { background: rgba(245,197,24,0.06) !important; }
        .pp-path-card-visual { height: 130px; overflow: hidden; }
        .pp-path-card-visual svg { width: 100%; height: 100%; transition: transform 0.5s; }
        .pp-path-card:hover .pp-path-card-visual svg { transform: scale(1.05); }
        .pp-path-card-body { padding: 18px 20px 22px; }
        .pp-path-icon { font-size: 1.5rem; margin-bottom: 8px; }
        .pp-path-name {
          font-family: 'Bebas Neue', sans-serif; font-size: 1rem;
          letter-spacing: 1px; margin-bottom: 6px; transition: color 0.3s;
          color: #f5f5f0;
        }
        .pp-path-card:hover .pp-path-name,
        .pp-path-card-active .pp-path-name { color: var(--path-color); }
        .pp-path-meta {
          display: flex; gap: 6px;
          font-family: 'Space Mono', monospace; font-size: 0.6rem;
          color: #555; letter-spacing: 1px;
        }
        .pp-path-active-bar {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: var(--path-color);
          transform: scaleX(0); transform-origin: left; transition: transform 0.35s;
        }
        .pp-path-card:hover .pp-path-active-bar,
        .pp-path-card-active .pp-path-active-bar { transform: scaleX(1); }
        .pp-path-hover-border {
          position: absolute; inset: 0;
          border: 1.5px solid transparent; pointer-events: none; transition: border-color 0.3s;
        }
        .pp-path-card-active .pp-path-hover-border { border-color: rgba(245,197,24,0.35); }

        @media (max-width: 1100px) { .pp-path-grid { grid-template-columns: repeat(4,1fr); } }
        @media (max-width: 800px)  { .pp-path-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  {
          .pp-selector-section { padding: 0 24px 60px; }
          .pp-path-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  );
}
