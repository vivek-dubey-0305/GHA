import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function HPNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <nav className={`hp-nav${scrolled ? " hp-nav-scrolled" : ""}`}>
        <Link to="/" className="hp-nav-logo">GH<span>A</span></Link>
        <div className="hp-nav-links">
          <NavLink to="/courses">Courses</NavLink>
          <NavLink to="/instructors">Instructors</NavLink>
          <NavLink to="/paths">Paths</NavLink>
          {/* <a href="#paths">Paths</a> */}
          <a href="#community">Community</a>
          <Link to="/courses" className="hp-nav-cta">Start Learning</Link>
        </div>
        {/* Mobile hamburger placeholder */}
        <button className="hp-nav-hamburger" aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      <style>{`
        .hp-nav {
          position: fixed; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 60px;
          z-index: 100;
          background: linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%);
          backdrop-filter: blur(2px);
          transition: background 0.3s, padding 0.3s;
        }
        .hp-nav-scrolled {
          background: rgba(10,10,10,0.97);
          backdrop-filter: blur(14px);
          padding: 14px 60px;
          border-bottom: 1px solid rgba(245,197,24,0.12);
        }
        .hp-nav-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem; letter-spacing: 4px;
          color: #f5f5f0; text-decoration: none;
          position: relative;
        }
        .hp-nav-logo span { color: #f5c518; }
        .hp-nav-logo::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 2px; background: #f5c518;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
        }
        .hp-nav-logo:hover::after { transform: scaleX(1); }
        .hp-nav-links {
          display: flex; gap: 36px; align-items: center;
        }
        .hp-nav-links a {
          font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase;
          color: #888; text-decoration: none; transition: color 0.3s; font-weight: 500;
        }
        .hp-nav-links a:hover,
        .hp-nav-links a.active { color: #f5f5f0; }
        .hp-nav-cta {
          background: #f5c518 !important; color: #0a0a0a !important;
          padding: 10px 24px; font-weight: 700 !important;
          clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
          transition: background 0.3s !important;
        }
        .hp-nav-cta:hover { background: #fff !important; color: #0a0a0a !important; }
        .hp-nav-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .hp-nav-hamburger span {
          display: block; width: 22px; height: 1.5px; background: #f5f5f0;
          transition: transform 0.3s;
        }
        @media (max-width: 768px) {
          .hp-nav { padding: 16px 24px; }
          .hp-nav-scrolled { padding: 12px 24px; }
          .hp-nav-links { display: none; }
          .hp-nav-hamburger { display: flex; }
        }
      `}</style>
    </>
  );
}
