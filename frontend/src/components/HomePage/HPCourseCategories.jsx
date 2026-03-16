import { Link } from "react-router-dom";

const CATEGORIES = [
  {
    name: "Web Development",
    count: "82 courses", icon: "💻",
    desc: "React, Next.js, Node.js, TypeScript, Full-Stack",
    color: "#f5c518",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <rect x="20" y="20" width="280" height="140" rx="4" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.3"/>
        <rect x="20" y="20" width="280" height="24" fill="#f5c518" opacity="0.08"/>
        <circle cx="36" cy="32" r="4" fill="#e74c3c"/><circle cx="50" cy="32" r="4" fill="#f5c518"/><circle cx="64" cy="32" r="4" fill="#27ae60"/>
        <text x="36" y="62" fontFamily="'Space Mono',monospace" fontSize="8" fill="#f5c518" opacity="0.7">&lt;div className="hero"&gt;</text>
        <text x="50" y="76" fontFamily="'Space Mono',monospace" fontSize="8" fill="#888" opacity="0.7">&lt;h1&gt;Hunt Your Greed&lt;/h1&gt;</text>
        <text x="36" y="90" fontFamily="'Space Mono',monospace" fontSize="8" fill="#f5c518" opacity="0.7">&lt;/div&gt;</text>
        <rect x="36" y="100" width="0" height="2" fill="#f5c518" opacity="0.6">
          <animate attributeName="width" values="0;240;0" dur="3s" repeatCount="indefinite"/>
        </rect>
        <rect x="36" y="108" width="0" height="2" fill="#f5c518" opacity="0.4">
          <animate attributeName="width" values="0;180;0" dur="3s" begin="0.5s" repeatCount="indefinite"/>
        </rect>
        <rect x="36" y="116" width="0" height="2" fill="#f5c518" opacity="0.3">
          <animate attributeName="width" values="0;120;0" dur="3s" begin="1s" repeatCount="indefinite"/>
        </rect>
      </svg>
    ),
  },
  {
    name: "Data Science & AI",
    count: "64 courses", icon: "🧠",
    desc: "Python, ML, TensorFlow, PyTorch, LLMs",
    color: "#3498db",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <g transform="translate(160,90)">
          <circle r="50" fill="none" stroke="#f5c518" strokeWidth="0.5" opacity="0.3">
            <animate attributeName="r" values="50;58;50" dur="4s" repeatCount="indefinite"/>
          </circle>
          {[0,60,120,180,240,300].map((deg, i) => {
            const rad = deg * Math.PI / 180;
            const x = Math.cos(rad) * 60, y = Math.sin(rad) * 60;
            return (
              <g key={i}>
                <line x1="0" y1="0" x2={x} y2={y} stroke="#f5c518" strokeWidth="0.5" opacity="0.4"/>
                <circle cx={x} cy={y} r="4" fill="#f5c518" opacity="0.6">
                  <animate attributeName="r" values="4;6;4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })}
          <circle r="8" fill="#f5c518"><animate attributeName="r" values="8;12;8" dur="2.5s" repeatCount="indefinite"/></circle>
        </g>
        <text x="160" y="168" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="20" fill="#f5c518" opacity="0.08" letterSpacing="4">NEURAL</text>
      </svg>
    ),
  },
  {
    name: "Mobile App Development",
    count: "38 courses", icon: "📱",
    desc: "Flutter, React Native, Swift, Kotlin",
    color: "#27ae60",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <g transform="translate(160,90)">
          <rect x="-30" y="-55" width="60" height="110" rx="8" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.5"/>
          <rect x="-22" y="-42" width="44" height="72" rx="2" fill="#f5c518" opacity="0.04"/>
          <circle cx="0" cy="48" r="5" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.5"/>
          <rect x="-8" y="-50" width="16" height="3" rx="1.5" fill="#f5c518" opacity="0.3"/>
          {/* App icons */}
          <rect x="-16" y="-32" width="12" height="12" rx="2" fill="#f5c518" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite"/>
          </rect>
          <rect x="4" y="-32" width="12" height="12" rx="2" fill="#f5c518" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="0.5s" repeatCount="indefinite"/>
          </rect>
          <rect x="-16" y="-16" width="12" height="12" rx="2" fill="#f5c518" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.8s" begin="1s" repeatCount="indefinite"/>
          </rect>
          <rect x="4" y="-16" width="12" height="12" rx="2" fill="#f5c518" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite"/>
          </rect>
        </g>
      </svg>
    ),
  },
  {
    name: "DevOps & Cloud",
    count: "52 courses", icon: "☁️",
    desc: "AWS, Docker, Kubernetes, CI/CD, Terraform",
    color: "#e67e22",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        {/* Cloud shape */}
        <g transform="translate(160,80)">
          <ellipse cx="0" cy="10" rx="70" ry="30" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4">
            <animate attributeName="ry" values="30;34;30" dur="3s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="-30" cy="0" r="22" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.3"/>
          <circle cx="30" cy="0" r="22" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.3"/>
          <circle cx="0" cy="-10" r="28" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.3"/>
          {/* Rain drops */}
          {[-30, -10, 10, 30].map((x, i) => (
            <line key={i} x1={x} y1="40" x2={x} y2="50" stroke="#f5c518" strokeWidth="1" opacity="0.5">
              <animate attributeName="y1" values="40;60" dur={`${0.8 + i * 0.2}s`} begin={`${i * 0.2}s`} repeatCount="indefinite"/>
              <animate attributeName="y2" values="50;70" dur={`${0.8 + i * 0.2}s`} begin={`${i * 0.2}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0.5" dur={`${0.8 + i * 0.2}s`} begin={`${i * 0.2}s`} repeatCount="indefinite"/>
            </line>
          ))}
        </g>
        <text x="160" y="168" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="20" fill="#f5c518" opacity="0.06" letterSpacing="4">CLOUD</text>
      </svg>
    ),
  },
  {
    name: "Cybersecurity",
    count: "29 courses", icon: "🔐",
    desc: "Ethical Hacking, Pentest, OWASP, CTF",
    color: "#e74c3c",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <g transform="translate(160,85)">
          {/* Shield */}
          <path d="M0,-50 L40,-30 L40,20 Q40,50 0,65 Q-40,50 -40,20 L-40,-30 Z" fill="none" stroke="#f5c518" strokeWidth="1.2" opacity="0.5"/>
          <path d="M0,-36 L28,-21 L28,18 Q28,38 0,50 Q-28,38 -28,18 L-28,-21 Z" fill="#f5c518" opacity="0.04"/>
          {/* Lock */}
          <rect x="-10" y="-5" width="20" height="16" rx="2" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.7"/>
          <path d="M-6,-5 L-6,-12 Q-6,-20 0,-20 Q6,-20 6,-12 L6,-5" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.7"/>
          <circle cx="0" cy="3" r="3" fill="#f5c518" opacity="0.7">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          {/* Orbiting shield elements */}
          <circle r="4" fill="#f5c518" opacity="0.5">
            <animateMotion dur="5s" repeatCount="indefinite" path="M0,0 A60,60 0 1,1 0.1,0"/>
          </circle>
        </g>
      </svg>
    ),
  },
  {
    name: "Programming Languages",
    count: "44 courses", icon: "⚡",
    desc: "Python, JavaScript, Go, Rust, Java, C++",
    color: "#9b59b6",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <defs>
          <pattern id="hp-cat-code" width="32" height="32" patternUnits="userSpaceOnUse">
            <text x="2" y="12" fontFamily="'Space Mono',monospace" fontSize="8" fill="#f5c518" opacity="0.12">def</text>
            <text x="2" y="28" fontFamily="'Space Mono',monospace" fontSize="8" fill="#f5c518" opacity="0.08">{"{}"}</text>
          </pattern>
        </defs>
        <rect width="320" height="180" fill="url(#hp-cat-code)"/>
        <g transform="translate(160,90)">
          <text x="0" y="-20" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="28" fill="#f5c518" opacity="0">
            &lt;/&gt;
            <animate attributeName="opacity" values="0;0.8;0;0.8;0" dur="4s" repeatCount="indefinite"/>
          </text>
          <text x="0" y="10" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="22" fill="#f5c518" opacity="0">
            fn main()
            <animate attributeName="opacity" values="0;0.6;0;0.6;0" dur="4s" begin="1.5s" repeatCount="indefinite"/>
          </text>
          <text x="0" y="36" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="20" fill="#f5c518" opacity="0">
            print()
            <animate attributeName="opacity" values="0;0.7;0;0.7;0" dur="4s" begin="3s" repeatCount="indefinite"/>
          </text>
        </g>
      </svg>
    ),
  },
  {
    name: "Career & Interview Prep",
    count: "31 courses", icon: "🎯",
    desc: "DSA, System Design, Resume, Mock Interviews",
    color: "#1abc9c",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <g transform="translate(160,90)">
          {/* Target rings */}
          <circle r="65" fill="none" stroke="#f5c518" strokeWidth="0.5" opacity="0.15"/>
          <circle r="48" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.2"/>
          <circle r="32" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.3"/>
          <circle r="18" fill="none" stroke="#f5c518" strokeWidth="1.2" opacity="0.5"/>
          <circle r="6" fill="#f5c518" opacity="0.8">
            <animate attributeName="r" values="6;9;6" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          {/* Arrow */}
          <line x1="-90" y1="-20" x2="-18" y2="0" stroke="#f5c518" strokeWidth="2" opacity="0.6">
            <animate attributeName="x1" values="-90;-50;-90" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="y1" values="-20;-5;-20" dur="2s" repeatCount="indefinite"/>
          </line>
          <polygon points="-18,0 -28,-6 -26,6" fill="#f5c518" opacity="0.6"/>
        </g>
        <text x="160" y="168" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="18" fill="#f5c518" opacity="0.06" letterSpacing="3">HIRED</text>
      </svg>
    ),
  },
  {
    name: "Game Development",
    count: "36 courses", icon: "🎮",
    desc: "Unity, Unreal Engine, Godot, 3D Graphics, Multiplayer",
    color: "#ff006e",
    svg: (
      <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="none"/>
        <g transform="translate(160,90)">
          {/* Game controller shape */}
          <ellipse cx="0" cy="0" rx="65" ry="48" fill="none" stroke="#f5c518" strokeWidth="1.2" opacity="0.3"/>
          {/* Left side buttons */}
          <circle cx="-40" cy="-15" r="5" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
          <circle cx="-40" cy="15" r="5" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
          {/* Right side buttons */}
          <circle cx="40" cy="-10" r="6" fill="none" stroke="#f5c518" strokeWidth="1.2" opacity="0.6">
            <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="50" cy="5" r="5" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
          <circle cx="40" cy="18" r="5" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
          {/* D-Pad */}
          <rect x="-52" y="-8" width="4" height="16" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.5"/>
          <rect x="-56" y="-4" width="16" height="4" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.5"/>
          {/* Center light */}
          <circle cx="0" cy="0" r="8" fill="none" stroke="#f5c518" strokeWidth="1.5" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="0" cy="0" r="3" fill="#f5c518" opacity="0.7">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>
        <text x="160" y="168" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="20" fill="#f5c518" opacity="0.06" letterSpacing="4">PLAY</text>
      </svg>
    ),
  },
];

export default function HPCourseCategories() {
  return (
    <>
      <section className="hp-categories-section">
        <div className="hp-reveal">
          <div className="hp-section-tag">Browse by Category</div>
          <div className="hp-section-title">COURSE <em>CATEGORIES</em></div>
          <p className="hp-section-sub">Every domain. Every level. Find your path and start building.</p>
        </div>

        <div className="hp-cat-grid hp-reveal">
          {CATEGORIES.map((cat, i) => (
            <Link to="/courses" key={i} className="hp-cat-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="hp-cat-visual">{cat.svg}</div>
              <div className="hp-cat-body">
                <div className="hp-cat-name">{cat.name}</div>
                <div className="hp-cat-desc">{cat.desc}</div>
                <div className="hp-cat-footer">
                  <span className="hp-cat-count">{cat.count}</span>
                  <span className="hp-cat-arrow">→</span>
                </div>
              </div>
              <div className="hp-cat-hover-bar" />
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        .hp-categories-section {
          position: relative; z-index: 1;
          padding: 0 60px 100px;
        }
        .hp-cat-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: rgba(245,197,24,0.1);
          border: 1px solid rgba(245,197,24,0.18);
          margin-top: 50px; overflow: hidden;
        }
        .hp-cat-card {
          background: #111; position: relative;
          cursor: none; text-decoration: none; color: inherit;
          transition: background 0.3s, transform 0.3s;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .hp-cat-card:hover { background: #000; }
        .hp-cat-visual { height: 160px; overflow: hidden; flex-shrink: 0; }
        .hp-cat-visual svg { width: 100%; height: 100%; transition: transform 0.5s; }
        .hp-cat-card:hover .hp-cat-visual svg { transform: scale(1.05); }
        .hp-cat-body { padding: 24px 22px 22px; flex: 1; display: flex; flex-direction: column; }
        .hp-cat-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem; letter-spacing: 1px; margin-bottom: 6px;
          transition: color 0.3s;
        }
        .hp-cat-card:hover .hp-cat-name { color: #f5c518; }
        .hp-cat-desc { font-size: 0.74rem; color: #888; line-height: 1.5; margin-bottom: 14px; flex: 1; }
        .hp-cat-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
        .hp-cat-count {
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem; color: #f5c518; letter-spacing: 2px;
        }
        .hp-cat-arrow {
          color: #555; font-size: 1.1rem;
          transition: color 0.3s, transform 0.3s;
        }
        .hp-cat-card:hover .hp-cat-arrow { color: #f5c518; transform: translateX(4px); }
        .hp-cat-hover-bar {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #f5c518;
          transform: scaleX(0); transform-origin: left; transition: transform 0.4s;
        }
        .hp-cat-card:hover .hp-cat-hover-bar { transform: scaleX(1); }

        @media (max-width: 1100px) { .hp-cat-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 760px)  { .hp-cat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  {
          .hp-categories-section { padding: 0 24px 80px; }
          .hp-cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
