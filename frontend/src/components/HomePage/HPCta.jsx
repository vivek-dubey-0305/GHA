import { Link } from "react-router-dom";

export default function HPCta() {
  return (
    <>
      <div className="hp-cta-section">
        <svg className="hp-cta-bg" viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hp-ctag" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke="#000" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="1200" height="300" fill="url(#hp-ctag)"/>
          <text x="600" y="200" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="200" fill="#000" opacity="0.06" letterSpacing="10">START</text>
        </svg>
        <div className="hp-cta-inner">
          <div>
            <div className="hp-cta-title">READY TO<br/>LEVEL UP?</div>
            <p className="hp-cta-sub">
              Join 48,000+ learners who have transformed their careers with GHA.
              Get full access to all courses today.
            </p>
          </div>
          <div className="hp-cta-actions">
            <Link to="/courses" className="hp-btn-dark">Get Full Access →</Link>
            <span className="hp-cta-note">30-day money-back guarantee</span>
          </div>
        </div>
      </div>

      <style>{`
        .hp-cta-section {
          position: relative; z-index: 1;
          background: #f5c518; padding: 100px 60px; overflow: hidden;
        }
        .hp-cta-section * { color: #0a0a0a; }
        .hp-cta-bg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.08; }
        .hp-cta-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between;
          gap: 40px; flex-wrap: wrap;
        }
        .hp-cta-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(48px, 5.5vw, 80px);
          line-height: 0.9; letter-spacing: 3px;
        }
        .hp-cta-sub { font-size: 1rem; line-height: 1.7; max-width: 380px; margin-top: 16px; opacity: 0.7; }
        .hp-cta-actions { display: flex; flex-direction: column; gap: 12px; align-items: center; }
        .hp-cta-note { font-size: 0.72rem; letter-spacing: 1px; opacity: 0.6; }
        @media (max-width: 768px) {
          .hp-cta-section { padding: 80px 24px; }
          .hp-cta-inner { flex-direction: column; }
        }
      `}</style>
    </>
  );
}
