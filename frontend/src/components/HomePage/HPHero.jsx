import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function useCounterOnReveal(targetEl, target, suffix) {
  useEffect(() => {
    if (!targetEl) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let current = 0;
        const step = target / 60;
        const iv = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(iv); }
          entry.target.textContent = Math.floor(current) + suffix;
        }, 16);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(targetEl);
    return () => obs.disconnect();
  }, [targetEl, target, suffix]);
}

function StatCounter({ target, suffix, label }) {
  const ref = useRef(null);
  useCounterOnReveal(ref.current, target, suffix);
  // Re-run when ref is populated
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let current = 0;
        const step = target / 60;
        const iv = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(iv); }
          el.textContent = Math.floor(current) + suffix;
        }, 16);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix]);

  return (
    <div>
      <div className="hp-hero-stat-num" ref={ref}>0{suffix}</div>
      <div className="hp-hero-stat-label">{label}</div>
    </div>
  );
}

export default function HPHero() {
  return (
    <>
      <section className="hp-hero">
        {/* Animated BG text */}
        <div className="hp-hero-bg-text" aria-hidden="true">GHA</div>

        {/* Grid lines */}
        <div className="hp-hero-grid" />

        {/* Hero SVG — animated concentric hexagons */}
        <svg className="hp-hero-svg" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hp-hg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5c518" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#f5c518" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <g transform="translate(300,400)">
            <polygon points="0,-200 173,-100 173,100 0,200 -173,100 -173,-100" fill="none" stroke="url(#hp-hg1)" strokeWidth="0.5">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite"/>
            </polygon>
            <polygon points="0,-150 130,-75 130,75 0,150 -130,75 -130,-75" fill="none" stroke="url(#hp-hg1)" strokeWidth="0.8">
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="30s" repeatCount="indefinite"/>
            </polygon>
            <polygon points="0,-100 87,-50 87,50 0,100 -87,50 -87,-50" fill="none" stroke="url(#hp-hg1)" strokeWidth="1">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
            </polygon>
            <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" fill="none" stroke="url(#hp-hg1)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="15s" repeatCount="indefinite"/>
            </polygon>
            <circle r="8" fill="#f5c518">
              <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite"/>
            </circle>
          </g>
          <line x1="0" y1="400" x2="600" y2="400" stroke="#f5c518" strokeWidth="0.3" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite"/>
          </line>
          <line x1="300" y1="0" x2="300" y2="800" stroke="#f5c518" strokeWidth="0.3" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" begin="2s" repeatCount="indefinite"/>
          </line>
          <circle r="3" fill="#f5c518">
            <animateMotion dur="10s" repeatCount="indefinite" path="M300,200 A100,100 0 1,1 299,200"/>
          </circle>
          <circle r="2" fill="#f5c518" opacity="0.6">
            <animateMotion dur="15s" repeatCount="indefinite" path="M300,250 A150,150 0 0,0 299,250"/>
          </circle>
        </svg>

        {/* Content */}
        <div className="hp-hero-content">
          <div className="hp-hero-badge">
            <span className="hp-hero-badge-dot" />
            Now Live — Spring 2025 Cohort
          </div>

          <h1 className="hp-hero-h1">
            HUNT YOUR<br/>
            <em>GREED.</em><br/>
            MASTER YOUR<br/>
            CRAFT.
          </h1>

          <p className="hp-hero-sub">
            GreedHunterAcademe is where relentless ambition meets world-class education.
            Real skills. Real mentors. Real outcomes — from day one.
          </p>

          <div className="hp-hero-actions">
            <Link to="/courses" className="hp-btn-primary">
              <span>Explore Courses</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Link>
            <a href="#editors-pick" className="hp-btn-secondary">
              View Editor's Pick
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </a>
          </div>

          <div className="hp-hero-stats">
            <StatCounter target={48}  suffix="K+" label="Active Learners"    />
            <StatCounter target={320} suffix="+"  label="Expert Courses"     />
            <StatCounter target={98}  suffix="%"  label="Completion Rate"    />
            <StatCounter target={500} suffix="+"  label="Hiring Partners"    />
          </div>
        </div>
      </section>

      <style>{`
        .hp-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          padding: 120px 60px 80px;
          overflow: hidden; z-index: 1;
        }
        .hp-hero-bg-text {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(120px, 22vw, 300px);
          color: transparent;
          -webkit-text-stroke: 1px rgba(245,197,24,0.06);
          white-space: nowrap; letter-spacing: 12px;
          pointer-events: none;
          animation: hpBgTextDrift 20s ease-in-out infinite alternate;
        }
        .hp-hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(245,197,24,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,197,24,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          animation: hpGridShift 20s linear infinite;
        }
        .hp-hero-svg {
          position: absolute; right: 0; top: 50%;
          transform: translateY(-50%);
          width: 52%; height: 90vh;
          opacity: 0.12; pointer-events: none;
        }
        .hp-hero-content {
          position: relative; z-index: 2; max-width: 680px;
        }
        .hp-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(245,197,24,0.15);
          border: 1px solid rgba(245,197,24,0.18);
          padding: 6px 16px;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem; letter-spacing: 2px;
          color: #f5c518; text-transform: uppercase;
          margin-bottom: 28px;
          animation: hpFadeInUp 0.8s ease both;
        }
        .hp-hero-badge-dot {
          width: 6px; height: 6px;
          background: #f5c518; border-radius: 50%;
          display: inline-block;
          animation: hpPulse 2s ease-in-out infinite;
        }
        .hp-hero-h1 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(64px, 9vw, 118px);
          line-height: 0.92; letter-spacing: 2px;
          color: #f5f5f0; margin-bottom: 24px;
          animation: hpFadeInUp 0.8s 0.1s ease both;
        }
        .hp-hero-h1 em {
          font-style: normal; color: #f5c518; position: relative;
        }
        .hp-hero-h1 em::after {
          content: ''; position: absolute; left: 0; bottom: 4px; right: 0; height: 4px;
          background: #f5c518; transform: scaleX(0); transform-origin: left;
          animation: hpUnderlineReveal 0.8s 1s ease forwards;
        }
        .hp-hero-sub {
          font-size: 1.1rem; color: #888; line-height: 1.7;
          max-width: 500px; margin-bottom: 40px;
          animation: hpFadeInUp 0.8s 0.2s ease both;
        }
        .hp-hero-actions {
          display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
          animation: hpFadeInUp 0.8s 0.3s ease both;
        }
        .hp-hero-stats {
          display: flex; gap: 44px; margin-top: 70px;
          animation: hpFadeInUp 0.8s 0.5s ease both;
          padding-top: 40px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap;
        }
        .hp-hero-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.8rem; color: #f5c518; line-height: 1;
        }
        .hp-hero-stat-label {
          font-size: 0.72rem; letter-spacing: 2px; color: #888;
          text-transform: uppercase; margin-top: 4px;
        }
        @media (max-width: 768px) {
          .hp-hero { padding: 100px 24px 60px; }
          .hp-hero-svg { display: none; }
          .hp-hero-stats { gap: 28px; }
        }
      `}</style>
    </>
  );
}
