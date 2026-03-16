import { Link } from "react-router-dom";

export default function HPFooter() {
  return (
    <>
      <footer className="hp-footer">
        <div className="hp-footer-grid">
          <div>
            <div className="hp-footer-brand-name">GH<span>A</span></div>
            <div className="hp-footer-brand-desc">
              Elite learning for relentlessly ambitious professionals. Real skills,
              real mentors, real outcomes — from day one.
            </div>
          </div>
          <div>
            <div className="hp-footer-col-title">Platform</div>
            <ul className="hp-footer-links">
              <li><Link to="/courses">All Courses</Link></li>
              <li><a href="#paths">Learning Paths</a></li>
              <li><a href="#certificates">Certificates</a></li>
              <li><a href="#community">Community</a></li>
            </ul>
          </div>
          <div>
            <div className="hp-footer-col-title">Company</div>
            <ul className="hp-footer-links">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/instructors">Instructors</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div>
            <div className="hp-footer-col-title">Support</div>
            <ul className="hp-footer-links">
              <li><a href="#help">Help Center</a></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="hp-footer-bottom">
          <span>© {new Date().getFullYear()} GreedHunterAcademy. All rights reserved.</span>
          <span>Built for builders. 🔨</span>
        </div>

        {/* Scroll to top */}
        <button
          className="hp-scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >↑</button>
      </footer>

      <style>{`
        .hp-footer {
          background: #0a0a0a;
          border-top: 1px solid rgba(245,197,24,0.18);
          padding: 60px 60px 36px;
          position: relative; z-index: 1;
        }
        .hp-footer-grid {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px; margin-bottom: 50px;
        }
        .hp-footer-brand-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.4rem; letter-spacing: 4px; margin-bottom: 16px;
          color: #f5f5f0;
        }
        .hp-footer-brand-name span { color: #f5c518; }
        .hp-footer-brand-desc { font-size: 0.85rem; color: #888; line-height: 1.7; max-width: 280px; }
        .hp-footer-col-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; letter-spacing: 3px; color: #f5c518;
          text-transform: uppercase; margin-bottom: 20px;
        }
        .hp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .hp-footer-links a {
          font-size: 0.85rem; color: #888; text-decoration: none; transition: color 0.3s;
        }
        .hp-footer-links a:hover { color: #f5f5f0; }
        .hp-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 24px;
          display: flex; align-items: center; justify-content: space-between;
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem; color: #888; letter-spacing: 1px;
          flex-wrap: wrap; gap: 12px;
        }
        .hp-scroll-top {
          position: fixed; bottom: 32px; right: 32px;
          width: 42px; height: 42px;
          background: #f5c518; color: #080808;
          border-radius: 50%; border: none; cursor: none;
          font-size: 1.1rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(245,197,24,0.35);
          transition: transform 0.25s, background 0.3s;
        }
        .hp-scroll-top:hover { transform: scale(1.1); background: #fff; }
        @media (max-width: 900px) { .hp-footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; } }
        @media (max-width: 480px) {
          .hp-footer { padding: 40px 24px 28px; }
          .hp-footer-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </>
  );
}
