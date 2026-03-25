import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function HPNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
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
        <button
          className={`hp-nav-hamburger${isMenuOpen ? " is-open" : ""}`}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {isMenuOpen && <button className="hp-nav-mobile-overlay" aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />}

      <aside className={`hp-nav-mobile${isMenuOpen ? " open" : ""}`}>
        <NavLink to="/courses" onClick={() => setIsMenuOpen(false)}>Courses</NavLink>
        <NavLink to="/instructors" onClick={() => setIsMenuOpen(false)}>Instructors</NavLink>
        <NavLink to="/paths" onClick={() => setIsMenuOpen(false)}>Paths</NavLink>
        <a href="#community" onClick={() => setIsMenuOpen(false)}>Community</a>
        <Link to="/courses" className="hp-nav-mobile-cta" onClick={() => setIsMenuOpen(false)}>
          Start Learning
        </Link>
      </aside>

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
          transition: transform 0.3s, opacity 0.3s;
        }
        .hp-nav-hamburger.is-open span:nth-child(1) {
          transform: translateY(6.5px) rotate(45deg);
        }
        .hp-nav-hamburger.is-open span:nth-child(2) {
          opacity: 0;
        }
        .hp-nav-hamburger.is-open span:nth-child(3) {
          transform: translateY(-6.5px) rotate(-45deg);
        }
        .hp-nav-mobile-overlay {
          position: fixed;
          inset: 0;
          border: none;
          background: rgba(0,0,0,0.55);
          z-index: 98;
        }
        .hp-nav-mobile {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          transform: translateY(-12px);
          opacity: 0;
          pointer-events: none;
          display: grid;
          gap: 4px;
          background: rgba(10,10,10,0.98);
          border-bottom: 1px solid rgba(245,197,24,0.16);
          padding: 14px 24px 18px;
          z-index: 99;
          transition: opacity 0.2s, transform 0.2s;
        }
        .hp-nav-mobile.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .hp-nav-mobile a {
          font-size: 0.85rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #d1d1d1;
          text-decoration: none;
          padding: 10px 0;
        }
        .hp-nav-mobile a.active {
          color: #f5c518;
        }
        .hp-nav-mobile-cta {
          margin-top: 8px;
          background: #f5c518 !important;
          color: #0a0a0a !important;
          text-align: center !important;
          padding: 11px 18px !important;
          font-weight: 700;
          clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
        }
        @media (max-width: 768px) {
          .hp-nav { padding: 16px 24px; }
          .hp-nav-scrolled { padding: 12px 24px; }
          .hp-nav-links { display: none; }
          .hp-nav-hamburger { display: flex; }
        }
        @media (min-width: 769px) {
          .hp-nav-mobile,
          .hp-nav-mobile-overlay {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .hp-nav,
          .hp-nav-scrolled {
            padding-left: 14px;
            padding-right: 14px;
          }
          .hp-nav-logo {
            font-size: 1.6rem;
            letter-spacing: 3px;
          }
          .hp-nav-mobile {
            top: 58px;
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>
    </>
  );
}
