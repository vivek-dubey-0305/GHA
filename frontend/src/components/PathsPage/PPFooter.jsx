import { Link } from "react-router-dom";

export default function PPFooter() {
  return (
    <>
      <footer className="pp-footer">
        <Link to="/" className="pp-footer-logo">GH<span>A</span></Link>
        <span className="pp-footer-copy">© {new Date().getFullYear()} GreedHunterAcademy · All rights reserved</span>
        <div className="pp-footer-links">
          <Link to="/courses">Courses</Link>
          <Link to="/instructors">Instructors</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </footer>
      <style>{`
        .pp-footer {
          position: relative; z-index: 1;
          background: #0a0a0a; border-top: 1px solid rgba(245,197,24,0.15);
          padding: 28px 60px; display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .pp-footer-logo {
          font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem;
          letter-spacing: 3px; text-decoration: none; color: #f5f5f0;
        }
        .pp-footer-logo span { color: #f5c518; }
        .pp-footer-copy {
          font-family: 'Space Mono', monospace; font-size: 0.62rem; color: #555; letter-spacing: 1px;
        }
        .pp-footer-links { display: flex; gap: 24px; }
        .pp-footer-links a {
          font-size: 0.75rem; color: #555; text-decoration: none;
          transition: color 0.25s;
        }
        .pp-footer-links a:hover { color: #f5c518; }
        @media (max-width: 480px) { .pp-footer { padding: 20px 24px; } }
      `}</style>
    </>
  );
}
