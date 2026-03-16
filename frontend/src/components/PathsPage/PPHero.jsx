export default function PPHero() {
  return (
    <>
      <section className="pp-hero">
        <div className="pp-hero-bg-text" aria-hidden="true">PATHS</div>

        {/* Animated branching SVG */}
        <svg className="pp-hero-deco" viewBox="0 0 700 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pp-hg" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5c518" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#f5c518" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Main trunk */}
          <line x1="350" y1="580" x2="350" y2="320" stroke="url(#pp-hg)" strokeWidth="2">
            <animate attributeName="stroke-dasharray" values="0,300;260,300" dur="2s" fill="freeze"/>
          </line>
          {/* Branch left */}
          <path d="M350,320 C350,280 260,260 180,200" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200" opacity="0.6">
            <animate attributeName="stroke-dashoffset" values="200;0" dur="1.5s" begin="1.5s" fill="freeze"/>
          </path>
          {/* Branch right */}
          <path d="M350,320 C350,280 440,260 520,200" fill="none" stroke="#f5c518" strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200" opacity="0.6">
            <animate attributeName="stroke-dashoffset" values="200;0" dur="1.5s" begin="1.7s" fill="freeze"/>
          </path>
          {/* Sub branches left */}
          <path d="M180,200 C160,160 120,140 80,100" fill="none" stroke="#f5c518" strokeWidth="1" strokeDasharray="140" strokeDashoffset="140" opacity="0.4">
            <animate attributeName="stroke-dashoffset" values="140;0" dur="1s" begin="2.5s" fill="freeze"/>
          </path>
          <path d="M180,200 C190,160 210,140 230,100" fill="none" stroke="#f5c518" strokeWidth="1" strokeDasharray="120" strokeDashoffset="120" opacity="0.4">
            <animate attributeName="stroke-dashoffset" values="120;0" dur="1s" begin="2.7s" fill="freeze"/>
          </path>
          {/* Sub branches right */}
          <path d="M520,200 C500,160 480,140 460,100" fill="none" stroke="#f5c518" strokeWidth="1" strokeDasharray="120" strokeDashoffset="120" opacity="0.4">
            <animate attributeName="stroke-dashoffset" values="120;0" dur="1s" begin="2.9s" fill="freeze"/>
          </path>
          <path d="M520,200 C540,160 560,140 600,100" fill="none" stroke="#f5c518" strokeWidth="1" strokeDasharray="140" strokeDashoffset="140" opacity="0.4">
            <animate attributeName="stroke-dashoffset" values="140;0" dur="1s" begin="3.1s" fill="freeze"/>
          </path>
          {/* Nodes */}
          {[
            [350,320], [180,200], [520,200],
            [80,100], [230,100], [460,100], [600,100],
          ].map(([x,y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="0" fill="#f5c518" opacity="0.9">
                <animate attributeName="r" values="0;10" dur="0.4s" begin={`${1.2 + i * 0.3}s`} fill="freeze"/>
              </circle>
              <circle cx={x} cy={y} r="0" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0">
                <animate attributeName="r" values="10;26" dur="1.5s" begin={`${1.6 + i * 0.3}s`} repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0" dur="1.5s" begin={`${1.6 + i * 0.3}s`} repeatCount="indefinite"/>
              </circle>
            </g>
          ))}
          {/* Level labels */}
          {["LEVEL 5","LEVEL 4","LEVEL 3","LEVEL 2","LEVEL 1"].map((lbl, i) => (
            <text key={i} x="352" y={320 - i * 60 + 4} fontFamily="'Space Mono',monospace" fontSize="8" fill="#f5c518" opacity="0" letterSpacing="2" textAnchor="middle">
              {lbl}
              <animate attributeName="opacity" values="0;0.4" dur="0.5s" begin={`${2 + i * 0.2}s`} fill="freeze"/>
            </text>
          ))}
        </svg>

        <div className="pp-hero-content">
          <div className="pp-hero-badge">
            <span className="pp-hero-badge-dot"/>
            Structured Learning — 8 Career Tracks
          </div>
          <h1 className="pp-hero-h1">
            CHOOSE YOUR<br/><em>BATTLEFIELD.</em><br/>OWN THE PATH.
          </h1>
          <p className="pp-hero-sub">
            Every expert started at Level 1. Follow GHA's battle-tested roadmaps —
            5 levels per track, from absolute beginner to senior architect.
            No shortcuts. Just the right sequence.
          </p>
          <div className="pp-hero-stats">
            {[
              { n:"8", label:"Career Tracks" },
              { n:"5", label:"Levels Each" },
              { n:"200+", label:"Topics Mapped" },
              { n:"100+", label:"Projects" },
            ].map((s) => (
              <div key={s.label}>
                <div className="pp-hero-stat-num">{s.n}</div>
                <div className="pp-hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .pp-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          padding: 120px 60px 80px; overflow: hidden; z-index: 1;
        }
        .pp-hero-bg-text {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(140px, 24vw, 340px);
          color: transparent; -webkit-text-stroke: 1px rgba(245,197,24,0.05);
          white-space: nowrap; letter-spacing: 14px; pointer-events: none;
          animation: ppBgDrift 22s ease-in-out infinite alternate;
        }
        .pp-hero-deco {
          position: absolute; right: 0; top: 50%;
          transform: translateY(-50%);
          width: 50%; height: 90vh; pointer-events: none; opacity: 0.14;
        }
        .pp-hero-content { position: relative; z-index: 2; max-width: 660px; }
        .pp-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(245,197,24,0.12); border: 1px solid rgba(245,197,24,0.18);
          padding: 6px 16px; font-family: 'Space Mono', monospace;
          font-size: 0.7rem; letter-spacing: 2px; color: #f5c518;
          text-transform: uppercase; margin-bottom: 28px;
          animation: ppFadeInUp 0.8s ease both;
        }
        .pp-hero-badge-dot {
          width: 6px; height: 6px; background: #f5c518; border-radius: 50%;
          display: inline-block; animation: ppPulse 2s ease-in-out infinite;
        }
        .pp-hero-h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(62px, 8.5vw, 110px);
          line-height: 0.92; letter-spacing: 2px; color: #f5f5f0; margin-bottom: 24px;
          animation: ppFadeInUp 0.8s 0.1s ease both;
        }
        .pp-hero-h1 em { font-style: normal; color: #f5c518; }
        .pp-hero-sub {
          font-size: 1.05rem; color: #888; line-height: 1.75;
          max-width: 500px; margin-bottom: 50px;
          animation: ppFadeInUp 0.8s 0.2s ease both;
        }
        .pp-hero-stats {
          display: flex; gap: 44px; flex-wrap: wrap;
          padding-top: 36px; border-top: 1px solid rgba(255,255,255,0.06);
          animation: ppFadeInUp 0.8s 0.35s ease both;
        }
        .pp-hero-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.6rem; color: #f5c518; line-height: 1;
        }
        .pp-hero-stat-label {
          font-size: 0.72rem; letter-spacing: 2px; color: #888;
          text-transform: uppercase; margin-top: 4px;
        }
        @media (max-width: 768px) {
          .pp-hero { padding: 100px 24px 60px; }
          .pp-hero-deco { display: none; }
          .pp-hero-stats { gap: 28px; }
        }
      `}</style>
    </>
  );
}
