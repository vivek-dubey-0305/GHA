import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/slices/auth.slice";

export default function GlobalNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const handleCtaClick = () => {
    setIsMenuOpen(false);
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    navigate("/register");
  };

  return (
    <>
      <nav className={`global-nav${scrolled ? " global-nav-scrolled" : ""}`}>
        <Link to="/" className="global-nav-logo">GH<span>A</span></Link>
        <div className="global-nav-links">
          <NavLink to="/courses">Courses</NavLink>
          <NavLink to="/instructors">Instructors</NavLink>
          <NavLink to="/paths">Paths</NavLink>
          <a href="#community">Community</a>
          {isAuthenticated ? (
            <button 
              onClick={handleCtaClick}
              className="global-nav-cta"
            >
              Dashboard
            </button>
          ) : (
            <div className="global-nav-auth-group">
              {/* <button 
                onClick={() => navigate("/login")}
                className="global-nav-link-btn"
              >
                Login
              </button> */}
              <button 
                onClick={handleCtaClick}
                className="global-nav-cta"
              >
                Start Learning
              </button>
            </div>
          )}
        </div>
        <button
          className={`global-nav-hamburger${isMenuOpen ? " is-open" : ""}`}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {isMenuOpen && <button className="global-nav-mobile-overlay" aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />}

      <aside className={`global-nav-mobile${isMenuOpen ? " open" : ""}`}>
        <NavLink to="/courses" onClick={() => setIsMenuOpen(false)}>Courses</NavLink>
        <NavLink to="/instructors" onClick={() => setIsMenuOpen(false)}>Instructors</NavLink>
        <NavLink to="/paths" onClick={() => setIsMenuOpen(false)}>Paths</NavLink>
        <a href="#community" onClick={() => setIsMenuOpen(false)}>Community</a>
        <button onClick={handleCtaClick} className="global-nav-mobile-cta">
          {isAuthenticated ? "Dashboard" : "Start Learning"}
        </button>
      </aside>

      <style>{`
        .global-nav {
          position: fixed; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 60px;
          z-index: 100;
          background: linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%);
          backdrop-filter: blur(2px);
          transition: background 0.3s, padding 0.3s;
        }
        .global-nav-scrolled {
          background: rgba(10,10,10,0.97);
          backdrop-filter: blur(14px);
          padding: 14px 60px;
          border-bottom: 1px solid rgba(245,197,24,0.12);
        }
        .global-nav-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem; letter-spacing: 4px;
          color: #f5f5f0; text-decoration: none;
          position: relative;
        }
        .global-nav-logo span { color: #f5c518; }
        .global-nav-logo::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 2px; background: #f5c518;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
        }
        .global-nav-logo:hover::after { transform: scaleX(1); }
        .global-nav-links {
          display: flex; gap: 36px; align-items: center;
        }
        .global-nav-links a,
        .global-nav-link-btn {
          font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase;
          color: #888; text-decoration: none; transition: color 0.3s; font-weight: 500;
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: inherit;
        }
        .global-nav-links a:hover,
        .global-nav-links a.active,
        .global-nav-link-btn:hover { color: #f5f5f0; }
        .global-nav-auth-group {
          display: flex; gap: 16px; align-items: center;
        }
        .global-nav-cta {
          background: #f5c518 !important; color: #0a0a0a !important;
          padding: 10px 24px; font-weight: 700 !important;
          clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
          transition: background 0.3s !important;
          border: none; cursor: pointer; font-size: 0.78rem; 
          letter-spacing: 2px; text-transform: uppercase;
        }
        .global-nav-cta:hover { background: #fff !important; color: #0a0a0a !important; }
        .global-nav-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .global-nav-hamburger span {
          display: block; width: 22px; height: 1.5px; background: #f5f5f0;
          transition: transform 0.3s, opacity 0.3s;
        }
        .global-nav-hamburger.is-open span:nth-child(1) {
          transform: translateY(6.5px) rotate(45deg);
        }
        .global-nav-hamburger.is-open span:nth-child(2) {
          opacity: 0;
        }
        .global-nav-hamburger.is-open span:nth-child(3) {
          transform: translateY(-6.5px) rotate(-45deg);
        }
        .global-nav-mobile-overlay {
          position: fixed;
          inset: 0;
          border: none;
          background: rgba(0,0,0,0.55);
          z-index: 98;
        }
        .global-nav-mobile {
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
        .global-nav-mobile.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .global-nav-mobile a,
        .global-nav-mobile button {
          font-size: 0.85rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #d1d1d1;
          text-decoration: none;
          border: none;
          background: transparent;
          text-align: left;
          padding: 10px 0;
        }
        .global-nav-mobile a.active {
          color: #f5c518;
        }
        .global-nav-mobile-cta {
          margin-top: 8px;
          background: #f5c518 !important;
          color: #0a0a0a !important;
          text-align: center !important;
          padding: 11px 18px !important;
          font-weight: 700;
          clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
        }
        @media (max-width: 768px) {
          .global-nav { padding: 16px 24px; }
          .global-nav-scrolled { padding: 12px 24px; }
          .global-nav-links { display: none; }
          .global-nav-hamburger { display: flex; }
        }
        @media (min-width: 769px) {
          .global-nav-mobile,
          .global-nav-mobile-overlay {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .global-nav,
          .global-nav-scrolled {
            padding-left: 14px;
            padding-right: 14px;
          }
          .global-nav-logo {
            font-size: 1.6rem;
            letter-spacing: 3px;
          }
          .global-nav-mobile {
            top: 58px;
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>
    </>
  );
}
